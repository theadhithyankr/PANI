import React, { useState } from 'react';
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Eye,
  X,
  Plane,
  Calendar,
  User,
  Globe,
  MessageSquare
} from 'lucide-react';

const VisaProcessingStep = ({ visaData, onUploadDocument, onContactSupport }) => {
  const [uploadedDocuments, setUploadedDocuments] = useState(visaData.uploadedDocuments || []);
  const [isUploading, setIsUploading] = useState(false);

  const requiredDocuments = [
    {
      id: 'passport',
      name: 'Passport Copy',
      description: 'Clear scan of all passport pages (including blank pages)',
      required: true,
      status: uploadedDocuments.find(doc => doc.type === 'passport') ? 'uploaded' : 'pending',
      acceptedFormats: '.pdf,.jpg,.jpeg,.png'
    },
    {
      id: 'photo',
      name: 'Passport Size Photos',
      description: '2x2 inch photos with white background (digital format)',
      required: true,
      status: uploadedDocuments.find(doc => doc.type === 'photo') ? 'uploaded' : 'pending',
      acceptedFormats: '.jpg,.jpeg,.png'
    },
    {
      id: 'degree',
      name: 'Educational Certificates',
      description: 'Degree certificates, transcripts, and mark sheets',
      required: true,
      status: uploadedDocuments.find(doc => doc.type === 'degree') ? 'uploaded' : 'pending',
      acceptedFormats: '.pdf,.jpg,.jpeg,.png'
    },
    {
      id: 'experience',
      name: 'Work Experience Letters',
      description: 'Experience letters from previous employers',
      required: true,
      status: uploadedDocuments.find(doc => doc.type === 'experience') ? 'uploaded' : 'pending',
      acceptedFormats: '.pdf,.doc,.docx'
    },
    {
      id: 'bank_statement',
      name: 'Bank Statements',
      description: 'Last 6 months bank statements',
      required: true,
      status: uploadedDocuments.find(doc => doc.type === 'bank_statement') ? 'uploaded' : 'pending',
      acceptedFormats: '.pdf'
    },
    {
      id: 'birth_certificate',
      name: 'Birth Certificate',
      description: 'Official birth certificate or equivalent',
      required: true,
      status: uploadedDocuments.find(doc => doc.type === 'birth_certificate') ? 'uploaded' : 'pending',
      acceptedFormats: '.pdf,.jpg,.jpeg,.png'
    },
    {
      id: 'police_clearance',
      name: 'Police Clearance Certificate',
      description: 'From Indian authorities (if not available, we will guide you)',
      required: false,
      status: uploadedDocuments.find(doc => doc.type === 'police_clearance') ? 'uploaded' : 'pending',
      acceptedFormats: '.pdf,.jpg,.jpeg,.png'
    },
    {
      id: 'medical_exam',
      name: 'Medical Examination',
      description: 'Will be scheduled after initial document review',
      required: false,
      status: 'not_required_yet',
      acceptedFormats: '.pdf'
    }
  ];

  const handleFileUpload = async (event, documentType) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument = {
        id: Date.now(),
        name: file.name,
        type: documentType,
        uploadDate: new Date(),
        status: 'uploaded',
        size: file.size
      };
      
      setUploadedDocuments(prev => [...prev, newDocument]);
      onUploadDocument?.(newDocument);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (documentId) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploaded':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'not_required_yet':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const completedDocs = requiredDocuments.filter(doc => doc.required && doc.status === 'uploaded').length;
  const totalRequiredDocs = requiredDocuments.filter(doc => doc.required).length;
  const progressPercentage = (completedDocs / totalRequiredDocs) * 100;

  return (
    <div className="space-y-6">
      {/* Visa Status Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Visa Processing</h2>
            <p className="text-gray-600">Upload required documents for your visa application</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              visaData.status === 'documents_pending' 
                ? 'bg-yellow-100 text-yellow-800'
                : visaData.status === 'under_review'
                ? 'bg-blue-100 text-blue-800'
                : visaData.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <Plane className="h-3 w-3 mr-1 inline" />
              {visaData.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Document Upload Progress</span>
            <span>{completedDocs}/{totalRequiredDocs} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Visa Specialist Contact */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Your Visa Specialist</p>
              <p className="text-blue-700">{visaData.specialist.name}</p>
              <p className="text-sm text-blue-600">{visaData.specialist.email}</p>
            </div>
            <button 
              onClick={onContactSupport}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact
            </button>
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Required Documents</h3>
        
        <div className="space-y-6">
          {requiredDocuments.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status === 'uploaded' ? 'Uploaded' : 
                       doc.status === 'pending' ? (doc.required ? 'Required' : 'Optional') :
                       'Not Required Yet'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{doc.description}</p>
                </div>
                
                {doc.status !== 'not_required_yet' && (
                  <div className="ml-4">
                    {doc.status === 'uploaded' ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-600">Uploaded</span>
                      </div>
                    ) : (
                      <label className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors cursor-pointer text-sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                        <input 
                          type="file" 
                          className="hidden" 
                          accept={doc.acceptedFormats}
                          onChange={(e) => handleFileUpload(e, doc.id)}
                          disabled={isUploading}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
              
              {/* Show uploaded documents for this type */}
              {uploadedDocuments.filter(uploadedDoc => uploadedDoc.type === doc.id).map((uploadedDoc) => (
                <div key={uploadedDoc.id} className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{uploadedDoc.name}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded on {uploadedDoc.uploadDate.toLocaleDateString()} • 
                          {(uploadedDoc.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-600 hover:text-gray-800">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => removeDocument(uploadedDoc.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {isUploading && (
          <div className="mt-4 flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600 mr-3"></div>
            <span className="text-gray-600">Uploading document...</span>
          </div>
        )}
      </div>

      {/* Visa Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Visa Processing Timeline</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              completedDocs === totalRequiredDocs ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {completedDocs === totalRequiredDocs ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-bold">1</span>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                completedDocs === totalRequiredDocs ? 'text-gray-900' : 'text-blue-600'
              }`}>
                Document Collection
              </p>
              <p className="text-sm text-gray-500">
                {completedDocs === totalRequiredDocs 
                  ? 'All required documents uploaded' 
                  : `${completedDocs}/${totalRequiredDocs} documents uploaded`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              visaData.status === 'under_review' || visaData.status === 'approved'
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {visaData.status === 'under_review' || visaData.status === 'approved' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-bold">2</span>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                visaData.status === 'under_review' || visaData.status === 'approved'
                  ? 'text-gray-900' 
                  : 'text-gray-500'
              }`}>
                Initial Review
              </p>
              <p className="text-sm text-gray-500">
                Velai team reviews and prepares your application (2-3 days)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              visaData.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className="text-sm font-bold">3</span>
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                visaData.status === 'approved' ? 'text-gray-900' : 'text-gray-500'
              }`}>
                Government Processing
              </p>
              <p className="text-sm text-gray-500">
                Official visa processing by government authorities (4-8 weeks)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-400">
              <span className="text-sm font-bold">4</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-500">Visa Approval</p>
              <p className="text-sm text-gray-500">
                Receive your visa and prepare for travel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-900 mb-2">Important Notes</h3>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• All documents must be clear and legible</li>
              <li>• Educational documents may need to be evaluated by WES or similar agencies</li>
              <li>• Police clearance certificate should be obtained if you've lived in India for 6+ months after age 18</li>
              <li>• Medical examination will be scheduled after initial document review</li>
              <li>• Processing times may vary based on your country and visa type</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Need Help?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Our visa specialists are here to guide you through every step
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <Download className="h-4 w-4 mr-2" />
              Document Checklist
            </button>
            <button 
              onClick={onContactSupport}
              className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaProcessingStep;
