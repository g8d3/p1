import React from 'react';
import { ChevronRight, AlertTriangle, Shield, DollarSign, Server, Users } from 'lucide-react';

const Categories: React.FC = () => {
  const categories = [
    {
      id: 'smart-contract',
      name: 'Smart Contract Vulnerabilities',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Logic errors, access control issues, and implementation flaws',
      subcategories: [
        'Reentrancy (SWC-107)',
        'Integer Overflow/Underflow (SWC-101)',
        'Access Control Issues (SWC-105)',
        'Unhandled Exceptions (SWC-104)',
        'Race Conditions (SWC-114)'
      ],
      exploitCount: 342
    },
    {
      id: 'economic',
      name: 'Economic Exploits',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Price manipulation, flash loans, and incentive misalignment',
      subcategories: [
        'Price Oracle Manipulation',
        'Flash Loan Attacks',
        'MEV Extraction',
        'Liquidity Pool Manipulation',
        'Governance Token Attacks'
      ],
      exploitCount: 198
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure Vulnerabilities',
      icon: Server,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Network, oracle, and third-party service vulnerabilities',
      subcategories: [
        'Key Management Issues',
        'Frontend/UI Exploits',
        'Oracle/External Data Issues',
        'Network/Node Vulnerabilities',
        'API Manipulation'
      ],
      exploitCount: 156
    },
    {
      id: 'social-engineering',
      name: 'Social Engineering & Operational',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Phishing, insider threats, and operational security failures',
      subcategories: [
        'Phishing and Social Engineering',
        'Insider Threats',
        'Operational Security Failures',
        'Regulatory/Legal Exploits',
        'Fake Protocol Launches'
      ],
      exploitCount: 89
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vulnerability Categories</h1>
        <p className="text-gray-600">Comprehensive taxonomy of DeFi security vulnerabilities and attack vectors</p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full ${category.bgColor} mr-4`}>
                  <category.icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Common Subcategories:</h4>
                <ul className="space-y-1">
                  {category.subcategories.map((subcategory, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <ChevronRight className="h-3 w-3 mr-2 text-gray-400" />
                      {subcategory}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {category.exploitCount} documented exploits
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attack Vector Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Attack Vector Analysis</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">45%</div>
              <p className="text-sm text-gray-600">Smart Contract Vulnerabilities</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">32%</div>
              <p className="text-sm text-gray-600">Economic Attacks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">23%</div>
              <p className="text-sm text-gray-600">Infrastructure & Social Engineering</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prevention Framework */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Prevention Framework</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Development Best Practices</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Use established security libraries and patterns</li>
                <li>• Implement comprehensive testing (unit, integration, fuzzing)</li>
                <li>• Conduct thorough security audits before deployment</li>
                <li>• Follow principle of least privilege in access controls</li>
                <li>• Implement proper error handling and input validation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Monitoring & Response</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Deploy comprehensive logging and monitoring systems</li>
                <li>• Set up automated alerting for suspicious activities</li>
                <li>• Maintain incident response plans and procedures</li>
                <li>• Regularly update dependencies and patch known vulnerabilities</li>
                <li>• Conduct post-mortem analysis for any security incidents</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;