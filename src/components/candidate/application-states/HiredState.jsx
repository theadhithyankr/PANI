import React, { useState } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Building, 
  Euro, 
  FileText, 
  Download, 
  MessageCircle, 
  Star,
  Trophy,
  PartyPopper,
  Users,
  Clock,
  Award
} from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import Timeline from '../../common/Timeline';
import Confetti from '../../common/Confetti';

const HiredState = ({ application, job }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getOnboardingSteps = () => [
    {
      id: 'welcome',
      title: 'Welcome Package',
      description: 'Company welcome materials and onboarding documents',
      status: 'completed',
      date: formatDate(application?.hiredDate || application?.updatedAt),
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'paperwork',
      title: 'Employment Paperwork',
      description: 'Contract signing and legal documentation',
      status: 'completed',
      date: formatDate(application?.hiredDate || application?.updatedAt),
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'equipment',
      title: 'Equipment Setup',
      description: 'Laptop, access credentials, and tools',
      status: 'in_progress',
      date: 'In Progress',
      icon: <Building className="w-4 h-4" />
    },
    {
      id: 'orientation',
      title: 'Company Orientation',
      description: 'Meet the team and learn company processes',
      status: 'pending',
      date: 'Scheduled',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'training',
      title: 'Role-Specific Training',
      description: 'Technical training and project onboarding',
      status: 'pending',
      date: 'Upcoming',
      icon: <Award className="w-4 h-4" />
    }
  ];

  const getNextSteps = () => [
    {
      title: 'Complete Employment Paperwork',
      description: 'Sign your employment contract and complete all required forms',
      timeframe: 'Within 48 hours',
      priority: 'high'
    },
    {
      title: 'Equipment Setup',
      description: 'Receive your laptop and set up access to company systems',
      timeframe: '1-2 business days',
      priority: 'high'
    },
    {
      title: 'Meet Your Team',
      description: 'Schedule introductory calls with your new colleagues',
      timeframe: 'This week',
      priority: 'medium'
    },
    {
      title: 'Review Company Policies',
      description: 'Familiarize yourself with company culture and policies',
      timeframe: 'Before start date',
      priority: 'medium'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Success Celebration */}
      {showConfetti && (
        <Confetti 
          onComplete={() => setShowConfetti(false)}
          duration={3000}
        />
      )}

      {/* Hired Success Hero */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            🎉 Congratulations! You're Hired!
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            Welcome to the team! Your journey with {job?.company} begins now.
          </p>
          
          <div className="flex justify-center space-x-8 text-sm mb-6">
            <div className="text-center">
              <div className="font-semibold text-green-600 text-lg">
                {formatDate(application?.hiredDate || application?.updatedAt)}
              </div>
              <div className="text-gray-600">Hired Date</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600 text-lg">
                {application?.matchScore || 95}%
              </div>
              <div className="text-gray-600">Match Score</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600 text-lg">
                {application?.position || job?.title}
              </div>
              <div className="text-gray-600">Position</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="primary" size="lg">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact HR
            </Button>
            <Button variant="outline" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Contract
            </Button>
          </div>
        </div>
      </Card>

      {/* Onboarding Progress */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Onboarding Progress</h3>
          <Badge variant="success" size="sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hired
          </Badge>
        </div>
        
        <Timeline steps={getOnboardingSteps()} />
      </Card>

      {/* Next Steps */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
        <div className="space-y-4">
          {getNextSteps().map((step, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.priority === 'high' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <span className={`text-sm font-bold ${
                  step.priority === 'high' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <Badge 
                    variant={step.priority === 'high' ? 'error' : 'info'} 
                    size="xs"
                  >
                    {step.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {step.timeframe}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Company Information */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome to {job?.company}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-blue-500" />
              <div>
                <h4 className="font-medium text-gray-900">Company</h4>
                <p className="text-sm text-gray-600">{job?.company}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-medium text-gray-900">Location</h4>
                <p className="text-sm text-gray-600">{job?.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Euro className="w-5 h-5 text-purple-500" />
              <div>
                <h4 className="font-medium text-gray-900">Position</h4>
                <p className="text-sm text-gray-600">{job?.title}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Quick Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete all paperwork promptly</li>
              <li>• Set up your work environment</li>
              <li>• Review company policies and culture</li>
              <li>• Prepare for your first day</li>
              <li>• Connect with your new team</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Action Panel */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="primary" className="flex-1">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Hiring Manager
          </Button>
          <Button variant="outline" className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            View Onboarding Guide
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download Welcome Package
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HiredState; 