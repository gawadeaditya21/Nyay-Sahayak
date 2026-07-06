import { X, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function UserRoleModal({ isOpen, onClose, user, onRoleChange }) {
  const [role, setRole] = useState('user');

  useEffect(() => {
    if (user) {
      setRole(user.role || 'user');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onRoleChange(user._id, role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600">
            <Shield size={20} />
            <h3 className="font-semibold text-gray-800">Change User Role</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">User</p>
              <p className="font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Select Role</label>
              
              <div className="flex flex-col gap-2">
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${role === 'user' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="user" 
                    checked={role === 'user'} 
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Standard User</p>
                    <p className="text-xs text-gray-500">Can access standard features based on their plan.</p>
                  </div>
                </label>
                
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${role === 'admin' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="admin" 
                    checked={role === 'admin'} 
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Administrator</p>
                    <p className="text-xs text-gray-500">Full access to the admin dashboard and settings.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
