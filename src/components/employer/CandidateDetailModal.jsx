import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Star, MapPin, Calendar, FileText, Video, MessageCircle, UserCheck, UserX, Download, Eye } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';

const CandidateDetailModal = ({ candidate, isOpen, onClose, onShortlist, onReject, onScheduleInterview }) => {
  const { t } = useTranslation('employer');
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !candidate) return null;

  const tabs = [
    { id: 'overview', label: t('candidateDetailModal.tabs.overview'), icon: Star },
    { id: 'experience', label: t('candidateDetailModal.tabs.experience'), icon: Calendar },
    { id: 'documents', label: t('candidateDetailModal.tabs.documents'), icon: FileText },
    { id: 'match', label: t('candidateDetailModal.tabs.match'), icon: Star },
  ];

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Professional Summary */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">{t('candidateDetailModal.professionalSummary')}</h3>
        <p className="text-gray-700 leading-relaxed">
          Experienced {candidate.position} with {candidate.experience} of hands-on experience in modern web technologies. 
          Passionate about creating scalable solutions and working in collaborative environments. 
          Strong background in {candidate.skills.slice(0, 3).join(', ')} with a proven track record of delivering high-quality projects.
        </p>
      </Card>

      {/* Skills Matrix */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">{t('candidateDetailModal.skillsExpertise')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {candidate.skills.map((skill, index) => {
            const proficiency = [t('candidateDetailModal.proficiency.expert'), t('candidateDetailModal.proficiency.advanced'), t('candidateDetailModal.proficiency.intermediate'), t('candidateDetailModal.proficiency.beginner')][index % 4];
            const proficiencyColor = {
              [t('candidateDetailModal.proficiency.expert')]: 'bg-green-100 text-green-800',
              [t('candidateDetailModal.proficiency.advanced')]: 'bg-blue-100 text-blue-800',
              [t('candidateDetailModal.proficiency.intermediate')]: 'bg-yellow-100 text-yellow-800',
              [t('candidateDetailModal.proficiency.beginner')]: 'bg-gray-100 text-gray-800'
            }[proficiency];

            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{skill}</span>
                <Badge variant="default" className={proficiencyColor} size="sm">
                  {proficiency}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Personal Details */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">{t('candidateDetailModal.personalInformation')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">{t('candidateDetailModal.location')}</label>
            <p className="text-gray-900">{candidate.location}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{t('candidateDetailModal.experienceYears')}</label>
            <p className="text-gray-900">{candidate.experience}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{t('candidateDetailModal.expectedSalary')}</label>
            <p className="text-gray-900">{candidate.expectedSalary}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{t('candidateDetailModal.relocation')}</label>
            <p className="text-gray-900">{candidate.relocatable ? t('candidateDetailModal.openToRelocate') : t('candidateDetailModal.prefersCurrentLocation')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{t('candidateDetailModal.education')}</label>
            <p className="text-gray-900">{candidate.education || 'B.Tech Computer Science'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{t('candidateDetailModal.languages')}</label>
            <p className="text-gray-900">{candidate.languages?.join(', ') || 'English, Hindi'}</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold mb-4">{t('candidateDetailModal.workExperience')}</h3>
        <div className="space-y-6">
          {[
            {
              title: 'Senior Software Developer',
              company: 'Tech Solutions Pvt Ltd',
              duration: '2022 - Present',
              description: 'Led development of microservices architecture, mentored junior developers, and implemented CI/CD pipelines.'
            },
            {
              title: 'Software Developer',
              company: 'Innovation Labs',
              duration: '2020 - 2022',
              description: 'Developed full-stack web applications using React and Node.js, collaborated with cross-functional teams.'
            },
            {
              title: 'Junior Developer',
              company: 'StartUp Inc',
              duration: '2019 - 2020',
              description: 'Built responsive web interfaces, participated in agile development processes, and learned modern development practices.'
            }
          ].map((job, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900">{job.title}</h4>
              <p className="text-blue-600 font-medium">{job.company}</p>
              <p className="text-sm text-gray-500 mb-2">{job.duration}</p>
              <p className="text-gray-700">{job.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Education</h3>
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold text-gray-900">Bachelor of Technology - Computer Science</h4>
          <p className="text-green-600 font-medium">Indian Institute of Technology</p>
          <p className="text-sm text-gray-500">2015 - 2019 • CGPA: 8.5/10</p>
        </div>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-4">
      {[
        { name: 'Resume_2024.pdf', type: 'Resume', size: '245 KB', uploaded: '2024-01-15' },
        { name: 'Portfolio_Projects.pdf', type: 'Portfolio', size: '1.2 MB', uploaded: '2024-01-15' },
        { name: 'Certificates.pdf', type: 'Certificates', size: '890 KB', uploaded: '2024-01-10' },
        { name: 'Cover_Letter.pdf', type: 'Cover Letter', size: '156 KB', uploaded: '2024-01-15' },
      ].map((doc, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{doc.name}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{doc.type}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>Uploaded {doc.uploaded}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderMatchAnalysis = () => (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AI Match Score</h3>
          <div className={`px-4 py-2 rounded-full font-bold text-lg ${getMatchColor(candidate.matchScore)}`}>
            {candidate.matchScore}%
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${candidate.matchScore}%` }}
          />
        </div>
        <p className="text-gray-700">
          This candidate shows excellent alignment with your requirements based on skills, experience, and cultural fit indicators.
        </p>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Match Breakdown</h3>
        <div className="space-y-4">
          {[
            { category: 'Technical Skills', score: 95, reason: 'Strong expertise in React, Node.js, and Python' },
            { category: 'Experience Level', score: 88, reason: '5 years matches your senior-level requirement' },
            { category: 'Cultural Fit', score: 92, reason: 'Values align with company culture based on profile analysis' },
            { category: 'Location Preference', score: 85, reason: 'Open to relocation and remote work' },
            { category: 'Salary Expectations', score: 90, reason: 'Expected range aligns with your budget' },
          ].map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{item.category}</h4>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getMatchColor(item.score)}`}>
                  {item.score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{item.reason}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-green-900">Strong Technical Match</p>
              <p className="text-sm text-green-700">Candidate's skills directly align with job requirements</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-blue-900">Interview Focus Areas</p>
              <p className="text-sm text-blue-700">Discuss system design experience and team leadership skills</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-yellow-900">Consider for Fast Track</p>
              <p className="text-sm text-yellow-700">High match score suggests expedited interview process</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'experience': return renderExperience();
      case 'documents': return renderDocuments();
      case 'match': return renderMatchAnalysis();
      default: return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-4">
              <img
                src={candidate.avatar || `https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400`}
                alt={candidate.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                <p className="text-lg text-gray-600">{candidate.position}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {candidate.location}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(candidate.matchScore)}`}>
                    {candidate.matchScore}% Match
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {renderTabContent()}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => onScheduleInterview(candidate)}>
                <Video className="w-4 h-4 mr-2" />
                Schedule Interview
              </Button>
              <Button variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => onReject(candidate)}>
                <UserX className="w-4 h-4 mr-2" />
                Not a Fit
              </Button>
              <Button variant="primary" onClick={() => onShortlist(candidate)}>
                <UserCheck className="w-4 h-4 mr-2" />
                Move to Next Stage
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;
