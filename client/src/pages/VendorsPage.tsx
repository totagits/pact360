import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Star, Phone, Mail, MapPin, X, Briefcase, FileText, CheckSquare, User } from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const { api, hasPermission } = useAuth();

  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const [showAddVendor, setShowAddVendor] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [vendorForm, setVendorForm] = useState({ name: '', contactName: '', email: '', phone: '', address: '', taxId: '', serviceCategory: '', status: 'Active', notes: '' });

  const fetchVendors = async () => {
    try {
      const res = await api.get('/api/ngo/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleOpenVendor = async (id: string) => {
    try {
      const res = await api.get(`/api/ngo/vendors/${id}`);
      setSelectedVendor(res.data);
      setSelectedVendorId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/ngo/vendors', vendorForm);
      setShowAddVendor(false);
      fetchVendors();
      setVendorForm({ name: '', contactName: '', email: '', phone: '', address: '', taxId: '', serviceCategory: '', status: 'Active', notes: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRateVendor = async (rating: number) => {
    if (!selectedVendor) return;
    try {
      await api.put(`/api/ngo/vendors/${selectedVendor.id}`, { performanceScore: rating });
      handleOpenVendor(selectedVendor.id);
      fetchVendors();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.serviceCategory.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Detail Drawer */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l animate-fade-in overflow-hidden">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-450 uppercase">Vendor Profile</span>
                <h3 className="text-lg font-extrabold text-slate-800 mt-1">{selectedVendor.name}</h3>
                <span className="text-xs text-slate-400 font-semibold mt-0.5">{selectedVendor.serviceCategory}</span>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="w-8 h-8 rounded-full border flex items-center justify-center text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              
              {/* Contact box */}
              <div className="space-y-2 border p-4 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2 text-slate-650">
                  <User className="w-4 h-4 text-brand-600" />
                  <span className="font-semibold">{selectedVendor.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650">
                  <Mail className="w-4 h-4 text-brand-600" />
                  <span>{selectedVendor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650">
                  <Phone className="w-4 h-4 text-brand-600" />
                  <span>{selectedVendor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span>{selectedVendor.address}</span>
                </div>
              </div>

              {/* Rating Section */}
              <div className="border border-slate-200/80 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-sm">Performance SLA Score</div>
                  <div className="text-xs text-slate-450 mt-0.5">Average score out of 5 stars</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star 
                        key={num} 
                        onClick={() => handleRateVendor(num)}
                        className={`w-5 h-5 cursor-pointer ${
                          num <= Math.round(selectedVendor.performanceScore) ? 'text-amber-400 fill-amber-400' : 'text-slate-250'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="font-bold text-slate-700 text-sm">({selectedVendor.performanceScore})</span>
                </div>
              </div>

              {/* SLA Contracts */}
              <div className="pt-4 border-t">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Active SLA Contracts</h4>
                <div className="space-y-2">
                  {selectedVendor.contracts?.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No active contracts with this vendor.</span>
                  ) : (
                    selectedVendor.contracts?.map((c: any) => (
                      <div key={c.id} className="p-2.5 bg-slate-50 border rounded-lg text-xs flex justify-between items-center">
                        <span className="font-bold text-slate-800">{c.title}</span>
                        <span className="font-semibold text-slate-500">Value: USD {c.value.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Vendors & Service SLA Partners</h1>
          <p className="text-sm text-slate-500 font-medium">Verify performance scores and active contracts for local supply chains.</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('vendors:write') && (
            <button 
              onClick={() => setShowAddVendor(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border p-4 rounded-xl flex items-center gap-3">
        <div className="relative flex-1 text-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search vendor name, service category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 block w-full px-3 py-2 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Vendors Table Grid */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-3">Vendor Name</th>
              <th className="px-6 py-3">Service Category</th>
              <th className="px-6 py-3">Contact Person</th>
              <th className="px-6 py-3">Tax Reg ID</th>
              <th className="px-6 py-3">Performance SLA Score</th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredVendors.map((v) => (
              <tr 
                key={v.id} 
                onClick={() => handleOpenVendor(v.id)}
                className="hover:bg-slate-50/70 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-bold text-slate-900">{v.name}</td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-500">{v.serviceCategory}</td>
                <td className="px-6 py-4">
                  <div className="text-xs font-semibold text-slate-900">{v.contactName}</div>
                  <div className="text-[10px] text-slate-400">{v.email}</div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{v.taxId}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-slate-800 text-xs">{v.performanceScore.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{v.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Add Vendor */}
      {showAddVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleCreateVendor} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border animate-fade-in space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Add New Vendor Partner</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Company Name</label>
              <input type="text" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Service Category</label>
              <input type="text" value={vendorForm.serviceCategory} onChange={(e) => setVendorForm({ ...vendorForm, serviceCategory: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" placeholder="e.g. IT, Vehicle SLA, Construction" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Name</label>
                <input type="text" value={vendorForm.contactName} onChange={(e) => setVendorForm({ ...vendorForm, contactName: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tax ID / Business Reg</label>
                <input type="text" value={vendorForm.taxId} onChange={(e) => setVendorForm({ ...vendorForm, taxId: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Corporate Email</label>
                <input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                <input type="text" value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Monrovia Office Address</label>
              <input type="text" value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddVendor(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Register Vendor</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
