import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Search
} from 'lucide-react';

const ContentModeration: React.FC = () => {
  const [pendingContent, setPendingContent] = useState([
    {
      id: '1',
      type: 'exploit',
      title: 'Potential Reentrancy Attack on Lending Protocol',
      submittedBy: 'security_researcher_123',
      submittedAt: '2024-01-15 14:00:00',
      severity: 'high',
      status: 'pending',
      content: 'Attacker exploited reentrancy vulnerability by calling withdraw function recursively...',
      tags: ['reentrancy', 'lending', 'flash-loan']
    },
    {
      id: '2',
      type: 'analysis',
      title: 'Analysis: Oracle Manipulation in DEX',
      submittedBy: 'blockchain_analyst',
      submittedAt: '2024-01-15 13:30:00',
      severity: 'medium',
      status: 'pending',
      content: 'The attack involved manipulating price feeds through coordinated trades...',
      tags: ['oracle', 'dex', 'price-manipulation']
    },
    {
      id: '3',
      type: 'vulnerability',
      title: 'Access Control Bypass in Governance',
      submittedBy: 'smart_contract_auditor',
      submittedAt: '2024-01-15 13:00:00',
      severity: 'critical',
      status: 'pending',
      content: 'Improper modifier usage allowed unauthorized state changes...',
      tags: ['governance', 'access-control', 'modifier']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredContent = pendingContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const approveContent = async (id: string) => {
    try {
      const response = await fetch(`/api/moderation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          reviewed_by: 'admin'
        })
      });

      if (response.ok) {
        setPendingContent(pendingContent.map(item =>
          item.id === id ? { ...item, status: 'approved' } : item
        ));
      }
    } catch (error) {
      console.error('Failed to approve content:', error);
    }
  };

  const rejectContent = async (id: string) => {
    try {
      const response = await fetch(`/api/moderation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          reviewed_by: 'admin'
        })
      });

      if (response.ok) {
        setPendingContent(pendingContent.map(item =>
          item.id === id ? { ...item, status: 'rejected' } : item
        ));
      }
    } catch (error) {
      console.error('Failed to reject content:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <div className="text-sm text-gray-600">
          {filteredContent.length} items pending review
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Queue */}
      <div className="space-y-4">
        {filteredContent.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      item.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.severity}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.type === 'exploit' ? 'bg-blue-100 text-blue-800' :
                      item.type === 'analysis' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{item.content}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Submitted by <span className="font-medium">{item.submittedBy}</span> on {item.submittedAt}
                  </div>
                </div>
                <div className="ml-4 flex flex-col space-y-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {item.status === 'pending' && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Awaiting review</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => rejectContent(item.id)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => approveContent(item.id)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              )}

              {item.status === 'approved' && (
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Approved</span>
                </div>
              )}

              {item.status === 'rejected' && (
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Rejected</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No content found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'All content has been reviewed.'}
          </p>
        </div>
      )}

      {/* Moderation Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Moderation Statistics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {pendingContent.filter(item => item.status === 'pending').length}
              </div>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {pendingContent.filter(item => item.status === 'approved').length}
              </div>
              <p className="text-sm text-gray-600">Approved Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">
                {pendingContent.filter(item => item.status === 'rejected').length}
              </div>
              <p className="text-sm text-gray-600">Rejected Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">94%</div>
              <p className="text-sm text-gray-600">Approval Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentModeration;