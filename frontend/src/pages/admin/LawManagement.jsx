import { useState, useEffect } from 'react';
import { Search, Plus, Filter, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import LawUploadModal from '../../components/admin/LawUploadModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import axios from 'axios';

export default function LawManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, title: '' });
  
  const [laws, setLaws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLaws();
  }, []);

  const fetchLaws = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/laws', { headers: { Authorization: `Bearer ${token}` } });
      setLaws(res.data);
    } catch (err) {
      console.error("Failed to fetch laws", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLaws = laws.filter(law => law.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleUploadComplete = (newLawData) => {
    if (newLawData.law) {
      setLaws([newLawData.law, ...laws]);
    } else {
      fetchLaws();
    }
    setIsUploadOpen(false);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/laws/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setLaws(laws.filter(law => law._id !== id));
      setDeleteConfirm({ isOpen: false, id: null, title: '' });
    } catch (err) {
      console.error("Failed to delete law", err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Law Management</h1>
          <p className="text-gray-500">Upload, index, and manage legal corpuses for the AI.</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Plus size={18} />
          <span>Add New Law</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search indexed laws..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 w-full sm:w-auto justify-center">
          <Filter size={16} />
          <span>Filter</span>
        </button>
      </div>

      {/* Laws Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Document Name</th>
                <th className="p-4">Size</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date Added</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Loading laws...
                  </td>
                </tr>
              ) : filteredLaws.length > 0 ? (
                filteredLaws.map((law) => (
                  <tr key={law._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <span className="font-medium text-gray-900">{law.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{law.size}</td>
                    <td className="p-4">
                      {law.status === 'indexed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 size={14}/> Indexed</span>}
                      {law.status === 'indexing' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/> Indexing</span>}
                      {law.status === 'failed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertCircle size={14}/> Failed</span>}
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(law.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setDeleteConfirm({ isOpen: true, id: law._id, title: law.title })}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Law"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No laws found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LawUploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadComplete={handleUploadComplete} 
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title="Delete Law Document"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This will permanently remove it from the vector database and the AI will no longer be able to reference it. This action cannot be undone.`}
        confirmText="Delete Permanently"
      />
    </div>
  );
}
