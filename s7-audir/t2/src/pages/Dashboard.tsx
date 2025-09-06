import React from 'react';
import { AlertTriangle, TrendingUp, Users, BookOpen } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Exploits',
      value: '1,247',
      change: '+12%',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Active Threats',
      value: '23',
      change: '-5%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Community Members',
      value: '15,432',
      change: '+8%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Educational Resources',
      value: '89',
      change: '+15%',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const recentExploits = [
    {
      id: '1',
      title: 'Reentrancy Attack on DeFi Protocol',
      category: 'Smart Contract',
      severity: 'Critical',
      date: '2024-01-15'
    },
    {
      id: '2',
      title: 'Oracle Price Manipulation',
      category: 'Economic',
      severity: 'High',
      date: '2024-01-12'
    },
    {
      id: '3',
      title: 'Flash Loan Exploitation',
      category: 'Economic',
      severity: 'Medium',
      date: '2024-01-10'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          DeFi Security Intelligence Platform
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empowering developers, security researchers, and DeFi participants to build and interact with more secure decentralized applications through comprehensive exploit analysis and prevention education.
        </p>
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
                  {stat.change} from last month
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Exploits */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Exploits</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentExploits.map((exploit) => (
            <div key={exploit.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{exploit.title}</h3>
                  <p className="text-sm text-gray-600">{exploit.category} • {exploit.date}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  exploit.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                  exploit.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {exploit.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">Report New Exploit</h3>
            <p className="text-sm text-gray-600">Submit a new vulnerability for analysis</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">Search Exploits</h3>
            <p className="text-sm text-gray-600">Browse our comprehensive database</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">Learning Paths</h3>
            <p className="text-sm text-gray-600">Start your security education journey</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;