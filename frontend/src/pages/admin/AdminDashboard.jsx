import { useState, useEffect } from 'react';
import { Users, FileText, Scale, Activity, Upload, AlertCircle, CheckCircle2, Settings, Shield } from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalUsers: 0, activeCases: 0, apiRequests: 0, docsProcessed: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/admin/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data.stats);
        setRecentActivity(res.data.recentActivity);
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} trend="12" trendUp={true} color="bg-blue-100 text-blue-600" />
        <StatCard title="Active Cases" value={stats.activeCases} icon={Scale} trend="5" trendUp={true} color="bg-indigo-100 text-indigo-600" />
        <StatCard title="Documents Analyzed" value={stats.docsProcessed} icon={FileText} trend="18" trendUp={true} color="bg-purple-100 text-purple-600" />
        <StatCard title="API Requests" value={stats.apiRequests} icon={Activity} trend="2" trendUp={false} color="bg-emerald-100 text-emerald-600" />
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
              {loading ? (
                  <p className="text-gray-500 text-sm">Loading activity...</p>
              ) : recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent activity found.</p>
              ) : recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-start gap-4">
                  <div className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${activity.type === 'SYSTEM' ? 'bg-blue-500' : activity.type === 'DATA' ? 'bg-green-500' : activity.type === 'SECURITY' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{activity.action} - {activity.target}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-600">{activity.user}</span>
                      <span>•</span>
                      <span>{new Date(activity.createdAt).toLocaleString()}</span>
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
              <Link to="/admin/settings" className="flex flex-col items-center justify-center p-4 text-center rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors group">
                <Settings size={24} className="mb-2 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700">System Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
