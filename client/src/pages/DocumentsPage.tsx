import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, FileText, Download, CheckCircle2, FileCode, Tag } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { api } = useAuth();

  const [documents, setDocuments] = useState<any[]>([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [docForm, setDocForm] = useState({ entityType: 'Asset', entityId: '', fileName: '', fileCategory: 'Invoice', fileSize: '102400', mimeType: 'application/pdf' });

  const fetchDocs = async () => {
    try {
      const res = await api.get('/api/system/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUploadMock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/system/documents', docForm);
      setShowAddDoc(false);
      fetchDocs();
      setDocForm({ entityType: 'Asset', entityId: '', fileName: '', fileCategory: 'Invoice', fileSize: '102400', mimeType: 'application/pdf' });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.fileName.toLowerCase().includes(search.toLowerCase()) ||
    d.entityType.toLowerCase().includes(search.toLowerCase()) ||
    d.fileCategory.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">System Document Repository</h1>
          <p className="text-sm text-slate-500 font-medium">Securely download warranties, procurement invoices, and signed SLA contracts.</p>
        </div>
        <button 
          onClick={() => setShowAddDoc(true)}
          className="bg-brand-505 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Filter search */}
      <div className="bg-white border p-4 rounded-xl flex items-center gap-3">
        <div className="relative flex-1 text-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search document name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 block w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {/* Documents Registry Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-3">File Name</th>
              <th className="px-6 py-3">File Category</th>
              <th className="px-6 py-3">Attached To</th>
              <th className="px-6 py-3">Size (KB)</th>
              <th className="px-6 py-3">Uploaded By</th>
              <th className="px-6 py-3">Uploaded At</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">No documents uploaded.</td>
              </tr>
            ) : (
              filteredDocs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-brand-650" />
                      <span className="font-bold text-slate-900">{d.fileName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold bg-slate-100 border text-slate-650 px-2 py-0.5 rounded-full">{d.fileCategory}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">{d.entityType} ({d.entityId.slice(0, 8)})</td>
                  <td className="px-6 py-4 text-xs">{(d.fileSize / 1024).toFixed(0)} KB</td>
                  <td className="px-6 py-4 text-xs text-slate-550">{d.uploadedBy}</td>
                  <td className="px-6 py-4 text-xs text-slate-450">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); alert(`Downloading file: ${d.fileName}`); }}
                      className="text-brand-600 hover:text-brand-800 font-bold text-xs inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Document Mock Overlay */}
      {showAddDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
          <form onSubmit={handleUploadMock} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border animate-fade-in space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Upload Supportive Document</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">File Name</label>
              <input type="text" value={docForm.fileName} onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" placeholder="e.g. generator_warranty_card.pdf" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Attachment Category</label>
                <select value={docForm.fileCategory} onChange={(e) => setDocForm({ ...docForm, fileCategory: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm">
                  <option value="Invoice">Invoice</option>
                  <option value="Photos">Photos</option>
                  <option value="Warranty Card">Warranty Card</option>
                  <option value="Signed Contract">Signed Contract</option>
                  <option value="Amendment Log">Amendment Log</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Mime Type</label>
                <input type="text" value={docForm.mimeType} onChange={(e) => setDocForm({ ...docForm, mimeType: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Related Entity Type</label>
                <select value={docForm.entityType} onChange={(e) => setDocForm({ ...docForm, entityType: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm">
                  <option value="Asset">Asset</option>
                  <option value="Contract">Contract</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Entity System ID</label>
                <input type="text" value={docForm.entityId} onChange={(e) => setDocForm({ ...docForm, entityId: e.target.value })} className="block w-full border rounded-lg p-2.5 text-sm" placeholder="UUID of asset/contract" required />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddDoc(false)} className="border px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
              <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 shadow-sm">Save Attachment</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
