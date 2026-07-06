export default function StatCard({ title, value, icon: Icon, trend, trendUp, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-end space-x-3">
        <h2 className="text-3xl font-bold text-gray-800">{value}</h2>
        {trend && (
          <span className={`text-sm font-medium mb-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
            {trendUp ? '+' : '-'}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}
