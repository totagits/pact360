import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Calendar, CheckSquare, Settings, Play, CheckCircle, 
  X, AlertTriangle, FileSpreadsheet, User, UserCheck, Wrench, ShieldAlert 
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const { api, hasPermission } = useAuth();

  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'schedules'>('orders');
  const [showAddWO, setShowAddWO] = useState(false);
  const [showCompleteWO, setShowCompleteWO] = useState(false);
  const [selectedWO, setSelectedWO] = useState<any>(null);

  // Completed Form State
  const [completeForm, setCompleteForm] = useState({ cost: '', completionReport: '', checklistState: [] as string[] });

  // Creation WO State
  const [woForm, setWoForm] = useState({
    assetId: '', type: 'Preventive', description: '', vendorId: '', priority: 'Medium', scheduledDate: '',
    checklist: ['Check system casing', 'Test functionality', 'Clean vents/filters', 'Record performance logs']
  });

  const fetchData = async () => {
    try {
      const [woRes, schedRes, assetsRes, vendorsRes] = await Promise.all([
        api.get('/api/maintenance/work-orders'),
        api.get('/api/maintenance/schedules'),
        api.get('/api/assets'),
        api.get('/api/ngo/vendors')
      ]);
      setWorkOrders(woRes.data);
      setSchedules(schedRes.data);
      setAssets(assetsRes.data);
      setVendors(vendorsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/maintenance/work-orders', woForm);
      setShowAddWO(false);
      fetchData();
      // Reset form
      setWoForm({
        assetId: '', type: 'Preventive', description: '', vendorId: '', priority: 'Medium', scheduledDate: '',
        checklist: ['Check system casing', 'Test functionality', 'Clean vents/filters', 'Record performance logs']
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWO = async (id: string) => {
    try {
      await api.post(`/api/maintenance/work-orders/${id}/start`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCompleteWO = (wo: any) => {
    setSelectedWO(wo);
    let initialChecklist: string[] = [];
    try {
      initialChecklist = JSON.parse(wo.checklist);
    } catch (e) {
      initialChecklist = [];
    }
    setCompleteForm({
      cost: String(wo.cost || 0),
      completionReport: '',
      checklistState: initialChecklist
    });
    setShowCompleteWO(true);
  };

  const handleChecklistToggle = (item: string) => {
    const current = [...completeForm.checklistState];
    const idx = current.indexOf(item);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(item);
    }
    setCompleteForm({ ...completeForm, checklistState: current });
  };

  const handleCompleteWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;
    try {
      await api.post(`/api/maintenance/work-orders/${selectedWO.id}/complete`, completeForm);
      setShowCompleteWO(false);
      setSelectedWO(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Maintenance & Equipment Services</h1>
          <p className="text-sm text-slate-500 font-medium font-sans">Manage generator overhauls, car maintenance logs, and IT diagnostic tickets.</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('maintenance:write') && (
            <button 
              onClick={() => setShowAddWO(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Issue Work Order
            </button>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200 flex gap-4">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'orders' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          Active Work Orders
        </button>
        <button 
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'schedules' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          Preventive Schedules
        </button>
      </div>

      {/* Content Panes */}
      {activeTab === 'orders' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Asset Code</th>
                <th className="px-6 py-3">Equipment / Item</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Scheduled Date</th>
                <th className="px-6 py-3">Vendor Supplier</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No active work orders.</td>
                </tr>
              ) : (
                workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-brand-600 font-mono font-bold text-xs">{wo.asset.assetCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{wo.asset.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{wo.description}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{wo.type}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        wo.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                        wo.priority === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-650'
                      }`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(wo.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {wo.vendor ? (
                        <div>
                          <div className="font-semibold text-slate-800">{wo.vendor.name}</div>
                          <div className="text-[10px] text-slate-450">{wo.vendor.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Internal Officer</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        wo.status === 'Completed' ? 'bg-green-50 text-green-700' :
                        wo.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                        wo.status === 'Scheduled' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasPermission('maintenance:write') && (
                        <div className="flex justify-end gap-1.5">
                          {wo.status === 'Scheduled' && (
                            <button 
                              onClick={() => handleStartWO(wo.id)}
                              className="bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-100 text-xs font-semibold px-2 py-1 rounded-md transition-all flex items-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5" /> Start
                            </button>
                          )}
                          {wo.status === 'In Progress' && (
                            <button 
                              onClick={() => handleOpenCompleteWO(wo)}
                              className="bg-green-550 hover:bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Close Out
                            </button>
                          )}
                          {wo.status === 'Completed' && (
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border px-2 py-0.5 rounded">Checked Out</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Preventive Schedules List */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Inspection Description</th>
                <th className="px-6 py-3">Frequency</th>
                <th className="px-6 py-3">Last Serviced</th>
                <th className="px-6 py-3">Next Due Date</th>
                <th className="px-6 py-3">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No preventive intervals configured.</td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{s.asset.name}</div>
                      <div className="text-xs text-brand-600 font-mono mt-0.5">{s.asset.assetCode}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-sm leading-relaxed">{s.description}</td>
                    <td className="px-6 py-4 text-xs text-slate-700">Every {s.frequencyDays} Days</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {s.lastRunDate ? new Date(s.lastRunDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                      {new Date(s.nextDueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        s.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-150 text-slate-650'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Issuing WO Dialog */}
      {showAddWO && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleCreateWO} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200 animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-lg">Issue Maintenance Work Order</h3>
              <button type="button" onClick={() => setShowAddWO(false)} className="text-slate-400 hover:text-slate-650"><X className="w-5 h-5" /></button>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select Asset / Equipment</label>
              <select 
                value={woForm.assetId}
                onChange={(e) => setWoForm({ ...woForm, assetId: e.target.value })}
                className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                required
              >
                <option value="">-- Choose Asset --</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.assetCode})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">WO Type</label>
                <select 
                  value={woForm.type}
                  onChange={(e) => setWoForm({ ...woForm, type: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                >
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                <select 
                  value={woForm.priority}
                  onChange={(e) => setWoForm({ ...woForm, priority: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Service SLA Vendor</label>
              <select 
                value={woForm.vendorId}
                onChange={(e) => setWoForm({ ...woForm, vendorId: e.target.value })}
                className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
              >
                <option value="">-- Internal Logistics Officer --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.serviceCategory})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Scheduled Date</label>
              <input 
                type="date"
                value={woForm.scheduledDate}
                onChange={(e) => setWoForm({ ...woForm, scheduledDate: e.target.value })}
                className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fault Description / Requirements</label>
              <textarea 
                value={woForm.description}
                onChange={(e) => setWoForm({ ...woForm, description: e.target.value })}
                className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm h-20"
                placeholder="Detail the engine knock, screen damage, solar output drops..."
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button type="button" onClick={() => setShowAddWO(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Issue Order</button>
            </div>
          </form>
        </div>
      )}

      {/* Completion Close-Out Dialog */}
      {showCompleteWO && selectedWO && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleCompleteWO} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200 animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-base">Close-Out Work Order</h3>
              <button type="button" onClick={() => { setShowCompleteWO(false); setSelectedWO(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-650">
              <span className="font-bold text-slate-800 block mb-0.5">Asset: {selectedWO.asset.name}</span>
              <span>Details: {selectedWO.description}</span>
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-2">Service Checklist Actions</label>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {JSON.parse(selectedWO.checklist || '[]').map((item: string, idx: number) => {
                  const isChecked = completeForm.checklistState.includes(item);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleChecklistToggle(item)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                        isChecked ? 'bg-green-600 border-green-650 text-white' : 'border-slate-350 bg-white'
                      }`}>
                        {isChecked && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                      <span className="text-xs font-semibold">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Final Service Cost (USD)</label>
              <input 
                type="number"
                value={completeForm.cost}
                onChange={(e) => setCompleteForm({ ...completeForm, cost: e.target.value })}
                className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Completion Summary / Report</label>
              <textarea 
                value={completeForm.completionReport}
                onChange={(e) => setCompleteForm({ ...completeForm, completionReport: e.target.value })}
                className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm h-20"
                placeholder="Details of replacements made, engine lubricants used, testing logs..."
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button type="button" onClick={() => { setShowCompleteWO(false); setSelectedWO(null); }} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 shadow-sm">Submit Reports</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
