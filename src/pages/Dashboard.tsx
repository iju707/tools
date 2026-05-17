export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Projects', value: '12', trend: '+2 this week', color: 'blue' },
            { label: 'Active Users', value: '3,421', trend: '+15% vs last month', color: 'indigo' },
            { label: 'API Calls', value: '1.2M', trend: 'Healthy', color: 'emerald' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className={`mt-1 text-sm font-medium text-${stat.color}-600`}>{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* Main Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="h-64 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 text-gray-400">
              Activity Chart Placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
