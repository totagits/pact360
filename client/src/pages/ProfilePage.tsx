import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, Key, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, api } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      await api.put(`/api/auth/users/${user?.id}`, {
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        roleId: user?.id ? undefined : '', // Bypass role updates
        password
      });
      setStatusMsg({ type: 'success', text: 'Password updated successfully.' });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 page-fade-in max-w-lg mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Account Profile</h1>
        <p className="text-sm text-slate-500 font-medium">Manage your personal settings and security credentials.</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-inner">
            {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">{user?.firstName} {user?.lastName}</h3>
            <span className="text-xs text-brand-600 font-semibold">{user?.role}</span>
          </div>
        </div>

        <div className="pt-4 border-t divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between items-center">
            <span className="text-slate-450 font-semibold">Corporate Email</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-450" /> {user?.email}</span>
          </div>
          <div className="py-2.5 flex justify-between items-center">
            <span className="text-slate-450 font-semibold">Assigned Office Location</span>
            <span className="font-bold text-slate-800">{user?.office?.name || 'Country Office Store'}</span>
          </div>
          <div className="py-2.5 flex justify-between items-center">
            <span className="text-slate-450 font-semibold">Assigned Department</span>
            <span className="font-bold text-slate-800">{user?.department?.name || 'Operations'}</span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <form onSubmit={handlePasswordChange} className="bg-white border p-5 rounded-xl shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <Key className="w-4 h-4 text-brand-600" /> Change Security Password
        </h3>

        {statusMsg && (
          <div className={`p-3 rounded-lg text-xs font-semibold border ${
            statusMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {statusMsg.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">New Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-brand-505 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-colors shadow-md flex items-center gap-1.5 ml-auto"
        >
          {loading ? 'Updating...' : <><Save className="w-3.5 h-3.5" /> Save Password</>}
        </button>
      </form>

    </div>
  );
};
