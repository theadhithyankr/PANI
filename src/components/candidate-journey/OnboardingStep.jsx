import React, { useState } from 'react';
import { 
  Globe,
  Users,
  BookOpen,
  Calendar,
  Video,
  MessageSquare,
  CheckCircle,
  Clock,
  Play,
  Star,
  Heart,
  Coffee,
  Building,
  MapPin,
  Phone,
  Download
} from 'lucide-react';

const OnboardingStep = ({ onboardingData, onCompleteModule, onScheduleSession }) => {
  const [completedModules, setCompletedModules] = useState(onboardingData.completedModules || []);

  const culturalModules = [
    {
      id: 'workplace_culture',
      title: 'Workplace Culture & Communication',
      description: 'Understanding professional communication styles, meeting etiquette, and workplace norms',
      duration: '45 minutes',
      type: 'video',
      status: completedModules.includes('workplace_culture') ? 'completed' : 'available',
      topics: ['Email etiquette', 'Meeting participation', 'Feedback culture', 'Work-life balance']
    },
    {
      id: 'social_integration',
      title: 'Social Integration & Networking',
      description: 'Building relationships with colleagues and understanding social dynamics',
      duration: '30 minutes',
      type: 'interactive',
      status: completedModules.includes('social_integration') ? 'completed' : 'available',
      topics: ['Small talk', 'Team bonding', 'Professional networking', 'Social events']
    },
    {
      id: 'local_customs',
      title: 'Local Customs & Daily Life',
      description: 'Practical guidance for daily life in your new country',
      duration: '60 minutes',
      type: 'guide',
      status: completedModules.includes('local_customs') ? 'completed' : 'available',
      topics: ['Banking & finances', 'Transportation', 'Healthcare', 'Housing']
    },
    {
      id: 'legal_compliance',
      title: 'Legal & Compliance Basics',
      description: 'Understanding your rights, responsibilities, and legal requirements',
      duration: '40 minutes',
      type: 'video',
      status: completedModules.includes('legal_compliance') ? 'completed' : 'available',
      topics: ['Visa obligations', 'Tax basics', 'Employment rights', 'Emergency contacts']
    },
    {
      id: 'career_development',
      title: 'Career Growth & Development',
      description: 'Strategies for long-term career success in your new environment',
      duration: '50 minutes',
      type: 'interactive',
      status: completedModules.includes('career_development') ? 'completed' : 'locked',
      topics: ['Performance reviews', 'Career planning', 'Skill development', 'Leadership opportunities']
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      title: 'Welcome & Cultural Orientation',
      type: 'group',
      date: '2024-02-05',
      time: '10:00 AM EST',
      duration: '2 hours',
      facilitator: 'Dr. Priya Sharma',
      description: 'Interactive session covering cultural adaptation and workplace integration',
      participants: 8
    },
    {
      id: 2,
      title: 'One-on-One Mentoring Session',
      type: 'individual',
      date: '2024-02-08',
      time: '2:00 PM EST',
      duration: '1 hour',
      facilitator: 'Raj Patel',
      description: 'Personalized guidance and Q&A about your specific situation',
      participants: 1
    }
  ];

  const handleCompleteModule = (moduleId) => {
    setCompletedModules(prev => [...prev, moduleId]);
    onCompleteModule?.(moduleId);
  };

  const getModuleIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'interactive':
        return <Users className="h-5 w-5" />;
      case 'guide':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const progressPercentage = (completedModules.length / culturalModules.length) * 100;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Globe className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cultural Onboarding Program</h1>
            <p className="text-lg opacity-90">Welcome to your journey of cultural adaptation!</p>
          </div>
        </div>
        <p className="text-violet-100">
          Our specialized program is designed to help Indian professionals successfully integrate 
          into {onboardingData.country} work culture and society.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
          <span className="text-sm text-gray-600">
            {completedModules.length}/{culturalModules.length} modules completed
          </span>
        </div>
        
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-violet-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{Math.round(progressPercentage)}% complete</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Hours Completed</span>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{completedModules.length * 0.75}h</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Sessions Attended</span>
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">{onboardingData.sessionsAttended}</p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-700">Mentor Meetings</span>
              <MessageSquare className="h-4 w-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">{onboardingData.mentorMeetings}</p>
          </div>
        </div>
      </div>

      {/* Cultural Learning Modules */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Learning Modules</h2>
        
        <div className="space-y-4">
          {culturalModules.map((module, index) => (
            <div key={module.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    module.status === 'completed' 
                      ? 'bg-green-100 text-green-600'
                      : module.status === 'available'
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {module.status === 'completed' ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      getModuleIcon(module.type)
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{module.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        module.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : module.status === 'available'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {module.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {module.topics.map((topic, topicIndex) => (
                        <span key={topicIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {module.duration}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  {module.status === 'completed' ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  ) : module.status === 'available' ? (
                    <button 
                      onClick={() => handleCompleteModule(module.id)}
                      className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </button>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className="text-sm">Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Sessions</h2>
        
        <div className="space-y-4">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {session.type === 'group' ? (
                      <Users className="h-6 w-6 text-blue-600" />
                    ) : (
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{session.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{session.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(session.date).toLocaleDateString()} at {session.time}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {session.duration}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {session.participants} participant{session.participants > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">Facilitator: </span>
                      <span className="text-sm font-medium text-gray-900">{session.facilitator}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => onScheduleSession?.(session.id)}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                >
                  Join Session
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Resources */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Support Resources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Coffee className="h-6 w-6 text-blue-600" />
              <h3 className="font-medium text-blue-900">Cultural Mentor</h3>
            </div>
            <p className="text-blue-700 font-medium">{onboardingData.culturalMentor.name}</p>
            <p className="text-blue-600 text-sm">{onboardingData.culturalMentor.background}</p>
            <button className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
              Schedule 1:1 Meeting
            </button>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Heart className="h-6 w-6 text-green-600" />
              <h3 className="font-medium text-green-900">Peer Support Group</h3>
            </div>
            <p className="text-green-700 text-sm mb-3">
              Connect with other Indian professionals in {onboardingData.country}
            </p>
            <button className="text-green-600 hover:text-green-800 text-sm font-medium">
              Join Community
            </button>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Star className="h-6 w-6 text-yellow-600" />
              <h3 className="font-medium text-yellow-900">Success Stories</h3>
            </div>
            <p className="text-yellow-700 text-sm mb-3">
              Learn from others who've successfully made the transition
            </p>
            <button className="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
              Read Stories
            </button>
          </div>
          
          <div className="bg-violet-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Download className="h-6 w-6 text-violet-600" />
              <h3 className="font-medium text-violet-900">Resource Library</h3>
            </div>
            <p className="text-violet-700 text-sm mb-3">
              Guides, checklists, and helpful documents
            </p>
            <button className="text-violet-600 hover:text-violet-800 text-sm font-medium">
              Browse Resources
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">Important Contacts</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Velai Support</h3>
            <div className="space-y-1 text-sm">
              <p className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                +1-800-VELAI-24
              </p>
              <p className="text-gray-600">24/7 Emergency Hotline</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Embassy/Consulate</h3>
            <div className="space-y-1 text-sm">
              <p className="flex items-center text-gray-600">
                <Building className="h-4 w-4 mr-2" />
                Indian Embassy
              </p>
              <p className="text-gray-600">{onboardingData.embassy.phone}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Local Emergency</h3>
            <div className="space-y-1 text-sm">
              <p className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {onboardingData.emergency.number}
              </p>
              <p className="text-gray-600">Police/Fire/Medical</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep;
