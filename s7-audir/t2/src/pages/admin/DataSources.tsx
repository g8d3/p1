import React, { useState, useEffect } from 'react';
import {
  Settings,
  Play,
  Pause,
  RefreshCw,
  Key,
  Twitter,
  Github,
  MessageSquare,
  Database,
  Shield
} from 'lucide-react';

const DataSources: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    // Load sources from API
    const loadSources = async () => {
      try {
        const response = await fetch('/api/sources/status');
        const data = await response.json();

        const formattedSources = data.sources.map((source: any) => ({
          id: source.name.toLowerCase().replace(/\s+/g, ''),
          name: source.name,
          type: source.name === 'Twitter' ? 'Social Media' :
                source.name === 'GitHub' ? 'Code Repository' :
                source.name === 'Immunefi' ? 'Security Platform' :
                source.name === 'Blockchain Monitor' ? 'Blockchain' : 'Social Media',
          status: source.status,
          lastRun: source.lastRun,
          itemsCollected: source.itemsCollected,
          apiKey: '••••••••••••••••',
          rateLimit: source.name === 'Twitter' ? '300/hour' :
                    source.name === 'GitHub' ? '5000/hour' :
                    source.name === 'Immunefi' ? '100/hour' :
                    source.name === 'Blockchain Monitor' ? 'Node dependent' : '600/minute',
          icon: source.name === 'Twitter' ? Twitter :
                source.name === 'GitHub' ? Github :
                source.name === 'Immunefi' ? Shield :
                source.name === 'Blockchain Monitor' ? Database : MessageSquare
        }));

        setSources(formattedSources);
      } catch (error) {
        console.error('Failed to load sources:', error);
      }
    };

    loadSources();
  }, []);



  const toggleSourceStatus = async (id: string) => {
    try {
      const source = sources.find(s => s.id === id);
      if (!source) return;

      const newStatus = source.status === 'active' ? 'inactive' : 'active';

      const response = await fetch(`/api/sources/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSources(sources.map(s =>
          s.id === id ? { ...s, status: newStatus } : s
        ));
      }
    } catch (error) {
      console.error('Failed to update source status:', error);
    }
  };

  const runSourceNow = async (id: string) => {
    try {
      const response = await fetch(`/api/sources/${id}/run`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh the sources data
        const statusResponse = await fetch('/api/sources/status');
        const statusData = await statusResponse.json();
        setSources(statusData.sources.map((source: any) => ({
          id: source.name.toLowerCase().replace(/\s+/g, ''),
          name: source.name,
          type: source.name === 'Twitter' ? 'Social Media' :
                source.name === 'GitHub' ? 'Code Repository' :
                source.name === 'Immunefi' ? 'Security Platform' :
                source.name === 'Blockchain Monitor' ? 'Blockchain' : 'Social Media',
          status: source.status,
          lastRun: source.lastRun,
          itemsCollected: source.itemsCollected,
          apiKey: '••••••••••••••••',
          rateLimit: source.name === 'Twitter' ? '300/hour' :
                    source.name === 'GitHub' ? '5000/hour' :
                    source.name === 'Immunefi' ? '100/hour' :
                    source.name === 'Blockchain Monitor' ? 'Node dependent' : '600/minute',
          icon: source.name === 'Twitter' ? Twitter :
                source.name === 'GitHub' ? Github :
                source.name === 'Immunefi' ? Shield :
                source.name === 'Blockchain Monitor' ? Database : MessageSquare
        })));
      }
    } catch (error) {
      console.error('Failed to run source:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Data Sources Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Add New Source</span>
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sources.map((source) => (
          <div key={source.id} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    source.status === 'active' ? 'bg-green-100' :
                    source.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <source.icon className={`h-5 w-5 ${
                      source.status === 'active' ? 'text-green-600' :
                      source.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                    <p className="text-sm text-gray-600">{source.type}</p>
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

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Run:</span>
                  <span className="text-gray-900">{source.lastRun}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items Collected:</span>
                  <span className="text-gray-900">{source.itemsCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rate Limit:</span>
                  <span className="text-gray-900">{source.rateLimit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">API Key:</span>
                  <span className="text-gray-900 font-mono">{source.apiKey}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => toggleSourceStatus(source.id)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md ${
                    source.status === 'active'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {source.status === 'active' ? (
                    <>
                      <Pause className="h-4 w-4 mr-1 inline" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1 inline" />
                      Start
                    </>
                  )}
                </button>
                <button
                  onClick={() => runSourceNow(source.id)}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 text-sm font-medium rounded-md hover:bg-blue-200 flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Run Now
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  <Key className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">4/5</div>
              <p className="text-sm text-gray-600">Active Sources</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">4,636</div>
              <p className="text-sm text-gray-600">Total Items Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">1</div>
              <p className="text-sm text-gray-600">Sources with Issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Global Configuration</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Interval
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>5 minutes</option>
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Concurrent Requests
              </label>
              <input
                type="number"
                defaultValue="10"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Error Retry Attempts
              </label>
              <input
                type="number"
                defaultValue="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention (days)
              </label>
              <input
                type="number"
                defaultValue="90"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSources;