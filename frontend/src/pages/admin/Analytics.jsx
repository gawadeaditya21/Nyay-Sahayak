import { useState } from 'react';
import { Calendar, TrendingUp, Users, Activity, FileText } from 'lucide-react';
import StatCard from '../../components/admin/StatCard';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data for the chart
  const userGrowthData = [
    { day: 'Mon', users: 12 },
    { day: 'Tue', users: 19 },
    { day: 'Wed', users: 15 },
    { day: 'Thu', users: 25 },
    { day: 'Fri', users: 22 },
    { day: 'Sat', users: 30 },
    { day: 'Sun', users: 28 },
  ];
  
  const maxUsers = Math.max(...userGrowthData.map(d => d.users));

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-500">In-depth statistics and system usage metrics.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {['24h', '7d', '30d', '1y'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === range ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="New Signups" value="132" icon={Users} trend="8" trendUp={true} color="bg-blue-100 text-blue-600" />
        <StatCard title="Avg. Response Time" value="1.2s" icon={Activity} trend="15" trendUp={false} color="bg-emerald-100 text-emerald-600" />
        <StatCard title="Docs Processed" value="84" icon={FileText} trend="2" trendUp={true} color="bg-purple-100 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Bar Chart (Custom Tailwind) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">User Growth</h2>
              <p className="text-sm text-gray-500">New registrations over time</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 pt-6">
            {userGrowthData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div 
                  className="w-full bg-blue-100 hover:bg-blue-200 rounded-t-md relative transition-all duration-300 group-hover:opacity-100 opacity-80"
                  style={{ height: `${Math.max(10, (d.users / maxUsers) * 100)}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {d.users} users
                  </div>
                  {/* Fill */}
                  <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-md transition-all duration-500" style={{ height: '100%' }} />
                </div>
                <span className="text-xs font-medium text-gray-500 mt-2">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Usage Stats */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Feature Usage</h2>
              <p className="text-sm text-gray-500">Distribution of API requests</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {[
              { name: 'Legal Document Analysis', value: 45, color: 'bg-indigo-500' },
              { name: 'FIR Generation', value: 25, color: 'bg-purple-500' },
              { name: 'General Legal Chat', value: 20, color: 'bg-blue-500' },
              { name: 'Multilingual Translation', value: 10, color: 'bg-emerald-500' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{stat.name}</span>
                  <span className="font-bold text-gray-900">{stat.value}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${stat.color}`} style={{ width: `${stat.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <Calendar className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Peak Hours Notice</h4>
              <p className="text-xs text-amber-700 mt-1">System experiences 40% more load between 2 PM and 5 PM IST. Consider scaling DB instances during these hours.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
