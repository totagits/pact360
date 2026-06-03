import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, ArrowLeft, FileText, CheckCircle2, AlertTriangle, 
  Trash2, FileSpreadsheet, Calendar, User, DollarSign, Handshake, 
  Clock, ShieldAlert, Award, FileCode, X
} from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const { api, hasPermission } = useAuth();

  const [contracts, setContracts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Selected Contract detail state
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // Navigation View: "list", "add"
  const [view, setView] = useState<'list' | 'add'>('list');

  // Search/Filters
  const [search, setSearch] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [loading, setLoading] = useState(true);

  // Action Drawers
  const [showRenew, setShowRenew] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Action Form States
  const [renewForm, setRenewForm] = useState({ newEndDate: '', amendmentCost: '0', notes: '' });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', currency: 'USD', dueDate: '', notes: '' });

  // Creation Contract State
  const [contractForm, setContractForm] = useState({
    title: '', contractType: 'LTA', vendorId: '', projectId: '', grantId: '', donorId: '',
    startDate: '', endDate: '', value: '', paymentTerms: '30 Days Net', contractManagerId: '',
    departmentId: '', status: 'Active', noticePeriodDays: '30', deliverables: '',
    milestonesDesc: '', slaTerms: '', complianceRequirements: '', assetIds: [] as string[]
  });

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        vendorId: filterVendor,
        status: filterStatus
      };
      const res = await api.get('/api/contracts', { params });
      setContracts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [vendRes, projRes, grantsRes, donorRes, usersRes, assetsRes] = await Promise.all([
        api.get('/api/ngo/vendors'),
        api.get('/api/ngo/projects'),
        api.get('/api/ngo/grants'),
        api.get('/api/ngo/donors'),
        api.get('/api/auth/users'),
        api.get('/api/assets')
      ]);
      setVendors(vendRes.data);
      setProjects(projRes.data);
      setGrants(grantsRes.data);
      setDonors(donorRes.data);
      setUsers(usersRes.data);
      setAssets(assetsRes.data);
    } catch (err) {
      console.error('Error fetching contract metadata:', err);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [search, filterVendor, filterStatus]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchContractDetails = async (id: string) => {
    try {
      const res = await api.get(`/api/contracts/${id}`);
      setSelectedContract(res.data);
      setSelectedContractId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleContractClick = (id: string) => {
    fetchContractDetails(id);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/contracts', contractForm);
      setView('list');
      fetchContracts();
      // Reset form
      setContractForm({
        title: '', contractType: 'LTA', vendorId: '', projectId: '', grantId: '', donorId: '',
        startDate: '', endDate: '', value: '', paymentTerms: '30 Days Net', contractManagerId: '',
        departmentId: '', status: 'Active', noticePeriodDays: '30', deliverables: '',
        milestonesDesc: '', slaTerms: '', complianceRequirements: '', assetIds: [] as string[]
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenewContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      await api.post(`/api/contracts/${selectedContract.id}/renew`, renewForm);
      setShowRenew(false);
      fetchContractDetails(selectedContract.id);
      fetchContracts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      await api.post(`/api/contracts/${selectedContract.id}/milestones`, milestoneForm);
      setShowMilestone(false);
      setMilestoneForm({ title: '', description: '', dueDate: '' });
      fetchContractDetails(selectedContract.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMilestone = async (milestoneId: string, status: string) => {
    if (!selectedContract) return;
    try {
      await api.put(`/api/contracts/milestones/${milestoneId}`, { status, achievedDate: status === 'Achieved' ? new Date() : null });
      fetchContractDetails(selectedContract.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      await api.post(`/api/contracts/${selectedContract.id}/payments`, paymentForm);
      setShowPayment(false);
      setPaymentForm({ amount: '', currency: 'USD', dueDate: '', notes: '' });
      fetchContractDetails(selectedContract.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayInstallment = async (paymentId: string) => {
    if (!selectedContract) return;
    const inv = window.prompt('Enter Paid Invoice Receipt Number:');
    if (!inv) return;
    try {
      await api.put(`/api/contracts/payments/${paymentId}`, { invoiceNumber: inv });
      fetchContractDetails(selectedContract.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssetSelect = (assetId: string) => {
    const current = [...contractForm.assetIds];
    const idx = current.indexOf(assetId);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(assetId);
    }
    setContractForm({ ...contractForm, assetIds: current });
  };

  return (
    <div className="space-y-6 page-fade-in h-full flex flex-col justify-start">
      
      {/* Detail Modal/Drawer */}
      {selectedContract && selectedContractId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl border-l border-slate-200 animate-fade-in overflow-hidden">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <div>
                <div className="text-xs font-bold text-slate-450 uppercase tracking-widest">{selectedContract.contractType} SLA</div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedContract.title}</h2>
                <div className="text-xs font-mono font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded w-fit mt-1.5">
                  {selectedContract.contractNumber}
                </div>
              </div>
              <button 
                onClick={() => { setSelectedContractId(null); setSelectedContract(null); }}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable contract profile */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 border p-4 rounded-xl text-center">
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-0.5">Value</div>
                  <div className="text-base font-bold text-slate-800">{selectedContract.currency} {selectedContract.value.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-0.5">Renew Status</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5 capitalize">{selectedContract.renewalStatus.toLowerCase()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-0.5">Status</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    selectedContract.status === 'Active' ? 'bg-green-50 text-green-700' :
                    selectedContract.status === 'Expired' ? 'bg-red-50 text-red-700' : 'bg-slate-150 text-slate-650'
                  }`}>
                    {selectedContract.status}
                  </span>
                </div>
              </div>

              {/* General details */}
              <div className="grid grid-cols-2 gap-y-4 text-sm pt-4 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Vendor Supplier</div>
                  <div className="font-semibold text-slate-800">{selectedContract.vendor.name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Contract Manager</div>
                  <div className="font-semibold text-slate-800">
                    {selectedContract.contractManager?.firstName} {selectedContract.contractManager?.lastName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Start Date</div>
                  <div className="font-semibold text-slate-800">{new Date(selectedContract.startDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Expiration Date</div>
                  <div className="font-semibold text-slate-800">{new Date(selectedContract.endDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Linked Project</div>
                  <div className="font-semibold text-slate-800">{selectedContract.project?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Funding Grant</div>
                  <div className="font-semibold text-slate-800">{selectedContract.grant?.name || 'N/A'}</div>
                </div>
              </div>

              {/* Linked Assets list */}
              <div className="pt-6 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Covered Assets under SLA</h4>
                <div className="space-y-2">
                  {selectedContract.assets?.length === 0 ? (
                    <div className="text-xs text-slate-450 italic">No specific assets linked to this contract.</div>
                  ) : (
                    selectedContract.assets?.map((a: any) => (
                      <div key={a.id} className="flex justify-between items-center p-2.5 bg-slate-50 border rounded-lg text-xs">
                        <span className="font-bold text-slate-800">{a.name}</span>
                        <span className="font-mono text-brand-600 bg-brand-50 border px-1.5 py-0.5 rounded font-bold">{a.assetCode}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Milestones list */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 text-sm">Contract Milestones</h4>
                  {hasPermission('contracts:write') && (
                    <button 
                      onClick={() => setShowMilestone(true)}
                      className="text-brand-600 hover:text-brand-800 font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Milestone
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  {selectedContract.milestones?.length === 0 ? (
                    <div className="text-xs text-slate-450 italic">No milestones defined.</div>
                  ) : (
                    selectedContract.milestones?.map((m: any) => (
                      <div key={m.id} className="p-3 bg-slate-50 border rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{m.title}</div>
                          <div className="text-slate-400 mt-0.5">Due: {new Date(m.dueDate).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            m.status === 'Achieved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {m.status}
                          </span>
                          {hasPermission('contracts:write') && m.status !== 'Achieved' && (
                            <button 
                              onClick={() => handleUpdateMilestone(m.id, 'Achieved')}
                              className="bg-white border hover:bg-slate-100 p-1.5 rounded-lg text-slate-650"
                            >
                              ✓ Mark Completed
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payments log */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 text-sm">Payment Installments Schedule</h4>
                  {hasPermission('contracts:write') && (
                    <button 
                      onClick={() => setShowPayment(true)}
                      className="text-brand-600 hover:text-brand-800 font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Plan Payment
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  {selectedContract.payments?.length === 0 ? (
                    <div className="text-xs text-slate-450 italic">No payment terms defined.</div>
                  ) : (
                    selectedContract.payments?.map((p: any) => (
                      <div key={p.id} className="p-3 bg-slate-50 border rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{p.currency} {p.amount.toLocaleString()}</div>
                          <div className="text-slate-400 mt-0.5">Due: {new Date(p.dueDate).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            p.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {p.status}
                          </span>
                          {hasPermission('contracts:write') && p.status !== 'Paid' && (
                            <button 
                              onClick={() => handlePayInstallment(p.id)}
                              className="bg-white border hover:bg-slate-100 p-1.5 rounded-lg text-slate-650"
                            >
                              Pay Invoice
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Renew Action button */}
              {hasPermission('contracts:write') && (
                <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setShowRenew(true)}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-md"
                  >
                    Extend / Renew Contract SLA
                  </button>
                </div>
              )}

            </div>

            {/* Renews form dialog */}
            {showRenew && (
              <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6">
                <form onSubmit={handleRenewContract} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-fade-in space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Renew SLA Contract</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">New SLA End Date</label>
                    <input 
                      type="date"
                      value={renewForm.newEndDate}
                      onChange={(e) => setRenewForm({ ...renewForm, newEndDate: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Amendment Value Change (USD)</label>
                    <input 
                      type="number"
                      value={renewForm.amendmentCost}
                      onChange={(e) => setRenewForm({ ...renewForm, amendmentCost: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Renewal Justifications</label>
                    <textarea 
                      value={renewForm.notes}
                      onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm h-20"
                      placeholder="Extended SLA terms, performance validation details..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setShowRenew(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Confirm Renewal</button>
                  </div>
                </form>
              </div>
            )}

            {/* Milestones form dialog */}
            {showMilestone && (
              <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6">
                <form onSubmit={handleAddMilestone} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-fade-in space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Add Contract Milestone</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Milestone Name / Goal</label>
                    <input 
                      type="text"
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                      placeholder="e.g. Phase 2 hardware installation complete"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date</label>
                    <input 
                      type="date"
                      value={milestoneForm.dueDate}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setShowMilestone(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Save Milestone</button>
                  </div>
                </form>
              </div>
            )}

            {/* Payments form dialog */}
            {showPayment && (
              <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6">
                <form onSubmit={handleAddPayment} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-fade-in space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Plan Installment Payment</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (USD)</label>
                    <input 
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date</label>
                    <input 
                      type="date"
                      value={paymentForm.dueDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setShowPayment(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Schedule Installment</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Main panel routing layout */}
      {view === 'list' ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Procurement & SLA Contracts</h1>
              <p className="text-sm text-slate-500 font-medium">Monitor vendor agreements, payments schedule, and child-safeguarding compliance logs.</p>
            </div>
            <div className="flex gap-2">
              {hasPermission('contracts:write') && (
                <button 
                  onClick={() => setView('add')}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Contract
                </button>
              )}
            </div>
          </div>

          {/* Filtering */}
          <div className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-3 flex-shrink-0">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="Search contract name, number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            
            <div className="flex gap-3 text-xs">
              <select 
                value={filterVendor} 
                onChange={(e) => setFilterVendor(e.target.value)}
                className="border rounded-lg p-2 focus:outline-none"
              >
                <option value="">All Vendors</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-lg p-2 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Register Table */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Contract Number</th>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Vendor Supplier</th>
                    <th className="px-6 py-3">Total Value</th>
                    <th className="px-6 py-3">Expirations Date</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : contracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">No matching contracts found.</td>
                    </tr>
                  ) : (
                    contracts.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => handleContractClick(c.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3.5 text-brand-600 font-mono font-bold text-xs">{c.contractNumber}</td>
                        <td className="px-6 py-3.5 text-slate-900 font-bold">{c.title}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-500 font-semibold">{c.contractType}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-650">{c.vendor.name}</td>
                        <td className="px-6 py-3.5 text-xs font-semibold">{c.currency} {c.value.toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-500">
                          {new Date(c.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            c.status === 'Active' ? 'bg-green-50 text-green-700' :
                            c.status === 'Expired' ? 'bg-red-50 text-red-700' : 'bg-slate-150 text-slate-650'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Create Contract Form */
        <div className="bg-white border rounded-xl p-6 max-w-3xl mx-auto shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <button 
              onClick={() => setView('list')}
              className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-900">Add New Service Contract SLA</h1>
          </div>

          <form onSubmit={handleCreateContract} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contract Title / Brief</label>
                <input 
                  type="text" 
                  value={contractForm.title}
                  onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                  placeholder="e.g. Monrovia Office Internet SLA"
                  className="block w-full border rounded-lg p-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contract SLA Type</label>
                <select 
                  value={contractForm.contractType}
                  onChange={(e) => setContractForm({ ...contractForm, contractType: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm"
                >
                  <option value="LTA">LTA (Long Term Agreement)</option>
                  <option value="Service Agreement">Service Agreement</option>
                  <option value="Lease">Lease Agreement</option>
                  <option value="Procurement">Procurement Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Vendor Partner</label>
                <select 
                  value={contractForm.vendorId}
                  onChange={(e) => setContractForm({ ...contractForm, vendorId: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm"
                  required
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contract Manager Owner</label>
                <select 
                  value={contractForm.contractManagerId}
                  onChange={(e) => setContractForm({ ...contractForm, contractManagerId: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm"
                  required
                >
                  <option value="">-- Choose Manager --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Expiration Date</label>
                <input 
                  type="date" 
                  value={contractForm.endDate}
                  onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Total Contract Value (USD)</label>
                <input 
                  type="number" 
                  value={contractForm.value}
                  onChange={(e) => setContractForm({ ...contractForm, value: e.target.value })}
                  placeholder="0.00"
                  className="block w-full border rounded-lg p-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">SLA Notice Period (Days)</label>
                <input 
                  type="number" 
                  value={contractForm.noticePeriodDays}
                  onChange={(e) => setContractForm({ ...contractForm, noticePeriodDays: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Link to Project</label>
                <select 
                  value={contractForm.projectId}
                  onChange={(e) => setContractForm({ ...contractForm, projectId: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm"
                >
                  <option value="">-- Optional Project Link --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Link to Grant</label>
                <select 
                  value={contractForm.grantId}
                  onChange={(e) => setContractForm({ ...contractForm, grantId: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm"
                >
                  <option value="">-- Optional Grant Link --</option>
                  {grants.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-650 mb-2 uppercase tracking-wide">Covered Assets under SLA</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-lg max-h-36 overflow-y-auto bg-slate-50">
                  {assets.map(a => {
                    const isSelected = contractForm.assetIds.includes(a.id);
                    return (
                      <div 
                        key={a.id} 
                        onClick={() => handleAssetSelect(a.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          isSelected ? 'bg-brand-50 border-brand-200 font-semibold text-brand-700' : 'bg-white border-slate-200'
                        }`}
                      >
                        <input type="checkbox" checked={isSelected} readOnly className="rounded" />
                        <span className="truncate">{a.name} ({a.assetCode})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Compliance & Child Safeguarding Clauses</label>
                <textarea 
                  value={contractForm.complianceRequirements}
                  onChange={(e) => setContractForm({ ...contractForm, complianceRequirements: e.target.value })}
                  className="block w-full border rounded-lg p-2.5 text-sm h-20"
                  placeholder="Detail child protection training terms required for vendor drivers/contractors..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setView('list')}
                className="border px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-brand-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-600 transition-colors shadow-md"
              >
                Register Contract
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
