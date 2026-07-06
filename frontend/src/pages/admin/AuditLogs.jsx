import { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, LogIn, FileEdit, Trash2, Settings, Download } from 'lucide-react';
import axios from 'axios';

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/logs', { headers: { Authorization: `Bearer ${token}` } });
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeStyle = (type) => {
    switch(type) {
      case 'SECURITY': return { icon: ShieldAlert, color: 'text-red-600 bg-red-100' };
      case 'AUTH': return { icon: LogIn, color: 'text-blue-600 bg-blue-100' };
      case 'DATA': return { icon: FileEdit, color: 'text-emerald-600 bg-emerald-100' };
      case 'SYSTEM': return { icon: Settings, color: 'text-purple-600 bg-purple-100' };
      default: return { icon: Filter, color: 'text-gray-600 bg-gray-100' };
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-500">Track and monitor all system and user activities.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm">
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search logs by user or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 flex-1 md:flex-none cursor-pointer"
          >
            <option value="all">All Event Types</option>
            <option value="SECURITY">Security</option>
            <option value="AUTH">Authentication</option>
            <option value="DATA">Data Modification</option>
            <option value="SYSTEM">System Events</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-24">Log ID</th>
                <th className="p-4">Event Info</th>
                <th className="p-4">User / IP</th>
                <th className="p-4">Target / Details</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-500">
                    <p className="font-medium text-gray-700">Loading audit logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const { icon: Icon, color } = getTypeStyle(log.type);
                  return (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-xs font-mono text-gray-500">{log._id.slice(-6)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${color}`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{log.action}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{log.type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-gray-800">{log.user}</p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">{log.ip || '127.0.0.1'}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{log.target}</td>
                      <td className="p-4 text-right">
                        <p className="text-sm font-medium text-gray-800">{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-500">
                    <Filter size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-700">No logs found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
