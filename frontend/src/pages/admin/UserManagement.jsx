import { useState, useMemo } from 'react';
import { Search, Filter, Shield, MoreVertical, Trash2, Edit, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import UserRoleModal from '../../components/admin/UserRoleModal';
import UserDetailsDrawer from '../../components/admin/UserDetailsDrawer';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  
  // Modals state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [roleModal, setRoleModal] = useState({ isOpen: false, user: null });
  const [drawerUser, setDrawerUser] = useState(null);

  // Mock data for users
  const [users, setUsers] = useState([
    { id: 1, name: 'Omkar Mahadik', email: 'omkarmahadik180@gmail.com', role: 'admin', plan: 'pro', joinedDate: '2024-01-15T10:00:00Z', status: 'active' },
    { id: 2, name: 'Rahul Sharma', email: 'rahul.s@example.com', role: 'user', plan: 'plus', joinedDate: '2024-02-10T14:30:00Z', status: 'active' },
    { id: 3, name: 'Priya Patel', email: 'priya.p@example.com', role: 'user', plan: 'free', joinedDate: '2024-03-05T09:15:00Z', status: 'active' },
    { id: 4, name: 'Amit Kumar', email: 'amit.k@example.com', role: 'user', plan: 'free', joinedDate: '2024-03-12T11:20:00Z', status: 'suspended' },
    { id: 5, name: 'Neha Singh', email: 'neha.s@example.com', role: 'user', plan: 'pro', joinedDate: '2024-01-20T16:45:00Z', status: 'active' },
    { id: 6, name: 'Vikram Desai', email: 'vikram.d@example.com', role: 'admin', plan: 'pro', joinedDate: '2023-11-05T08:30:00Z', status: 'active' },
    { id: 7, name: 'Anjali Gupta', email: 'anjali.g@example.com', role: 'user', plan: 'free', joinedDate: '2024-03-25T13:10:00Z', status: 'active' },
    { id: 8, name: 'Sanjay Verma', email: 'sanjay.v@example.com', role: 'user', plan: 'plus', joinedDate: '2024-02-28T10:05:00Z', status: 'active' },
    { id: 9, name: 'Kavita Joshi', email: 'kavita.j@example.com', role: 'user', plan: 'free', joinedDate: '2024-04-01T09:00:00Z', status: 'active' },
  ]);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id) => {
    setUsers(users.filter(user => user.id !== id));
    setDeleteConfirm({ isOpen: false, id: null, name: '' });
  };

  const handleRoleChange = (id, newRole) => {
    setUsers(users.map(user => user.id === id ? { ...user, role: newRole } : user));
    setRoleModal({ isOpen: false, user: null });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-500">Manage user accounts, roles, and view usage statistics.</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 flex-1 md:flex-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Users Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setDrawerUser(user)}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                        {user.role === 'admin' && <Shield size={12} />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        user.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' : 
                        user.plan === 'plus' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(user.joinedDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.status === 'active' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                        {user.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setRoleModal({ isOpen: true, user })}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Change Role"
                        >
                          <Shield size={18} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm({ isOpen: true, id: user.id, name: user.name })}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    <UserIcon size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-700">No users found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-xl shadow-sm">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> results
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <UserRoleModal 
        isOpen={roleModal.isOpen} 
        onClose={() => setRoleModal({ isOpen: false, user: null })} 
        user={roleModal.user}
        onRoleChange={handleRoleChange}
      />

      <UserDetailsDrawer
        isOpen={!!drawerUser}
        onClose={() => setDrawerUser(null)}
        user={drawerUser}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the account for "${deleteConfirm.name}"? This will remove all their saved cases, history, and active subscriptions. This action cannot be undone.`}
        confirmText="Delete Account"
      />
    </div>
  );
}
