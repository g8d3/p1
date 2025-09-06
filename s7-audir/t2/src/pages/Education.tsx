import React from 'react';
import { BookOpen, Play, Code, Award, Clock, Users } from 'lucide-react';

const Education: React.FC = () => {
  const learningPaths = [
    {
      id: 'beginner',
      title: 'Understanding DeFi Security',
      level: 'Beginner',
      duration: '4 weeks',
      modules: 8,
      students: 1250,
      description: 'Learn the fundamentals of DeFi security and common vulnerability patterns.',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'intermediate',
      title: 'Advanced Security Analysis',
      level: 'Intermediate',
      duration: '6 weeks',
      modules: 12,
      students: 890,
      description: 'Deep dive into complex attack patterns and sophisticated exploitation techniques.',
      icon: Code,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'advanced',
      title: 'Security Research & Development',
      level: 'Advanced',
      duration: '8 weeks',
      modules: 16,
      students: 340,
      description: 'Master security research methodologies and defense innovation techniques.',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const featuredLessons = [
    {
      title: 'Reentrancy Attacks Explained',
      type: 'Video',
      duration: '15 min',
      difficulty: 'Beginner',
      views: 2500
    },
    {
      title: 'Flash Loan Mechanics',
      type: 'Interactive',
      duration: '25 min',
      difficulty: 'Intermediate',
      views: 1800
    },
    {
      title: 'Oracle Price Manipulation',
      type: 'Case Study',
      duration: '30 min',
      difficulty: 'Advanced',
      views: 1200
    },
    {
      title: 'Access Control Best Practices',
      type: 'Tutorial',
      duration: '20 min',
      difficulty: 'Intermediate',
      views: 2100
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Educational Platform</h1>
        <p className="text-gray-600">Learn DeFi security through structured courses and interactive content</p>
      </div>

      {/* Learning Paths */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learningPaths.map((path) => (
            <div key={path.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-full ${path.bgColor} mr-4`}>
                    <path.icon className={`h-6 w-6 ${path.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{path.title}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      path.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                      path.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {path.level}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{path.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {path.duration}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {path.modules} modules
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {path.students} students
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  Start Learning
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Lessons */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Featured Lessons</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {featuredLessons.map((lesson, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                    <Play className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{lesson.title}</h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>{lesson.type}</span>
                      <span>{lesson.duration}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        lesson.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        lesson.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {lesson.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{lesson.views} views</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Watch Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Security Best Practices</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Smart Contract Development</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use OpenZeppelin libraries</li>
                <li>• Implement proper access controls</li>
                <li>• Add comprehensive tests</li>
                <li>• Use formal verification</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Audit & Testing</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multiple security audits</li>
                <li>• Automated testing suites</li>
                <li>• Fuzzing and property testing</li>
                <li>• Code review processes</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Monitoring & Response</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time monitoring</li>
                <li>• Automated alerts</li>
                <li>• Incident response plans</li>
                <li>• Regular security updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Learning Progress</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Beginner Path Completion</span>
                <span className="text-gray-900">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Intermediate Path Completion</span>
                <span className="text-gray-900">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Education;