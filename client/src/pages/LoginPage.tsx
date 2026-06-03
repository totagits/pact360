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
          <img className="mx-auto h-16 w-auto" src="/logo.png" alt="Plan International Logo" />
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">Sign in to PACT360</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Project Asset and Contract Tracking 360° Management System
          </p>
          <div className="text-xs text-brand-600 font-bold tracking-wide uppercase mt-1">Track. Manage. Comply. Deliver.</div>
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
            <Key className="w-4 h-4" /> Demo Sandbox Profiles (Click to Load)
          </div>
          <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2 text-[9px] pr-1 scrollbar-thin">
            {[
              { role: 'Super Admin', email: 'admin@pact360.local', pass: 'Admin@12345' },
              { role: 'System Administrator', email: 'sys.admin@pact360.local', pass: 'Admin@12345' },
              { role: 'Country Director / Executive', email: 'country.director@pact360.local', pass: 'Director@12345' },
              { role: 'Head of Operations', email: 'operations.head@pact360.local', pass: 'Admin@12345' },
              { role: 'Procurement Manager', email: 'procurement.manager@pact360.local', pass: 'Procurement@12345' },
              { role: 'Asset Manager', email: 'asset.manager@pact360.local', pass: 'Asset@12345' },
              { role: 'Logistics Officer', email: 'logistics.officer@pact360.local', pass: 'Logistics@12345' },
              { role: 'Finance Manager', email: 'finance.manager@pact360.local', pass: 'Finance@12345' },
              { role: 'Grants Manager', email: 'grants.manager@pact360.local', pass: 'Grants@12345' },
              { role: 'Project Manager', email: 'project.manager@pact360.local', pass: 'Project@12345' },
              { role: 'Contract Manager', email: 'contract.manager@pact360.local', pass: 'Contract@12345' },
              { role: 'Maintenance Officer', email: 'maintenance.officer@pact360.local', pass: 'Maintenance@12345' },
              { role: 'Department Head', email: 'department.head@pact360.local', pass: 'Dept@12345' },
              { role: 'Field Office User', email: 'field.user@pact360.local', pass: 'Field@12345' },
              { role: 'Auditor', email: 'auditor@pact360.local', pass: 'Auditor@12345' },
              { role: 'Read-Only Viewer', email: 'viewer@pact360.local', pass: 'Viewer@12345' }
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => loadDemoUser(u.email, u.pass)}
                className="border border-slate-200 rounded-lg p-1.5 text-left hover:bg-brand-50 hover:border-brand-200 transition-colors"
              >
                <div className="font-bold text-slate-800 truncate">{u.role}</div>
                <div className="text-slate-500 truncate">{u.email}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
