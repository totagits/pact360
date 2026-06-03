import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, Key } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoUser = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center">
          <img className="mx-auto h-12 w-auto" src="/logo.png" alt="Plan International Logo" />
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">Sign in to PACT360</h2>
          <p className="mt-2 text-sm text-slate-500">
            Project Asset, Contract, & Lifecycle Tracking
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2.5 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Authentication failed</span>
              <p className="mt-0.5 text-red-600/90">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full px-3 py-2.5 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="name@pact360.local"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full px-3 py-2.5 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors shadow-md flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials Quick-click Panel */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <Key className="w-4 h-4" /> Demo Sandbox Profiles
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => loadDemoUser('admin@pact360.local', 'Admin@12345')}
              className="border border-slate-200 rounded-lg p-2 text-left hover:bg-brand-50 hover:border-brand-200 transition-colors"
            >
              <div className="font-semibold text-slate-800">Super Admin</div>
              <div className="text-slate-500">admin@pact360.local</div>
            </button>
            <button
              type="button"
              onClick={() => loadDemoUser('asset.manager@pact360.local', 'Asset@12345')}
              className="border border-slate-200 rounded-lg p-2 text-left hover:bg-brand-50 hover:border-brand-200 transition-colors"
            >
              <div className="font-semibold text-slate-800">Asset Manager</div>
              <div className="text-slate-500">asset.manager@pact360.local</div>
            </button>
            <button
              type="button"
              onClick={() => loadDemoUser('contract.manager@pact360.local', 'Contract@12345')}
              className="border border-slate-200 rounded-lg p-2 text-left hover:bg-brand-50 hover:border-brand-200 transition-colors"
            >
              <div className="font-semibold text-slate-800">Contract Manager</div>
              <div className="text-slate-500">contract.manager@pact360.local</div>
            </button>
            <button
              type="button"
              onClick={() => loadDemoUser('auditor@pact360.local', 'Auditor@12345')}
              className="border border-slate-200 rounded-lg p-2 text-left hover:bg-brand-50 hover:border-brand-200 transition-colors"
            >
              <div className="font-semibold text-slate-800">Auditor</div>
              <div className="text-slate-500">auditor@pact360.local</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
