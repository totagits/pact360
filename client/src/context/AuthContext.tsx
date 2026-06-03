import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  office?: { name: string; code: string } | null;
  department?: { name: string; code: string } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  api: AxiosInstance;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set default baseURL
const API_URL = window.location.origin;
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Configure request interceptor to append authorization token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      const token = localStorage.getItem('pact360_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    // Configure response interceptor to handle token expiry (401) and refresh
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('pact360_refresh_token');

          if (refreshToken) {
            try {
              const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
              const { accessToken } = res.data;
              localStorage.setItem('pact360_access_token', accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, sign out
              localStorage.removeItem('pact360_access_token');
              localStorage.removeItem('pact360_refresh_token');
              setUser(null);
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Try to load user profile on mount
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('pact360_access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        localStorage.removeItem('pact360_access_token');
        localStorage.removeItem('pact360_refresh_token');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken, user: loggedUser } = res.data;

      localStorage.setItem('pact360_access_token', accessToken);
      localStorage.setItem('pact360_refresh_token', refreshToken);
      setUser(loggedUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Authentication failed.');
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      // Ignore failures on logging out
    } finally {
      localStorage.removeItem('pact360_access_token');
      localStorage.removeItem('pact360_refresh_token');
      setUser(null);
    }
  };

  const hasPermission = (code: string): boolean => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return user.permissions.includes(code);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
