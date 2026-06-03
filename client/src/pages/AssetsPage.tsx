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

  // Sub-tabs navigation state
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'migration' | 'verification'>('register');

  // Data Migration Panel states
  const [importBatches, setImportBatches] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importBatchName, setImportBatchName] = useState('');
  const [importing, setImporting] = useState(false);

  // Verification Campaigns states
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignAssets, setCampaignAssets] = useState<any[]>([]);
  const [campaignVariance, setCampaignVariance] = useState<any>(null);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', startDate: '', endDate: '', assignedTeam: 'Logistics Team', officeId: '' });
  const [verifyingAssetId, setVerifyingAssetId] = useState<string | null>(null);
  const [verificationForm, setVerificationForm] = useState({ status: 'Verified', condition: 'Good', notes: '', evidenceUrl: '' });

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

  const fetchImportBatches = async () => {
    try {
      const res = await api.get('/api/assets/import/batches');
      setImportBatches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/api/assets/verification/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaignAssets = async (campaignId: string) => {
    try {
      const res = await api.get(`/api/assets/verification/campaigns/${campaignId}/assets`);
      setCampaignAssets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaignVariance = async (campaignId: string) => {
    try {
      const res = await api.get(`/api/assets/verification/campaigns/${campaignId}/variance`);
      setCampaignVariance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'migration') {
      fetchImportBatches();
    } else if (activeSubTab === 'verification') {
      fetchCampaigns();
    }
  }, [activeSubTab]);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportBatchName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        setImporting(true);
        const res = await api.post('/api/assets/import/preview', { rows });
        setPreviewData(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to parse CSV file. Ensure it is a valid CSV.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    
    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const obj: any = {};
      headers.forEach((header, index) => {
        const cleanHeader = header.replace(/^["']|["']$/g, '');
        obj[cleanHeader] = values[index]?.replace(/^["']|["']$/g, '') || '';
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleCommitImport = async () => {
    if (!previewData) return;
    try {
      setImporting(true);
      await api.post('/api/assets/import/commit', {
        batchName: importBatchName,
        fileName: 'spreadsheet.csv',
        rows: previewData.rows
      });
      alert('Data migration batch committed successfully!');
      setPreviewData(null);
      fetchImportBatches();
      fetchAssets();
    } catch (err) {
      console.error(err);
      alert('Error committing import batch.');
    } finally {
      setImporting(false);
    }
  };

  const handleRollbackBatch = async (batchId: string) => {
    if (!window.confirm('WARNING: Rolling back will delete all assets imported under this batch. Proceed?')) return;
    try {
      await api.post(`/api/assets/import/batches/${batchId}/rollback`);
      alert('Batch rolled back successfully.');
      fetchImportBatches();
      fetchAssets();
    } catch (err) {
      console.error(err);
      alert('Failed to rollback batch.');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/assets/verification/campaigns', campaignForm);
      setShowAddCampaign(false);
      setCampaignForm({ name: '', startDate: '', endDate: '', assignedTeam: 'Logistics Team', officeId: '' });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert('Failed to create campaign.');
    }
  };

  const handleVerifyAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId || !verifyingAssetId) return;
    try {
      await api.post(`/api/assets/verification/campaigns/${selectedCampaignId}/verify`, {
        assetId: verifyingAssetId,
        ...verificationForm
      });
      setVerifyingAssetId(null);
      setVerificationForm({ status: 'Verified', condition: 'Good', notes: '', evidenceUrl: '' });
      fetchCampaignAssets(selectedCampaignId);
      fetchCampaignVariance(selectedCampaignId);
    } catch (err) {
      console.error(err);
      alert('Failed to log count verification.');
    }
  };

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

              {/* Visual Pipeline */}
              <div className="pt-6 border-t border-slate-150">
                <h4 className="font-bold text-slate-800 text-sm mb-4 font-sans">Lifecycle Phase Status</h4>
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-4 pt-1 mb-4 scrollbar-thin">
                  {[
                    { label: 'Acquired', event: 'Acquisition' },
                    { label: 'Registered', event: 'Registration' },
                    { label: 'Tagged', event: 'Tagging' },
                    { label: 'Assigned', event: 'Assignment' },
                    { label: 'Verified', event: 'Verification' },
                    { label: 'Transferred', event: 'TransferApproved' },
                    { label: 'Retired', event: 'Retirement' },
                    { label: 'Disposed', event: 'DisposalRequest' }
                  ].map((step, idx) => {
                    const isCompleted = selectedAsset.lifecycleEvents?.some((e: any) => e.eventType.toLowerCase() === step.event.toLowerCase()) || 
                      (step.event === 'Acquisition' && selectedAsset.status !== 'Draft') ||
                      (step.event === 'Registration' && selectedAsset.status !== 'Draft');
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 min-w-[70px]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                          isCompleted 
                            ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                            : 'bg-slate-150 border-slate-200 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className={`text-[9px] font-bold mt-1.5 whitespace-nowrap text-center ${
                          isCompleted ? 'text-green-600' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
          {/* Sub-Tabs */}
          <div className="border-b border-slate-200 flex gap-4 mb-5 flex-shrink-0">
            <button 
              onClick={() => setActiveSubTab('register')} 
              className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${activeSubTab === 'register' ? 'border-brand-500 text-brand-650 font-bold' : 'border-transparent text-slate-400'}`}
            >
              Asset Register
            </button>
            <button 
              onClick={() => setActiveSubTab('migration')} 
              className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${activeSubTab === 'migration' ? 'border-brand-500 text-brand-650 font-bold' : 'border-transparent text-slate-400'}`}
            >
              Data Migration (Excel/CSV)
            </button>
            <button 
              onClick={() => setActiveSubTab('verification')} 
              className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${activeSubTab === 'verification' ? 'border-brand-500 text-brand-650 font-bold' : 'border-transparent text-slate-400'}`}
            >
              Physical Audits & Counts
            </button>
          </div>

          {activeSubTab === 'register' && (
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
          )}

          {activeSubTab === 'migration' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Excel/CSV Data Migration</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Upload your asset spreadsheet to preview and validate entries row-by-row before committing them to the active registry. Unrecognized office locations or duplicate asset tags will be flagged.
                  </p>
                  
                  <div className="border-2 border-dashed border-slate-250 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors relative cursor-pointer">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleCSVUpload}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-700 block">Click to select or drag asset CSV file</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Supported format: CSV (UTF-8)</span>
                  </div>

                  {importing && (
                    <div className="text-xs text-brand-600 font-semibold animate-pulse flex items-center gap-1.5 justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Validating and mapping data columns...
                    </div>
                  )}

                  {previewData && (
                    <div className="bg-slate-50 p-4 border rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Batch Preview Name</span>
                        <input 
                          type="text" 
                          value={importBatchName}
                          onChange={(e) => setImportBatchName(e.target.value)}
                          className="border rounded px-2 py-1 font-semibold text-slate-800 bg-white text-xs w-48"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white p-2 border rounded">
                          <span className="block font-bold text-slate-700">{previewData.totalCount}</span>
                          <span className="text-[9px] text-slate-400 font-medium uppercase">Total Rows</span>
                        </div>
                        <div className="bg-green-50 p-2 border border-green-150 rounded">
                          <span className="block font-bold text-green-700">{previewData.validCount}</span>
                          <span className="text-[9px] text-green-500 font-medium uppercase">Valid</span>
                        </div>
                        <div className="bg-red-50 p-2 border border-red-150 rounded">
                          <span className="block font-bold text-red-700">{previewData.invalidCount}</span>
                          <span className="text-[9px] text-red-500 font-medium uppercase">Failed</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleCommitImport}
                        disabled={previewData.validCount === 0 || importing}
                        className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 text-white font-bold py-2.5 rounded-lg text-xs shadow-sm transition-colors"
                      >
                        Commit Valid {previewData.validCount} Assets to Register
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Migration Batch History & Rollbacks</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Review previously committed asset imports. Rollbacks will cleanly delete all assets registered under the chosen batch.
                  </p>
                  
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-2">
                    {importBatches.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-8">No import batches recorded.</div>
                    ) : (
                      importBatches.map((batch) => (
                        <div key={batch.id} className="py-3 flex justify-between items-center gap-4">
                          <div>
                            <div className="text-xs font-bold text-slate-800">{batch.batchName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {batch.fileName} • {batch.rowCount} rows • by {batch.importedBy}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {new Date(batch.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              batch.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {batch.status}
                            </span>
                            {batch.status === 'Completed' && (
                              <button 
                                onClick={() => handleRollbackBatch(batch.id)}
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 text-[10px] font-bold rounded border border-red-100 transition-colors"
                              >
                                Rollback
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {previewData && (
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-bold text-slate-855 text-sm">Row Validation Details & Mapping</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-250 text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 font-semibold">
                        <tr>
                          <th className="px-6 py-3">Row</th>
                          <th className="px-6 py-3">Asset Tag</th>
                          <th className="px-6 py-3">Asset Name</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Office Location</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Validation Errors / Warnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {previewData.rows.map((row: any) => (
                          <tr key={row.rowNumber} className={row.isValid ? 'hover:bg-slate-50/50' : 'bg-red-50/20'}>
                            <td className="px-6 py-3 font-semibold">{row.rowNumber}</td>
                            <td className="px-6 py-3 font-mono font-bold text-slate-800">{row.assetTag || 'N/A'}</td>
                            <td className="px-6 py-3 font-bold">{row.name || 'N/A'}</td>
                            <td className="px-6 py-3">{row.categoryName || 'N/A'}</td>
                            <td className="px-6 py-3">{row.officeName || 'N/A'}</td>
                            <td className="px-6 py-3">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${row.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {row.isValid ? 'Valid' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-6 py-3 space-y-1">
                              {row.errors.map((err: string, i: number) => (
                                <div key={i} className="text-red-600 font-semibold text-[10px] flex items-center gap-1">
                                  <span>✕</span> {err}
                                </div>
                              ))}
                              {row.warnings.map((warn: string, i: number) => (
                                <div key={i} className="text-amber-600 font-semibold text-[10px] flex items-center gap-1">
                                  <span>⚠</span> {warn}
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'verification' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-800 text-sm">{campaigns.length} Active Audits Campaigns</span>
                  {selectedCampaignId && (
                    <button 
                      onClick={() => { setSelectedCampaignId(null); setSelectedCampaign(null); setCampaignVariance(null); setCampaignAssets([]); }}
                      className="text-xs text-brand-600 font-bold hover:underline"
                    >
                      Back to Campaigns List
                    </button>
                  )}
                </div>
                
                {!selectedCampaignId && hasPermission('assets:write') && (
                  <button 
                    onClick={() => setShowAddCampaign(true)}
                    className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Start Audit Campaign
                  </button>
                )}
              </div>

              {!selectedCampaignId ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {campaigns.map((camp) => (
                    <div 
                      key={camp.id}
                      onClick={() => {
                        setSelectedCampaignId(camp.id);
                        setSelectedCampaign(camp);
                        fetchCampaignAssets(camp.id);
                        fetchCampaignVariance(camp.id);
                      }}
                      className="bg-white border rounded-xl p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all cursor-pointer space-y-4"
                    >
                      <div>
                        <div className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded w-fit mb-1.5 uppercase">
                          {camp.status}
                        </div>
                        <h4 className="font-bold text-slate-905 text-base">{camp.name}</h4>
                        <p className="text-xs text-slate-450 mt-1">
                          Auditing Location: {camp.office?.name || 'All Locations'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t text-slate-500 font-medium">
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase">Start Date</span>
                          {new Date(camp.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase">End Date</span>
                          {new Date(camp.endDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded flex justify-between items-center">
                        <span>Assigned Audit Team:</span>
                        <span className="text-slate-800">{camp.assignedTeam}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {campaignVariance && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-white border p-4 rounded-xl shadow-sm text-center">
                        <span className="block font-extrabold text-slate-800 text-2xl">{campaignVariance.metrics.expected}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Expected Assets</span>
                      </div>
                      <div className="bg-green-50/40 border border-green-150 p-4 rounded-xl text-center">
                        <span className="block font-extrabold text-green-700 text-2xl">{campaignVariance.metrics.verified}</span>
                        <span className="text-[10px] text-green-550 font-bold uppercase">Counted / Verified</span>
                      </div>
                      <div className="bg-red-50/45 border border-red-150 p-4 rounded-xl text-center">
                        <span className="block font-extrabold text-red-700 text-2xl">{campaignVariance.metrics.missing}</span>
                        <span className="text-[10px] text-red-500 font-bold uppercase">Missing</span>
                      </div>
                      <div className="bg-amber-50/45 border border-amber-150 p-4 rounded-xl text-center">
                        <span className="block font-extrabold text-amber-700 text-2xl">{campaignVariance.metrics.damaged}</span>
                        <span className="text-[10px] text-amber-500 font-bold uppercase">Damaged</span>
                      </div>
                      <div className="bg-slate-50 border p-4 rounded-xl text-center col-span-2 md:col-span-1">
                        <span className="block font-extrabold text-slate-500 text-2xl">{campaignVariance.metrics.uncounted}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Pending Check</span>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-8 bg-white border rounded-xl overflow-hidden shadow-sm">
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <h4 className="font-bold text-slate-855 text-sm">Campaign Reconciliation Checklist</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-700">
                          <thead className="bg-slate-50 text-slate-500 font-semibold">
                            <tr>
                              <th className="px-6 py-3">Code / Tag</th>
                              <th className="px-6 py-3">Asset Name</th>
                              <th className="px-6 py-3">Condition</th>
                              <th className="px-6 py-3">Count Status</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {campaignAssets.map((asset) => {
                              const isCounted = asset.verifications && asset.verifications.length > 0;
                              const currentVerification = isCounted ? asset.verifications[0] : null;

                              return (
                                <tr key={asset.id} className="hover:bg-slate-50/50">
                                  <td className="px-6 py-3.5">
                                    <span className="font-mono font-bold text-brand-600 block">{asset.assetCode}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">Tag: {asset.assetTag}</span>
                                  </td>
                                  <td className="px-6 py-3.5 font-bold text-slate-900">{asset.name}</td>
                                  <td className="px-6 py-3.5">
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                                      {isCounted ? currentVerification.condition : asset.condition}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5">
                                    {isCounted ? (
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                        currentVerification.status === 'Verified' ? 'bg-green-50 text-green-700' :
                                        currentVerification.status === 'Missing' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                      }`}>
                                        {currentVerification.status}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase">
                                        Unreconciled
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3.5 text-right">
                                    {isCounted ? (
                                      <span className="text-slate-400 italic text-[10px]">Logged by {currentVerification.verifiedBy}</span>
                                    ) : (
                                      hasPermission('assets:assign') && (
                                        <button 
                                          onClick={() => setVerifyingAssetId(asset.id)}
                                          className="bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                        >
                                          Log Count Status
                                        </button>
                                      )
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {campaignVariance && (
                      <div className="md:col-span-4 bg-white border p-5 rounded-xl shadow-sm space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm pb-2 border-b">Variance & Discrepancies</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <span className="text-[11px] font-bold text-red-650 block mb-1">Missing / Lost Assets ({campaignVariance.missing.length})</span>
                            {campaignVariance.missing.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">No missing assets flagged.</p>
                            ) : (
                              <ul className="text-[10px] text-slate-500 list-disc pl-4 space-y-1">
                                {campaignVariance.missing.map((item: any) => (
                                  <li key={item.asset.id}>
                                    <span className="font-bold text-slate-700">{item.asset.name}</span> ({item.asset.assetCode}) - {item.notes || 'No explanation'}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-amber-600 block mb-1">Damaged / Critical Assets ({campaignVariance.damaged.length})</span>
                            {campaignVariance.damaged.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">No damaged assets logged.</p>
                            ) : (
                              <ul className="text-[10px] text-slate-500 list-disc pl-4 space-y-1">
                                {campaignVariance.damaged.map((item: any) => (
                                  <li key={item.asset.id}>
                                    <span className="font-bold text-slate-700">{item.asset.name}</span> ({item.asset.assetCode}) - {item.condition} ({item.notes || 'No description'})
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-400 block mb-1">Pending Check ({campaignVariance.uncounted.length})</span>
                            {campaignVariance.uncounted.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">All campaign assets checked.</p>
                            ) : (
                              <ul className="text-[10px] text-slate-400 list-disc pl-4 space-y-1">
                                {campaignVariance.uncounted.map((item: any) => (
                                  <li key={item.id}>
                                    {item.name} ({item.assetCode})
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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

      {/* Verify Asset Count Modal */}
      {verifyingAssetId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={handleVerifyAsset} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-fade-in space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Log Count Reconciliation</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Count Verification Status</label>
              <select 
                value={verificationForm.status}
                onChange={(e) => setVerificationForm({ ...verificationForm, status: e.target.value })}
                className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="Verified">Verified (Present)</option>
                <option value="Missing">Missing (Unaccounted)</option>
                <option value="Damaged">Damaged / Poor Condition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Condition on Field Inspection</label>
              <select 
                value={verificationForm.condition}
                onChange={(e) => setVerificationForm({ ...verificationForm, condition: e.target.value })}
                className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
                <option value="Unusable">Unusable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Audit Notes / Explanation</label>
              <textarea 
                value={verificationForm.notes}
                onChange={(e) => setVerificationForm({ ...verificationForm, notes: e.target.value })}
                placeholder="Log physical inspection notes, evidence descriptions, serial mismatches..."
                className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs h-20"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <button type="button" onClick={() => setVerifyingAssetId(null)} className="border px-4 py-2 rounded-lg text-xs font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-600 shadow-sm">Save Audit Verification</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddCampaign && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={handleCreateCampaign} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-fade-in space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-base">Start Asset Count Campaign</h3>
              <button type="button" onClick={() => setShowAddCampaign(false)} className="text-slate-400 hover:text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Campaign Name</label>
              <input 
                type="text" 
                value={campaignForm.name} 
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} 
                className="block w-full border rounded-lg p-2.5 text-xs" 
                placeholder="e.g. Q2 Voinjama Office Audit" 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={campaignForm.startDate} 
                  onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })} 
                  className="block w-full border rounded-lg p-2.5 text-xs" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={campaignForm.endDate} 
                  onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })} 
                  className="block w-full border rounded-lg p-2.5 text-xs" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Assigned Audit Team</label>
              <input 
                type="text" 
                value={campaignForm.assignedTeam} 
                onChange={(e) => setCampaignForm({ ...campaignForm, assignedTeam: e.target.value })} 
                className="block w-full border rounded-lg p-2.5 text-xs" 
                placeholder="e.g. Nimba Logistics Division" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Target Facility (Office / Warehouse)</label>
              <select 
                value={campaignForm.officeId} 
                onChange={(e) => setCampaignForm({ ...campaignForm, officeId: e.target.value })} 
                className="block w-full border rounded-lg p-2.5 text-xs"
              >
                <option value="">-- All Offices --</option>
                {offices.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <button type="button" onClick={() => setShowAddCampaign(false)} className="border px-4 py-2 rounded-lg text-xs font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-600 shadow-sm">Launch Campaign</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
