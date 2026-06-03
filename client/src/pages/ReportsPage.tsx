import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Eye, FileText, AlertTriangle, ShieldCheck, Download } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { api } = useAuth();

  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportsList = [
    { type: 'asset-register', title: 'Full Asset Register Report', desc: 'Detailed log of all tagged hardware, categories, conditions, and acquisition values.' },
    { type: 'contracts', title: 'Vendor Contracts & SLA Report', desc: 'List of all LTAs, leases, service agreements, renewal flags, and total values.' },
    { type: 'maintenance', title: 'Asset Maintenance & WO Cost Report', desc: 'Log of scheduled preventive schedules, corrective work orders, and overall expenses.' },
    { type: 'vendors', title: 'SLA Vendors Directory', desc: 'Register of all contractors, tax details, and average performance scores.' },
    { type: 'audit-logs', title: 'System Security Audit Trail', desc: 'Complete historical logs of user actions, login activities, and configuration edits.' }
  ];

  const handleViewReport = async (type: string) => {
    setActiveReport(type);
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/system/reports/${type}`);
      setReportData(res.data);
    } catch (err) {
      setError('Failed to aggregate report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = (type: string) => {
    const token = localStorage.getItem('pact360_access_token');
    // Direct link to backend API with token authentication
    const downloadUrl = `${window.location.origin}/api/system/reports/${type}?format=csv&authorization=Bearer ${token}`;
    
    // We can fetch it with authorization and trigger browser download
    api.get(`/api/system/reports/${type}?format=csv`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}-report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => {
        alert('Failed to download CSV report.');
      });
  };

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Performance Reporting Panel</h1>
        <p className="text-sm text-slate-500 font-medium">Generate real-time compliance matrices and export audit data directly to Excel/CSV.</p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsList.map((r) => (
          <div key={r.type} className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between card-hover-effect">
            <div>
              <div className="p-3 bg-brand-50 rounded-lg text-brand-600 w-fit mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1.5">{r.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{r.desc}</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleViewReport(r.type)}
                className="flex-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> View Report
              </button>
              <button 
                onClick={() => handleDownloadCsv(r.type)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Active Table Viewer */}
      {activeReport && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm animate-fade-in mt-6">
          <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
            <span className="font-bold text-slate-800 text-sm capitalize">
              Report Data: {activeReport.replace('-', ' ')} ({reportData.length} records)
            </span>
            <button 
              onClick={() => handleDownloadCsv(activeReport)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>

          <div className="overflow-x-auto max-h-[400px]">
            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs text-red-500">{error}</div>
            ) : reportData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-450 italic">No records to display.</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0">
                  <tr>
                    {Object.keys(reportData[0]).map((header) => (
                      <th key={header} className="px-6 py-3">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      {Object.values(row).map((val: any, colIdx) => (
                        <td key={colIdx} className="px-6 py-3 max-w-xs truncate">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
