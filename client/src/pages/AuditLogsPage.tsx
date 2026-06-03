import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { api } = useAuth();

  const [logs, setLogs] = useState<any[]>([]);
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        module: filterModule,
        action: filterAction
      };
      const res = await api.get('/api/system/audits', { params });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterModule, filterAction]);

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">System Security Audit Log</h1>
          <p className="text-sm text-slate-500 font-medium font-sans">Read-only, immutable activity logs tracing asset transfers, login events, and contract updates.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="border border-slate-200 hover:bg-slate-100 p-2 rounded-lg transition-colors text-slate-500"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border p-4 rounded-xl flex gap-3 text-xs">
        <div className="flex-1 flex gap-3">
          <select 
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none"
          >
            <option value="">All Modules</option>
            <option value="Auth">Auth & Sign In</option>
            <option value="Assets">Assets</option>
            <option value="Contracts">Contracts</option>
            <option value="Vendors">Vendors</option>
            <option value="Users">Users</option>
            <option value="Administration">Administration</option>
          </select>

          <select 
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAIL">LOGIN_FAIL</option>
            <option value="ASSET_CREATE">ASSET_CREATE</option>
            <option value="ASSET_UPDATE">ASSET_UPDATE</option>
            <option value="ASSET_ASSIGN">ASSET_ASSIGN</option>
            <option value="ASSET_RETURN">ASSET_RETURN</option>
            <option value="ASSET_TRANSFER">ASSET_TRANSFER</option>
            <option value="CONTRACT_CREATE">CONTRACT_CREATE</option>
            <option value="CONTRACT_UPDATE">CONTRACT_UPDATE</option>
            <option value="CONTRACT_RENEW">CONTRACT_RENEW</option>
            <option value="USER_CREATE">USER_CREATE</option>
            <option value="USER_UPDATE">USER_UPDATE</option>
            <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">User Operator</th>
              <th className="px-6 py-3">Action Type</th>
              <th className="px-6 py-3 font-mono">Module</th>
              <th className="px-6 py-3">Description Notes</th>
              <th className="px-6 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">No logs found matching selection.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 text-slate-400 font-semibold">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <div className="font-bold text-slate-800">{log.user?.firstName} {log.user?.lastName}</div>
                    <div className="text-[10px] text-slate-450">{log.user?.email || 'System Operation'}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      log.action.includes('FAIL') || log.action.includes('BLOCKED') ? 'bg-red-50 text-red-700' :
                      log.action.includes('CREATE') ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-[10px] font-bold text-brand-650 bg-slate-50 border border-slate-100 rounded w-fit text-center">{log.module}</td>
                  <td className="px-6 py-3 text-slate-600 max-w-sm leading-normal">{log.notes}</td>
                  <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
