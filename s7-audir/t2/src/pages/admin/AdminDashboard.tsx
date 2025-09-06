import React from 'react';
import {
  Database,
  AlertTriangle,
  Activity,
  Clock
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Exploits',
      value: '1,247',
      change: '+12%',
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Data Sources',
      value: '23',
      change: '+3',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Reviews',
      value: '15',
      change: '-5',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Security Alerts',
      value: '7',
      change: '+2',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'exploit_added',
      message: 'New exploit reported: Flash Loan Attack on DeFi Protocol',
      timestamp: '2 minutes ago',
      status: 'pending'
    },
    {
      id: '2',
      type: 'data_source',
      message: 'Twitter scraper collected 15 new posts',
      timestamp: '5 minutes ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'moderation',
      message: 'Exploit #123 approved by moderator',
      timestamp: '10 minutes ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'alert',
      message: 'High-severity vulnerability detected in Protocol X',
      timestamp: '15 minutes ago',
      status: 'warning'
    }
  ];

  const dataSources = [
    { name: 'Twitter/X', status: 'active', lastUpdate: '2 min ago', itemsCollected: 156 },
    { name: 'GitHub', status: 'active', lastUpdate: '5 min ago', itemsCollected: 89 },
    { name: 'Immunefi', status: 'active', lastUpdate: '8 min ago', itemsCollected: 23 },
    { name: 'Blockchain Monitor', status: 'warning', lastUpdate: '12 min ago', itemsCollected: 45 },
    { name: 'Reddit', status: 'error', lastUpdate: '1 hour ago', itemsCollected: 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last hour
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-400' :
                    activity.status === 'warning' ? 'bg-yellow-400' :
                    activity.status === 'error' ? 'bg-red-400' : 'bg-blue-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Data Sources Status</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {dataSources.map((source, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      source.status === 'active' ? 'bg-green-400' :
                      source.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{source.name}</p>
                      <p className="text-xs text-gray-500">
                        {source.itemsCollected} items • {source.lastUpdate}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    source.status === 'active' ? 'bg-green-100 text-green-800' :
                    source.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {source.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">Add New Exploit</h3>
            <p className="text-sm text-gray-600">Manually add exploit data</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">Configure Data Sources</h3>
            <p className="text-sm text-gray-600">Manage API keys and settings</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">Review Queue</h3>
            <p className="text-sm text-gray-600">Moderate pending content</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;