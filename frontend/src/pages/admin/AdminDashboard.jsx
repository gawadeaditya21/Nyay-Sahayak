import { Users, FileText, Scale, Activity, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.dashboard')}</h1>
          <p className="text-gray-500">System overview and real-time metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/laws" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm w-full sm:w-auto shadow-sm">
            <Upload size={18} />
            <span>Upload Law Document</span>
          </Link>
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value="1,284" icon={Users} trend="12" trendUp={true} color="bg-blue-100 text-blue-600" />
        <StatCard title="Active Cases" value="842" icon={Scale} trend="5" trendUp={true} color="bg-indigo-100 text-indigo-600" />
        <StatCard title="Documents Analyzed" value="3,492" icon={FileText} trend="18" trendUp={true} color="bg-purple-100 text-purple-600" />
        <StatCard title="API Requests" value="124k" icon={Activity} trend="2" trendUp={false} color="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
            <Link to="/admin/audit" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[
                { action: 'New User Registration', user: 'omkar@example.com', time: '10 mins ago', type: 'user' },
                { action: 'Law Indexed (RERA Act)', user: 'Admin User', time: '1 hour ago', type: 'system' },
                { action: 'Subscription Upgraded to Pro', user: 'ravi@example.com', time: '3 hours ago', type: 'payment' },
                { action: 'FIR Generated (Theft)', user: 'priya@example.com', time: '5 hours ago', type: 'action' },
                { action: 'Property Document Analyzed', user: 'rahul@example.com', time: '6 hours ago', type: 'action' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${activity.type === 'system' ? 'bg-blue-500' : activity.type === 'payment' ? 'bg-green-500' : activity.type === 'user' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-600">{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* System Health */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">System Health</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">MongoDB Cluster</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-md">
                  <CheckCircle2 size={14} /> Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Gemini LLM API</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-md">
                  <CheckCircle2 size={14} /> Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Qdrant Vector DB</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                  <AlertCircle size={14} /> High Load
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Link to="/admin/users" className="flex flex-col items-center justify-center p-4 text-center rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors group">
                <Users size={24} className="mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700">Manage Users</span>
              </Link>
              <Link to="/admin/audit" className="flex flex-col items-center justify-center p-4 text-center rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors group">
                <FileText size={24} className="mb-2 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700">View Logs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
