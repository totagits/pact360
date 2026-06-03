import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Award, Briefcase, Calendar, DollarSign, 
  ArrowLeft, X, Layers, AlertCircle, FileText, CheckCircle2 
} from 'lucide-react';

export const ProjectsGrantsPage: React.FC = () => {
  const { api, hasPermission } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'projects' | 'grants' | 'donors'>('projects');
  
  // Detail Drawer States
  const [selectedProj, setSelectedProj] = useState<any>(null);
  const [selectedGrant, setSelectedGrant] = useState<any>(null);

  // Quick Add forms state
  const [showAddProj, setShowAddProj] = useState(false);
  const [showAddGrant, setShowAddGrant] = useState(false);
  const [showAddDonor, setShowAddDonor] = useState(false);

  // Forms data
  const [projForm, setProjForm] = useState({ name: '', code: '', budget: '', startDate: '', endDate: '', status: 'Active', grantId: '', managerId: '' });
  const [grantForm, setGrantForm] = useState({ name: '', code: '', amount: '', donorId: '', startDate: '', endDate: '', complianceRequirements: '', status: 'Active' });
  const [donorForm, setDonorForm] = useState({ name: '', code: '' });

  const fetchData = async () => {
    try {
      const [pRes, gRes, dRes, uRes] = await Promise.all([
        api.get('/api/ngo/projects'),
        api.get('/api/ngo/grants'),
        api.get('/api/ngo/donors'),
        api.get('/api/auth/users')
      ]);
      setProjects(pRes.data);
      setGrants(gRes.data);
      setDonors(dRes.data);
      setUsers(uRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenProj = async (id: string) => {
    try {
      const res = await api.get(`/api/ngo/projects/${id}`);
      setSelectedProj(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenGrant = async (id: string) => {
    try {
      const res = await api.get(`/api/ngo/grants/${id}`);
      setSelectedGrant(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/ngo/projects', projForm);
      setShowAddProj(false);
      fetchData();
      setProjForm({ name: '', code: '', budget: '', startDate: '', endDate: '', status: 'Active', grantId: '', managerId: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/ngo/grants', grantForm);
      setShowAddGrant(false);
      fetchData();
      setGrantForm({ name: '', code: '', amount: '', donorId: '', startDate: '', endDate: '', complianceRequirements: '', status: 'Active' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDonorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/ngo/donors', donorForm);
      setShowAddDonor(false);
      fetchData();
      setDonorForm({ name: '', code: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Detail drawers */}
      {selectedProj && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l animate-fade-in overflow-hidden">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Project Profile</span>
                <h3 className="text-lg font-extrabold text-slate-800 mt-1">{selectedProj.name}</h3>
                <span className="text-xs font-mono font-bold text-brand-650 bg-brand-50 border px-2 py-0.5 rounded mt-1.5 block w-fit">{selectedProj.code}</span>
              </div>
              <button onClick={() => setSelectedProj(null)} className="w-8 h-8 rounded-full border flex items-center justify-center text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-450 font-semibold">Budget</div>
                  <div className="font-bold text-slate-800">USD {selectedProj.budget.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-450 font-semibold">Status</div>
                  <div className="font-bold text-slate-800">{selectedProj.status}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-450 font-semibold">Start Date</div>
                  <div className="text-slate-650">{new Date(selectedProj.startDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-450 font-semibold">End Date</div>
                  <div className="text-slate-650">{new Date(selectedProj.endDate).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Linked Assets */}
              <div className="pt-4 border-t">
                <h4 className="font-bold text-slate-850 mb-3">Assets Linked to Project</h4>
                <div className="space-y-2">
                  {selectedProj.assets?.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No assets linked to this project.</span>
                  ) : (
                    selectedProj.assets?.map((a: any) => (
                      <div key={a.id} className="flex justify-between items-center p-2.5 bg-slate-50 border rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">{a.name}</span>
                          <span className="text-[10px] text-slate-400">Condition: {a.condition} • Status: {a.status}</span>
                        </div>
                        <span className="font-mono text-brand-600 bg-brand-50 border px-1.5 py-0.5 rounded font-bold">{a.assetCode}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Linked Contracts */}
              <div className="pt-4 border-t">
                <h4 className="font-bold text-slate-850 mb-3">Contracts Linked to Project</h4>
                <div className="space-y-2">
                  {selectedProj.contracts?.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No contracts linked to this project.</span>
                  ) : (
                    selectedProj.contracts?.map((c: any) => (
                      <div key={c.id} className="flex justify-between items-center p-2.5 bg-slate-50 border rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">{c.title}</span>
                          <span className="text-[10px] text-slate-450">Vendor: {c.vendor.name}</span>
                        </div>
                        <span className="font-bold text-slate-700">{c.currency} {c.value.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {selectedGrant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l animate-fade-in overflow-hidden">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Grant Profile</span>
                <h3 className="text-lg font-extrabold text-slate-800 mt-1">{selectedGrant.name}</h3>
                <span className="text-xs font-mono font-bold text-brand-650 bg-brand-50 border px-2 py-0.5 rounded mt-1.5 block w-fit">{selectedGrant.code}</span>
              </div>
              <button onClick={() => setSelectedGrant(null)} className="w-8 h-8 rounded-full border flex items-center justify-center text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-450 font-semibold">Total Amount</div>
                  <div className="font-bold text-slate-800">USD {selectedGrant.amount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-450 font-semibold">Funding Donor</div>
                  <div className="font-bold text-slate-800">{selectedGrant.donor?.name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-450 font-semibold">Compliance Details</div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{selectedGrant.complianceRequirements || 'No specific compliance clauses.'}</p>
                </div>
              </div>

              {/* Projects List */}
              <div className="pt-4 border-t">
                <h4 className="font-bold text-slate-850 mb-3">Sub Projects</h4>
                <div className="space-y-2">
                  {selectedGrant.projects?.map((p: any) => (
                    <div key={p.id} className="p-2.5 bg-slate-50 border rounded-lg text-xs flex justify-between items-center">
                      <span className="font-bold text-slate-800">{p.name}</span>
                      <span className="font-semibold text-slate-500">Budget: USD {p.budget.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Projects, Grants, & Donors</h1>
          <p className="text-sm text-slate-500 font-medium">Link operational items to international funding streams and donor restrictions.</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('projects:write') && (
            <>
              {activeTab === 'projects' && (
                <button 
                  onClick={() => setShowAddProj(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              )}
              {activeTab === 'grants' && (
                <button 
                  onClick={() => setShowAddGrant(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Grant
                </button>
              )}
              {activeTab === 'donors' && (
                <button 
                  onClick={() => setShowAddDonor(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Donor
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button 
          onClick={() => setActiveTab('projects')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'projects' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          Active Projects
        </button>
        <button 
          onClick={() => setActiveTab('grants')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'grants' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          Grants Registry
        </button>
        <button 
          onClick={() => setActiveTab('donors')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'donors' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'
          }`}
        >
          Donors List
        </button>
      </div>

      {/* Registry Lists Tables */}
      {activeTab === 'projects' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Project Title</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Parent Grant</th>
                <th className="px-6 py-3">Manager</th>
                <th className="px-6 py-3">Timeline</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {projects.map((p) => (
                <tr 
                  key={p.id} 
                  onClick={() => handleOpenProj(p.id)}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-brand-600 font-bold">{p.code}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-xs font-semibold">USD {p.budget.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{p.grant.name}</td>
                  <td className="px-6 py-4 text-xs">{p.manager?.firstName} {p.manager?.lastName}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'grants' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Grant Name</th>
                <th className="px-6 py-3">Total Allocation</th>
                <th className="px-6 py-3">Donor</th>
                <th className="px-6 py-3">Timeline</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {grants.map((g) => (
                <tr 
                  key={g.id} 
                  onClick={() => handleOpenGrant(g.id)}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-brand-600 font-bold">{g.code}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{g.name}</td>
                  <td className="px-6 py-4 text-xs font-semibold">USD {g.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{g.donor.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{g.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Donor Code</th>
                <th className="px-6 py-3">Donor Name</th>
                <th className="px-6 py-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {donors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-brand-600 font-bold">{d.code}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{d.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-550">{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation modals */}
      {showAddProj && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleAddProject} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border animate-fade-in space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Add New Project</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Project Name</label>
              <input type="text" value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Project Code</label>
              <input type="text" value={projForm.code} onChange={(e) => setProjForm({ ...projForm, code: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" placeholder="PROJ-..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Budget (USD)</label>
                <input type="number" value={projForm.budget} onChange={(e) => setProjForm({ ...projForm, budget: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Parent Grant</label>
                <select value={projForm.grantId} onChange={(e) => setProjForm({ ...projForm, grantId: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required>
                  <option value="">-- Choose Grant --</option>
                  {grants.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                <input type="date" value={projForm.startDate} onChange={(e) => setProjForm({ ...projForm, startDate: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                <input type="date" value={projForm.endDate} onChange={(e) => setProjForm({ ...projForm, endDate: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Project Manager</label>
              <select value={projForm.managerId} onChange={(e) => setProjForm({ ...projForm, managerId: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required>
                <option value="">-- Choose Manager --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddProj(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Save Project</button>
            </div>
          </form>
        </div>
      )}

      {showAddGrant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleAddGrantSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border animate-fade-in space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Add New Grant</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Grant Name</label>
              <input type="text" value={grantForm.name} onChange={(e) => setGrantForm({ ...grantForm, name: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Grant Code</label>
              <input type="text" value={grantForm.code} onChange={(e) => setGrantForm({ ...grantForm, code: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" placeholder="GRANT-..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Total Amount (USD)</label>
                <input type="number" value={grantForm.amount} onChange={(e) => setGrantForm({ ...grantForm, amount: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Donor Partner</label>
                <select value={grantForm.donorId} onChange={(e) => setGrantForm({ ...grantForm, donorId: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required>
                  <option value="">-- Choose Donor --</option>
                  {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                <input type="date" value={grantForm.startDate} onChange={(e) => setGrantForm({ ...grantForm, startDate: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                <input type="date" value={grantForm.endDate} onChange={(e) => setGrantForm({ ...grantForm, endDate: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddGrant(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Save Grant</button>
            </div>
          </form>
        </div>
      )}

      {showAddDonor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleAddDonorSubmit} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border animate-fade-in space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Add New Donor</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Donor Name</label>
              <input type="text" value={donorForm.name} onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Donor Code</label>
              <input type="text" value={donorForm.code} onChange={(e) => setDonorForm({ ...donorForm, code: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" placeholder="USAID, SIDA, etc." required />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddDonor(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Save Donor</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
