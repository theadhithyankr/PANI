import React, { useState } from 'react';
import { Globe, FileText, Calendar, MapPin, Phone, Mail, CheckCircle, Clock, AlertTriangle, Download, Upload } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { candidateVisaStatus } from '../../data/dummyData';

const VisaTrackingPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'relocation', label: 'Relocation Support' },
  ];

  const getDocumentStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'success';
      case 'pending': return 'warning';
      case 'not_started': return 'default';
      case 'verified': return 'info';
      default: return 'default';
    }
  };

  const getTimelineStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'scheduled': return 'info';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{candidateVisaStatus.visaType} Application</h3>
            <p className="text-gray-600">Application submitted on {candidateVisaStatus.applicationDate}</p>
          </div>
          <Badge variant="warning" size="sm">
            {candidateVisaStatus.status.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{candidateVisaStatus.progress}%</div>
            <div className="text-sm text-blue-800">Progress</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{candidateVisaStatus.expectedDecision}</div>
            <div className="text-sm text-green-800">Expected Decision</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{candidateVisaStatus.nextDeadline}</div>
            <div className="text-sm text-purple-800">Next Deadline</div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Application Progress</span>
            <span>{candidateVisaStatus.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${candidateVisaStatus.progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Current Step */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Current Step: {candidateVisaStatus.currentStep}</h4>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">What you need to do now:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Complete document collection for missing items</li>
            <li>• Schedule embassy appointment for biometrics</li>
            <li>• Prepare for visa interview questions</li>
            <li>• Ensure all documents are translated and notarized</li>
          </ul>
        </div>
      </Card>

      {/* Support Contact */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Your Visa Consultant</h4>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {candidateVisaStatus.assignedConsultant.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h5 className="font-medium text-gray-900">{candidateVisaStatus.assignedConsultant.name}</h5>
            <p className="text-sm text-gray-600">Immigration Specialist</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {candidateVisaStatus.assignedConsultant.email}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                {candidateVisaStatus.assignedConsultant.phone}
              </div>
            </div>
          </div>
          <Button variant="primary" size="sm">
            Contact Consultant
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      {/* Document Checklist */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Required Documents</h4>
        <div className="space-y-4">
          {candidateVisaStatus.documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  doc.status === 'submitted' ? 'bg-green-100' :
                  doc.status === 'pending' ? 'bg-yellow-100' :
                  'bg-gray-100'
                }`}>
                  {doc.status === 'submitted' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : doc.status === 'pending' ? (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">{doc.name}</h5>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Badge variant={getDocumentStatusColor(doc.status)} size="sm">
                      {doc.status.replace('_', ' ')}
                    </Badge>
                    {doc.required && <span className="text-red-500">Required</span>}
                    {doc.expiryDate && (
                      <span>Expires: {doc.expiryDate}</span>
                    )}
                    {doc.verified && (
                      <span className="text-green-600">✓ Verified</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {doc.status === 'submitted' ? (
                  <Button variant="ghost\" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Document Guidelines */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Document Guidelines</h4>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">General Requirements</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All documents must be in German or English</li>
              <li>• Non-German/English documents need certified translations</li>
              <li>• Documents should be no older than 3 months (unless specified)</li>
              <li>• Scanned copies should be high quality and clearly readable</li>
              <li>• File formats: PDF preferred, JPG/PNG acceptable</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-medium text-yellow-900 mb-2">Important Notes</h5>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Apostille certification required for documents from non-EU countries</li>
              <li>• University degrees must be recognized by German authorities</li>
              <li>• Health insurance must be valid from your arrival date</li>
              <li>• Employment contract should specify EU Blue Card eligibility</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-6">
      {/* Timeline */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-6">Application Timeline</h4>
        <div className="space-y-6">
          {candidateVisaStatus.timeline.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-100' :
                step.status === 'in_progress' ? 'bg-blue-100' :
                step.status === 'scheduled' ? 'bg-yellow-100' :
                'bg-gray-100'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : step.status === 'in_progress' ? (
                  <Clock className="w-5 h-5 text-blue-600" />
                ) : step.status === 'scheduled' ? (
                  <Calendar className="w-5 h-5 text-yellow-600" />
                ) : (
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900">{step.step}</h5>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getTimelineStatusColor(step.status)} size="sm">
                      {step.status.replace('_', ' ')}
                    </Badge>
                    {step.date && (
                      <span className="text-sm text-gray-500">{step.date}</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                
                {step.status === 'in_progress' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      This step is currently in progress. You'll be notified when it's completed.
                    </p>
                  </div>
                )}
                
                {step.status === 'scheduled' && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Scheduled for {step.date}. Please ensure you have all required documents ready.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Next Steps */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Upcoming Deadlines</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h5 className="font-medium text-red-900">Document Submission</h5>
                <p className="text-sm text-red-700">Complete missing documents</p>
              </div>
            </div>
            <span className="text-sm font-medium text-red-600">{candidateVisaStatus.nextDeadline}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <h5 className="font-medium text-blue-900">Embassy Appointment</h5>
                <p className="text-sm text-blue-700">Biometrics and interview</p>
              </div>
            </div>
            <span className="text-sm font-medium text-blue-600">2024-02-05</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderRelocation = () => (
    <div className="space-y-6">
      {/* Housing Assistance */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Housing Assistance</h4>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="font-medium text-gray-900">Status: {candidateVisaStatus.relocationSupport.housingAssistance.status}</h5>
            <p className="text-sm text-gray-600">Managed by {candidateVisaStatus.relocationSupport.housingAssistance.consultant}</p>
          </div>
          <Badge variant="warning" size="sm">In Progress</Badge>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {candidateVisaStatus.relocationSupport.housingAssistance.viewingsScheduled}
            </div>
            <div className="text-sm text-blue-800">Viewings Scheduled</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {candidateVisaStatus.relocationSupport.housingAssistance.shortlistedProperties}
            </div>
            <div className="text-sm text-green-800">Shortlisted Properties</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">€800-1200</div>
            <div className="text-sm text-purple-800">Budget Range</div>
          </div>
        </div>
      </Card>

      {/* Bank Account Setup */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Bank Account Setup</h4>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="font-medium text-gray-900">Status: {candidateVisaStatus.relocationSupport.bankAccount.status}</h5>
            <p className="text-sm text-gray-600">Required for salary payments and rent</p>
          </div>
          <Badge variant="default" size="sm">Pending</Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <h6 className="font-medium text-gray-900 mb-2">Recommended Banks</h6>
            <div className="grid md:grid-cols-3 gap-3">
              {candidateVisaStatus.relocationSupport.bankAccount.recommendedBanks.map((bank, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg text-center">
                  <p className="font-medium text-gray-900">{bank}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h6 className="font-medium text-gray-900 mb-2">Required Documents</h6>
            <ul className="text-sm text-gray-700 space-y-1">
              {candidateVisaStatus.relocationSupport.bankAccount.documentsRequired.map((doc, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* City Registration */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">City Registration (Anmeldung)</h4>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="font-medium text-gray-900">Status: {candidateVisaStatus.relocationSupport.cityRegistration.status}</h5>
            <p className="text-sm text-gray-600">Mandatory within 14 days of arrival</p>
          </div>
          <Badge variant="default" size="sm">Pending</Badge>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h6 className="font-medium text-yellow-900">Important Information</h6>
              <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                <li>• Appointment required: {candidateVisaStatus.relocationSupport.cityRegistration.appointmentRequired ? 'Yes' : 'No'}</li>
                <li>• Estimated wait time: {candidateVisaStatus.relocationSupport.cityRegistration.estimatedWaitTime}</li>
                <li>• Must be completed before bank account opening</li>
                <li>• Required for tax registration and health insurance</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Support Services */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Additional Support Services</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { service: 'Airport Pickup', status: 'Included', description: 'Transportation from airport to temporary housing' },
            { service: 'SIM Card Setup', status: 'Included', description: 'German mobile phone plan assistance' },
            { service: 'Tax Registration', status: 'Included', description: 'Help with German tax number application' },
            { service: 'Health Insurance', status: 'Included', description: 'Guidance on German health insurance options' },
            { service: 'Language Classes', status: 'Optional', description: 'German language course recommendations' },
            { service: 'Cultural Orientation', status: 'Included', description: 'Introduction to German workplace culture' },
          ].map((item, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h6 className="font-medium text-gray-900">{item.service}</h6>
                <Badge variant={item.status === 'Included' ? 'success' : 'default'} size="sm">
                  {item.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'documents': return renderDocuments();
      case 'timeline': return renderTimeline();
      case 'relocation': return renderRelocation();
      default: return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visa & Relocation Tracking</h1>
          <p className="text-gray-600 mt-1">Track your visa application and relocation progress</p>
        </div>
        <Button variant="primary">
          <Download className="w-4 h-4 mr-2" />
          Download Status Report
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{candidateVisaStatus.visaType}</h2>
              <p className="text-gray-600">Current step: {candidateVisaStatus.currentStep}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{candidateVisaStatus.progress}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${candidateVisaStatus.progress}%` }}
          />
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default VisaTrackingPage;
