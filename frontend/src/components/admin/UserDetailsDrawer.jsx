import { X, User, Mail, Calendar, Activity, CreditCard, Shield, ExternalLink } from 'lucide-react';

export default function UserDetailsDrawer({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">User Details</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* User Header */}
          <div className="p-6 text-center border-b border-gray-100 bg-gray-50/50">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h3>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Mail size={14} /> {user.email}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                <Shield size={12} /> {user.role === 'admin' ? 'Administrator' : 'Standard User'}
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Account Info */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Account Information</h4>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span className="text-sm">Registered</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{new Date(user.joinedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Activity size={16} />
                    <span className="text-sm">Last Active</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user.lastActive || '2 hours ago'}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard size={16} />
                    <span className="text-sm">Plan</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    user.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' : 
                    user.plan === 'plus' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.plan ? user.plan.toUpperCase() : 'FREE'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Usage Stats */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Usage Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-800">{user.stats?.documents || 14}</p>
                  <p className="text-xs text-gray-500 mt-1">Documents Analyzed</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-800">{user.stats?.firs || 3}</p>
                  <p className="text-xs text-gray-500 mt-1">Complaints Drafted</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center col-span-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total API Calls</span>
                  <span className="font-bold text-gray-800">{user.stats?.apiCalls || 342}</span>
                </div>
              </div>
            </div>
            
            {/* Admin Actions */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h4>
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-700 mb-2">
                <span>View Full Audit Log</span>
                <ExternalLink size={16} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-red-100 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-left text-sm font-medium">
                <span>Suspend Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
