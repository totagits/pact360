import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, SlidersHorizontal, ArrowLeft, UserPlus, 
  RefreshCw, Trash2, Calendar, FileText, FileSpreadsheet, MapPin, 
  User, Check, X, ShieldAlert, Award, FileCode, CheckCircle2 
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const { api, hasPermission, user: currentUser } = useAuth();

  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Selected Asset for Detail View
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Nav View: "list", "add", "edit"
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterOffice, setFilterOffice] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [loading, setLoading] = useState(true);

  // Modals / Drawers state
  const [showAssign, setShowAssign] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDispose, setShowDispose] = useState(false);

  // Workflow Form Fields
  const [assignForm, setAssignForm] = useState({ custodianId: '', returnDueDate: '', conditionOnAssignment: 'Good', notes: '' });
  const [transferForm, setTransferForm] = useState({ transferType: 'Location', destOfficeId: '', destProjectId: '', notes: '' });
  const [disposeForm, setDisposeForm] = useState({ reason: '', disposalMethod: 'Donation', estimatedProceeds: '0', notes: '' });

  // Add Asset Form Fields
  const [assetForm, setAssetForm] = useState({
    name: '', description: '', categoryId: '', serialNumber: '', model: '', manufacturer: '',
    purchaseOrder: '', invoiceNumber: '', purchaseDate: '', purchaseCost: '', supplierId: '',
    donorId: '', grantId: '', projectId: '', departmentId: '', officeId: '',
    condition: 'Good', status: 'Available', warrantyStart: '', warrantyEnd: '',
    usefulLifeYears: '5', insuranceDetails: '', notes: '', assetTag: ''
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        categoryId: filterCategory,
        officeId: filterOffice,
        projectId: filterProject,
        condition: filterCondition,
        status: filterStatus
      };
      const res = await api.get('/api/assets', { params });
      setAssets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catsRes, offRes, projRes, grantsRes, usersRes, donorRes, vendRes] = await Promise.all([
        api.get('/api/assets/categories'),
        api.get('/api/system/offices'),
        api.get('/api/ngo/projects'),
        api.get('/api/ngo/grants'),
        api.get('/api/auth/users'),
        api.get('/api/ngo/donors'),
        api.get('/api/ngo/vendors')
      ]);
      setCategories(catsRes.data);
      setOffices(offRes.data);
      setProjects(projRes.data);
      setGrants(grantsRes.data);
      setUsers(usersRes.data);
      setDonors(donorRes.data);
      setVendors(vendRes.data);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, filterCategory, filterOffice, filterProject, filterCondition, filterStatus]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchAssetDetails = async (id: string) => {
    try {
      const res = await api.get(`/api/assets/${id}`);
      setSelectedAsset(res.data);
      setSelectedAssetId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssetClick = (id: string) => {
    fetchAssetDetails(id);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/assets', assetForm);
      setView('list');
      fetchAssets();
      // Reset form
      setAssetForm({
        name: '', description: '', categoryId: '', serialNumber: '', model: '', manufacturer: '',
        purchaseOrder: '', invoiceNumber: '', purchaseDate: '', purchaseCost: '', supplierId: '',
        donorId: '', grantId: '', projectId: '', departmentId: '', officeId: '',
        condition: 'Good', status: 'Available', warrantyStart: '', warrantyEnd: '',
        usefulLifeYears: '5', insuranceDetails: '', notes: '', assetTag: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await api.post(`/api/assets/${selectedAsset.id}/assign`, assignForm);
      setShowAssign(false);
      fetchAssetDetails(selectedAsset.id);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnAsset = async (condition: string) => {
    if (!selectedAsset) return;
    if (!window.confirm('Confirm return of this asset to store?')) return;
    try {
      await api.post(`/api/assets/${selectedAsset.id}/return`, { conditionOnReturn: condition });
      fetchAssetDetails(selectedAsset.id);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await api.post(`/api/assets/${selectedAsset.id}/transfer`, transferForm);
      setShowTransfer(false);
      fetchAssetDetails(selectedAsset.id);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisposeAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await api.post(`/api/assets/${selectedAsset.id}/dispose`, disposeForm);
      setShowDispose(false);
      fetchAssetDetails(selectedAsset.id);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to retire/soft-delete this asset?')) return;
    try {
      await api.delete(`/api/assets/${id}`);
      setSelectedAssetId(null);
      setSelectedAsset(null);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  // Export to CSV
  const exportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Asset Code,Asset Tag,Name,Category,Status,Condition,Cost,Current Value,Location"].join(",") + "\n"
      + assets.map(a => [
          a.assetCode,
          a.assetTag,
          a.name,
          a.category.name,
          a.status,
          a.condition,
          a.purchaseCost,
          a.currentValue,
          a.office?.name || 'N/A'
        ].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "PACT360_Asset_Register.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 page-fade-in h-full flex flex-col justify-start">
      
      {/* Detail Modal/Drawer */}
      {selectedAsset && selectedAssetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl border-l border-slate-200 animate-fade-in overflow-hidden">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <div>
                <div className="text-xs font-bold text-slate-450 uppercase tracking-widest">{selectedAsset.category.name}</div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedAsset.name}</h2>
                <div className="text-xs font-mono font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded w-fit mt-1.5">
                  {selectedAsset.assetCode}
                </div>
              </div>
              <button 
                onClick={() => { setSelectedAssetId(null); setSelectedAsset(null); }}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Top Details Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Physical Tag</div>
                  <div className="text-sm font-semibold text-slate-800">{selectedAsset.assetTag}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Warranty Status</div>
                  <div className="text-xs font-semibold text-slate-800">
                    {selectedAsset.warrantyEnd ? new Date(selectedAsset.warrantyEnd).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Condition</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">{selectedAsset.condition}</span>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Lifecycle Status</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700">{selectedAsset.status}</span>
                </div>
              </div>

              {/* Custodian Box */}
              <div className="border border-slate-250/60 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Asset Custodian</h4>
                  <p className="text-xs text-slate-450 mt-0.5">Assigned staff user</p>
                </div>
                {selectedAsset.custodian ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">{selectedAsset.custodian.firstName} {selectedAsset.custodian.lastName}</div>
                      <div className="text-xs text-slate-450">{selectedAsset.custodian.email}</div>
                    </div>
                    {hasPermission('assets:assign') && (
                      <button 
                        onClick={() => handleReturnAsset(selectedAsset.condition)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Return Asset
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {hasPermission('assets:assign') && selectedAsset.status === 'Available' && (
                      <button 
                        onClick={() => setShowAssign(true)}
                        className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <UserPlus className="w-4 h-4" /> Assign Custodian
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Specific Metadata Fields */}
              <div className="grid grid-cols-2 gap-y-4 text-sm pt-4 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Purchase Price</div>
                  <div className="font-semibold text-slate-800">{selectedAsset.currency} {selectedAsset.purchaseCost.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Useful Life</div>
                  <div className="font-semibold text-slate-800">{selectedAsset.usefulLifeYears} Years</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Current Value (Depreciated)</div>
                  <div className="font-semibold text-slate-800">{selectedAsset.currency} {selectedAsset.currentValue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Office Location</div>
                  <div className="font-semibold text-slate-800">{selectedAsset.office?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Linked Project</div>
                  <div className="font-semibold text-slate-800">{selectedAsset.project?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Linked Grant</div>
                  <div className="font-semibold text-slate-800">{selectedAsset.grant?.name || 'N/A'}</div>
                </div>
              </div>

              {/* Actions drawer triggers */}
              <div className="flex gap-3 pt-6 border-t border-slate-100">
                {hasPermission('assets:transfer') && (
                  <button 
                    onClick={() => setShowTransfer(true)}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Transfer Asset
                  </button>
                )}
                {hasPermission('assets:dispose') && selectedAsset.status !== 'Disposed' && (
                  <button 
                    onClick={() => setShowDispose(true)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                  >
                    Initiate Disposal
                  </button>
                )}
                {hasPermission('assets:write') && (
                  <button 
                    onClick={() => handleSoftDelete(selectedAsset.id)}
                    className="p-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Timeline Log */}
              <div className="pt-6 border-t border-slate-150">
                <h4 className="font-bold text-slate-800 text-sm mb-4">Lifecycle Events Timeline</h4>
                <div className="relative border-l-2 border-slate-200 pl-4 ml-2 space-y-5">
                  {selectedAsset.lifecycleEvents?.map((event: any) => (
                    <div key={event.id} className="relative text-xs leading-normal">
                      <span className="absolute -left-[23px] top-1 bg-brand-500 text-white rounded-full p-1 border-2 border-white w-5 h-5 flex items-center justify-center font-bold">
                        ✓
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800 block text-sm">{event.eventType}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          {new Date(event.eventDate).toLocaleDateString()} • by {event.performedBy}
                        </span>
                        <p className="text-slate-500 mt-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sub-modals for Assignments / Transfers / Disposals */}
            {showAssign && (
              <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6">
                <form onSubmit={handleAssignAsset} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-fade-in space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Assign Custodian User</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Select User</label>
                    <select 
                      value={assignForm.custodianId}
                      onChange={(e) => setAssignForm({ ...assignForm, custodianId: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                      required
                    >
                      <option value="">-- Choose User --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Return Due Date</label>
                    <input 
                      type="date"
                      value={assignForm.returnDueDate}
                      onChange={(e) => setAssignForm({ ...assignForm, returnDueDate: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setShowAssign(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Assign</button>
                  </div>
                </form>
              </div>
            )}

            {showTransfer && (
              <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6">
                <form onSubmit={handleTransferAsset} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-fade-in space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Request Asset Transfer</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Transfer Type</label>
                    <select 
                      value={transferForm.transferType}
                      onChange={(e) => setTransferForm({ ...transferForm, transferType: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                    >
                      <option value="Location">To Office / Location</option>
                      <option value="Project">To Project / Grant</option>
                    </select>
                  </div>
                  {transferForm.transferType === 'Location' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Destination Office</label>
                      <select 
                        value={transferForm.destOfficeId}
                        onChange={(e) => setTransferForm({ ...transferForm, destOfficeId: e.target.value })}
                        className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                        required
                      >
                        <option value="">-- Choose Office --</option>
                        {offices.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Destination Project</label>
                      <select 
                        value={transferForm.destProjectId}
                        onChange={(e) => setTransferForm({ ...transferForm, destProjectId: e.target.value })}
                        className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                        required
                      >
                        <option value="">-- Choose Project --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Justification Notes</label>
                    <textarea 
                      value={transferForm.notes}
                      onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm h-20"
                      placeholder="Why is this transfer needed?"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setShowTransfer(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Submit Request</button>
                  </div>
                </form>
              </div>
            )}

            {showDispose && (
              <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6">
                <form onSubmit={handleDisposeAsset} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-fade-in space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Request Asset Disposal</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Reason for Disposal</label>
                    <input 
                      type="text"
                      value={disposeForm.reason}
                      onChange={(e) => setDisposeForm({ ...disposeForm, reason: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                      placeholder="e.g. End of useful life, damaged beyond repair"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Disposal Method</label>
                    <select 
                      value={disposeForm.disposalMethod}
                      onChange={(e) => setDisposeForm({ ...disposeForm, disposalMethod: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                    >
                      <option value="Donation">Donation</option>
                      <option value="Auction / Sale">Auction / Sale</option>
                      <option value="Recycling">Recycling</option>
                      <option value="Destruction">Destruction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Estimated Proceeds (USD)</label>
                    <input 
                      type="number"
                      value={disposeForm.estimatedProceeds}
                      onChange={(e) => setDisposeForm({ ...disposeForm, estimatedProceeds: e.target.value })}
                      className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setShowDispose(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
                    <button type="submit" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 shadow-sm">Submit Request</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Main Panel View */}
      {view === 'list' ? (
        <>
          {/* Page Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Capital Asset Register</h1>
              <p className="text-sm text-slate-500 font-medium">Verify, locate, and track hardware lifecycles across Liberia operations.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={exportCsv}
                className="border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export CSV
              </button>
              {hasPermission('assets:write') && (
                <button 
                  onClick={() => setView('add')}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Asset
                </button>
              )}
            </div>
          </div>

          {/* Filtering Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 flex-shrink-0">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="Search code, physical tag, serial, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            
            <div className="grid grid-cols-2 md:flex md:flex-row gap-3 text-xs">
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select 
                value={filterOffice} 
                onChange={(e) => setFilterOffice(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 focus:outline-none"
              >
                <option value="">All Offices</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>

              <select 
                value={filterCondition} 
                onChange={(e) => setFilterCondition(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 focus:outline-none"
              >
                <option value="">All Conditions</option>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="In Use">In Use</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>
          </div>

          {/* Asset Register Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Asset Code</th>
                    <th className="px-6 py-3">Tag / Serial</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Office Location</th>
                    <th className="px-6 py-3">Custodian</th>
                    <th className="px-6 py-3">Cost</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">No matching assets found.</td>
                    </tr>
                  ) : (
                    assets.map((asset) => (
                      <tr 
                        key={asset.id} 
                        onClick={() => handleAssetClick(asset.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3.5 text-brand-600 font-mono font-bold text-xs">{asset.assetCode}</td>
                        <td className="px-6 py-3.5">
                          <div className="text-xs text-slate-900 font-semibold">{asset.assetTag}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{asset.serialNumber || 'No SN'}</div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-900 font-bold">{asset.name}</td>
                        <td className="px-6 py-3.5 text-xs font-semibold text-slate-500">{asset.category.name}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">{asset.office?.name || 'N/A'}</td>
                        <td className="px-6 py-3.5">
                          {asset.custodian ? (
                            <div className="text-xs">
                              <span className="font-semibold block text-slate-900">{asset.custodian.firstName} {asset.custodian.lastName}</span>
                              <span className="text-[10px] text-slate-400">{asset.custodian.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Store</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-xs font-semibold">{asset.currency} {asset.purchaseCost.toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            asset.status === 'Available' ? 'bg-green-50 text-green-700' :
                            asset.status === 'Assigned' ? 'bg-blue-50 text-blue-700' :
                            asset.status === 'Under Maintenance' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {asset.status}
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
        /* Create Asset Form */
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl mx-auto shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <button 
              onClick={() => setView('list')}
              className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-900">Add New Capital Asset</h1>
          </div>

          <form onSubmit={handleAddAsset} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Asset Name / Item Description</label>
                <input 
                  type="text" 
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="e.g. Perkins Generator 10kVA"
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Asset Category</label>
                <select 
                  value={assetForm.categoryId}
                  onChange={(e) => setAssetForm({ ...assetForm, categoryId: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Physical Asset Tag Number</label>
                <input 
                  type="text" 
                  value={assetForm.assetTag}
                  onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                  placeholder="e.g. PLAN-TAG-4928"
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Serial Number</label>
                <input 
                  type="text" 
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                  placeholder="SN-XXXX"
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Purchase Date</label>
                <input 
                  type="date" 
                  value={assetForm.purchaseDate}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Purchase Cost (USD)</label>
                <input 
                  type="number" 
                  value={assetForm.purchaseCost}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                  placeholder="0.00"
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Office / Location</label>
                <select 
                  value={assetForm.officeId}
                  onChange={(e) => setAssetForm({ ...assetForm, officeId: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                  required
                >
                  <option value="">-- Choose Office --</option>
                  {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Project</label>
                <select 
                  value={assetForm.projectId}
                  onChange={(e) => setAssetForm({ ...assetForm, projectId: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Useful Life (Years)</label>
                <input 
                  type="number" 
                  value={assetForm.usefulLifeYears}
                  onChange={(e) => setAssetForm({ ...assetForm, usefulLifeYears: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Funding Donor</label>
                <select 
                  value={assetForm.donorId}
                  onChange={(e) => setAssetForm({ ...assetForm, donorId: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                >
                  <option value="">-- Choose Donor --</option>
                  {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Purchase Order (PO)</label>
                <input 
                  type="text" 
                  value={assetForm.purchaseOrder}
                  onChange={(e) => setAssetForm({ ...assetForm, purchaseOrder: e.target.value })}
                  placeholder="PO-XXXX"
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Invoice Number</label>
                <input 
                  type="text" 
                  value={assetForm.invoiceNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, invoiceNumber: e.target.value })}
                  placeholder="INV-XXXX"
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Detailed Description & Specifications</label>
                <textarea 
                  value={assetForm.description}
                  onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                  className="block w-full border border-slate-350 rounded-lg p-2.5 text-sm h-20"
                  placeholder="Detail manufacturer, warranty serial lines, inclusions..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
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
                Register Asset
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
