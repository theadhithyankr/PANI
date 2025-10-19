import React from 'react';
import { 
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Briefcase,
  Heart,
  Star
} from 'lucide-react';

const HiredStep = ({ jobData, applicationData }) => {
  return (
    <div className="space-y-6">
      {/* Congratulations Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Congratulations! 🎉</h1>
          <p className="text-xl opacity-90 mb-4">You've been hired for the position!</p>
          <p className="text-lg opacity-80">Welcome to {jobData.company}</p>
        </div>
      </div>

      {/* Job Details Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your New Role</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Position Details</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{jobData?.title || 'Position Title'}</p>
                  <p className="text-sm text-gray-500">{jobData?.type || 'Full-time'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{jobData?.location || 'Location'}</p>
                  <p className="text-sm text-gray-500">{jobData?.type || 'Employment Type'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Hired Date</p>
                  <p className="text-sm text-gray-500">
                    {applicationData?.lastUpdateDate ? new Date(applicationData.lastUpdateDate).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Application Details</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Status: {applicationData?.status || 'Hired'}</p>
                  <p className="text-sm text-gray-500">Application successful</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Match Score: {applicationData?.matchScore || 'N/A'}%</p>
                  <p className="text-sm text-gray-500">AI compatibility rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">What's Next?</h2>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">1</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Visa Processing</h3>
              <p className="text-gray-600 text-sm mt-1">
                Our Velai team will help you with all visa documentation and processing. 
                This typically takes 4-8 weeks depending on your country and visa type.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Cultural Onboarding</h3>
              <p className="text-gray-600 text-sm mt-1">
                Specialized onboarding program designed for Indian professionals working abroad. 
                Learn about work culture, local customs, and professional norms.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="h-8 w-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Start Your Journey</h3>
              <p className="text-gray-600 text-sm mt-1">
                Begin your new role with confidence, supported by our ongoing mentorship 
                and cultural integration programs.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Key Resources */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Helpful Resources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Welcome Guide</h3>
            <p className="text-sm text-gray-600 mb-3">Complete guide for Indian professionals</p>
            <button className="text-violet-600 hover:text-violet-800 text-sm font-medium">
              Download PDF
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Community</h3>
            <p className="text-sm text-gray-600 mb-3">Connect with other Indian professionals</p>
            <button className="text-violet-600 hover:text-violet-800 text-sm font-medium">
              Join Community
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Success Stories</h3>
            <p className="text-sm text-gray-600 mb-3">Learn from others' experiences</p>
            <button className="text-violet-600 hover:text-violet-800 text-sm font-medium">
              Read Stories
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HiredStep;
