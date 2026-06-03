import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, MapPin, Building, Settings, Plus, Key, 
  Save, Eye, CheckCircle2, ShieldCheck, X 
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { api, user: loggedUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'departments' | 'settings'>('users');
  
  // Lists data
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Modals Add / Edit
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Forms states
  const [userForm, setUserForm] = useState({ email: '', password: '', firstName: '', lastName: '', roleId: '', officeId: '', departmentId: '', status: 'Active' });
  const [locationForm, setLocationForm] = useState({ name: '', code: '', type: 'Field Office', location: '' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [settingsForm, setSettingsForm] = useState({ orgName: '', assetCodePrefix: '', contractCodePrefix: '', maintenanceReminderDays: 7, contractExpiryReminderDays: 30 });

  const fetchData = async () => {
    try {
      const [uRes, rRes, oRes, dRes, sRes] = await Promise.all([
        api.get('/api/auth/users'),
        api.get('/api/auth/roles'),
        api.get('/api/system/offices'),
        api.get('/api/system/departments'),
        api.get('/api/system/settings')
      ]);
      setUsers(uRes.data);
      setRoles(rRes.data);
      setOffices(oRes.data);
      setDepartments(dRes.data);
      setSettings(sRes.data);
      setSettingsForm({
        orgName: sRes.data.orgName,
        assetCodePrefix: sRes.data.assetCodePrefix,
        contractCodePrefix: sRes.data.contractCodePrefix,
        maintenanceReminderDays: sRes.data.maintenanceReminderDays,
        contractExpiryReminderDays: sRes.data.contractExpiryReminderDays
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/users', userForm);
      setShowAddUser(false);
      fetchData();
      setUserForm({ email: '', password: '', firstName: '', lastName: '', roleId: '', officeId: '', departmentId: '', status: 'Active' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/api/auth/users/${editingUser.id}`, { ...userForm, id: editingUser.id });
      setEditingUser(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUser(u);
    setUserForm({
      email: u.email,
      password: '',
      firstName: u.firstName,
      lastName: u.lastName,
      roleId: u.roleId,
      officeId: u.officeId || '',
      departmentId: u.departmentId || '',
      status: u.status
    });
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/system/offices', locationForm);
      fetchData();
      setLocationForm({ name: '', code: '', type: 'Field Office', location: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/system/departments', deptForm);
      fetchData();
      setDeptForm({ name: '', code: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/api/system/settings', settingsForm);
      fetchData();
      alert('System settings updated successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">System Administration Console</h1>
        <p className="text-sm text-slate-500 font-medium font-sans font-medium">Configure roles, add operations locations, and adjust asset tag prefixes.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button onClick={() => setActiveTab('users')} className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${activeTab === 'users' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'}`}>
          User Accounts
        </button>
        <button onClick={() => setActiveTab('locations')} className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${activeTab === 'locations' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'}`}>
          Offices & Locations
        </button>
        <button onClick={() => setActiveTab('departments')} className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${activeTab === 'departments' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'}`}>
          Departments
        </button>
        <button onClick={() => setActiveTab('settings')} className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${activeTab === 'settings' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'}`}>
          System Settings
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border p-4 rounded-xl shadow-sm">
            <span className="font-bold text-slate-800 text-sm">{users.length} Active System Users</span>
            <button 
              onClick={() => setShowAddUser(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4.5 py-2 rounded-lg flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create User
            </button>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3">User Name</th>
                  <th className="px-6 py-3">Email Address</th>
                  <th className="px-6 py-3">Role Designation</th>
                  <th className="px-6 py-3">Office Location</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.firstName} {u.lastName}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 font-semibold text-brand-650">{u.role.name}</td>
                    <td className="px-6 py-4 text-slate-500">{u.office?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-500">{u.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenEditUser(u)}
                        className="text-brand-600 hover:text-brand-800 font-bold"
                      >
                        Edit Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="grid md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-8 bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3">Location Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Address Location</th>
                  <th className="px-6 py-3">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offices.map((o) => (
                  <tr key={o.id}>
                    <td className="px-6 py-4 font-bold text-slate-900">{o.name}</td>
                    <td className="px-6 py-4 text-slate-500">{o.type}</td>
                    <td className="px-6 py-4 text-slate-500">{o.location}</td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-600">{o.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleCreateLocation} className="md:col-span-4 bg-white border p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Add Operations Location</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Office Name</label>
              <input type="text" value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" placeholder="e.g. Nimba Field Office" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Office Code</label>
              <input type="text" value={locationForm.code} onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" placeholder="e.g. NFO" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Location Type</label>
              <select value={locationForm.type} onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs">
                <option value="Country Office">Country Office</option>
                <option value="Field Office">Field Office</option>
                <option value="Warehouse">Warehouse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Physical Address</label>
              <input type="text" value={locationForm.location} onChange={(e) => setLocationForm({ ...locationForm, location: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" placeholder="e.g. Voinjama, Lofa" required />
            </div>
            <button type="submit" className="w-full bg-brand-505 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm">Save Location</button>
          </form>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="grid md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-8 bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3">Department Name</th>
                  <th className="px-6 py-3">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td className="px-6 py-4 font-bold text-slate-900">{d.name}</td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-600">{d.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleCreateDept} className="md:col-span-4 bg-white border p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Add New Department</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Department Name</label>
              <input type="text" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" placeholder="e.g. Logistics & Procurement" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Department Code</label>
              <input type="text" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" placeholder="e.g. LOG" required />
            </div>
            <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm">Save Department</button>
          </form>
        </div>
      )}

      {activeTab === 'settings' && (
        <form onSubmit={handleUpdateSettings} className="bg-white border p-6 rounded-xl shadow-sm max-w-xl mx-auto space-y-5">
          <h3 className="font-bold text-slate-800 text-base">Organizational Metadata & Formats</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Organization Name</label>
              <input type="text" value={settingsForm.orgName} onChange={(e) => setSettingsForm({ ...settingsForm, orgName: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Asset Code Prefix</label>
              <input type="text" value={settingsForm.assetCodePrefix} onChange={(e) => setSettingsForm({ ...settingsForm, assetCodePrefix: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Contract Code Prefix</label>
              <input type="text" value={settingsForm.contractCodePrefix} onChange={(e) => setSettingsForm({ ...settingsForm, contractCodePrefix: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Maintenance Reminder Days</label>
              <input type="number" value={settingsForm.maintenanceReminderDays} onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceReminderDays: parseInt(e.target.value) })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Contract Expiry Alerts (Days)</label>
              <input type="number" value={settingsForm.contractExpiryReminderDays} onChange={(e) => setSettingsForm({ ...settingsForm, contractExpiryReminderDays: parseInt(e.target.value) })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
          </div>

          <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-md flex items-center gap-1.5 ml-auto">
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </form>
      )}

      {/* User modal overlays */}
      {(showAddUser || editingUser) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border animate-fade-in space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-base">{editingUser ? 'Edit User Account' : 'Create User Account'}</h3>
              <button type="button" onClick={() => { setShowAddUser(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-655"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">First Name</label>
                <input type="text" value={userForm.firstName} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name</label>
                <input type="text" value={userForm.lastName} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
              <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Password {editingUser && '(Leave blank to keep current)'}</label>
              <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" required={!editingUser} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Role Designation</label>
              <select value={userForm.roleId} onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs" required>
                <option value="">-- Choose Role --</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Office Location</label>
                <select value={userForm.officeId} onChange={(e) => setUserForm({ ...userForm, officeId: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs">
                  <option value="">-- Store --</option>
                  {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                <select value={userForm.departmentId} onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs">
                  <option value="">-- N/A --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {editingUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <select value={userForm.status} onChange={(e) => setUserForm({ ...userForm, status: e.target.value })} className="block w-full border rounded-lg p-2.5 text-xs">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t">
              <button type="button" onClick={() => { setShowAddUser(false); setEditingUser(null); }} className="border px-4 py-2 rounded-lg text-xs font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-600 shadow-sm">{editingUser ? 'Save Changes' : 'Create Account'}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
