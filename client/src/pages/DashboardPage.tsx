import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Box, FileText, AlertTriangle, PenTool, CheckCircle, 
  DollarSign, Activity, HelpCircle, Calendar, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#0076c0', '#00875a', '#ffab00', '#de350b', '#7e22ce', '#3b82f6', '#ef4444'];

export const DashboardPage: React.FC = () => {
  const { api } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/dashboard');
        setData(res.data);
      } catch (err) {
        setError('Failed to fetch dashboard intelligence.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-200 text-center max-w-lg mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h3 className="font-bold text-lg">System Error</h3>
        <p className="mt-1 text-sm">{error || 'Unknown exception.'}</p>
      </div>
    );
  }

  const { metrics, charts, upcomingMaintenance, recentActivities } = data;

  return (
    <div className="space-y-8 page-fade-in">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Executive Performance Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium">Real-time asset value and procurement compliance metrics.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Assets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 card-hover-effect">
          <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalAssets}</div>
            <div className="text-xs text-slate-500 font-semibold">Total Assets Tracked</div>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 card-hover-effect">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.activeContracts} / {metrics.totalContracts}</div>
            <div className="text-xs text-slate-500 font-semibold">Active SLAs & LTA Contracts</div>
          </div>
        </div>

        {/* Maintenance Warnings */}
        <div className={`bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4 card-hover-effect ${metrics.overdueMaintenanceCount > 0 ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200'}`}>
          <div className={`p-3 rounded-lg ${metrics.overdueMaintenanceCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{metrics.overdueMaintenanceCount}</div>
            <div className="text-xs text-slate-500 font-semibold">Overdue Maintenance</div>
          </div>
        </div>

        {/* Financial Net Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 card-hover-effect">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              USD {metrics.totalCurrentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Asset Book Value (Depreciated)</div>
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Assets by Category Bar Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-base mb-4">Capital Value distribution by Category (USD)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.assetsByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Cost']} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <Bar dataKey="value" fill="#0076c0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Conditions Pie Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 text-base mb-4">Physical Asset Condition</h3>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.assetsByCondition.filter((c: any) => c.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {charts.assetsByCondition.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'AssetsCount']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-slate-800">{metrics.totalAssets}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Tagged</div>
            </div>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 text-xs mt-4 pt-4 border-t border-slate-100">
            {charts.assetsByCondition.map((c: any, index: number) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-slate-500 font-medium truncate">{c.name} ({c.count})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Tables Row: Calendar & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Upcoming Maintenance schedules */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" /> Upcoming Maintenance Tasks
            </h3>
            <div className="divide-y divide-slate-100">
              {upcomingMaintenance.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No scheduled tasks for this period.</div>
              ) : (
                upcomingMaintenance.map((wo: any) => (
                  <div key={wo.id} className="py-3 flex justify-between items-center gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-slate-800">{wo.asset.name}</div>
                      <div className="text-xs text-slate-450 mt-0.5">{wo.asset.assetCode} • {wo.type}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        wo.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                        wo.priority === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-slate-150 text-slate-650'
                      }`}>
                        {wo.priority}
                      </span>
                      <div className="text-xs text-slate-500 font-medium mt-1">
                        {new Date(wo.scheduledDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <Link to="/maintenance" className="text-brand-600 hover:text-brand-800 font-semibold text-xs mt-4 flex items-center gap-1 justify-end">
            Open Maintenance Log <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Audit Trails Logs */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" /> Recent System Activities
            </h3>
            <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
              {recentActivities.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No recent logs recorded.</div>
              ) : (
                recentActivities.map((log: any) => (
                  <div key={log.id} className="flex gap-3 text-xs leading-normal">
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900">{log.user?.email || 'System'}</span>
                      <span className="text-slate-500 mx-1">{log.action.replace('_', ' ')}</span>
                      <span className="text-slate-400 font-medium font-mono bg-slate-50 border border-slate-150 px-1 rounded">({log.module})</span>
                      <p className="text-slate-500 mt-0.5">{log.notes}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <Link to="/audit-logs" className="text-brand-600 hover:text-brand-800 font-semibold text-xs mt-4 flex items-center gap-1 justify-end">
            Open System Logs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

    </div>
  );
};
