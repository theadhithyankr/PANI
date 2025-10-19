import React, { useState } from 'react';
import { 
  Download,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  X
} from 'lucide-react';

const OfferLetterStep = ({ offerData, onUploadDocument, onAcceptOffer, onDeclineOffer }) => {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  // Handle case where offerData is null or invalid
  if (!offerData || typeof offerData !== 'object') {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Offer Available</h3>
              <p className="text-gray-600">
                You don't have an offer letter for this application yet. 
                Please wait for the employer to send you an offer.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Defensive defaults
  const offerStatus = offerData.status || 'pending';
  const offerDeadline = offerData.deadline ? new Date(offerData.deadline) : null;
  const offerBenefits = Array.isArray(offerData.benefits) ? offerData.benefits : [];
  const offerJobTitle = offerData.jobTitle || 'Job Title';
  const offerCompany = offerData.company || 'Company';
  const offerSalary = offerData.salary || '—';
  const offerStartDate = offerData.startDate ? new Date(offerData.startDate) : null;
  const offerLocation = offerData.location || '—';
  const offerEmploymentType = offerData.employmentType || '—';
  const offerAdditionalTerms = offerData.additionalTerms || '';
  const requiredDocs = Array.isArray(offerData.requiredDocuments) ? offerData.requiredDocuments : [];

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
        status: 'uploaded'
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

  return (
    <div className="space-y-6">
      {/* Offer Status Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Offer Letter</h2>
            <p className="text-gray-600">Congratulations! You've received a job offer</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              offerStatus === 'pending' 
                ? 'bg-yellow-100 text-yellow-800'
                : offerStatus === 'accepted'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {offerStatus}
            </span>
          </div>
        </div>
        
        {offerDeadline && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Response Required by {offerDeadline.toLocaleDateString()}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Please review and respond to this offer before the deadline
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Offer Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Offer Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-violet-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-violet-700">Annual Salary</span>
              <DollarSign className="h-4 w-4 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-violet-900">{offerSalary}</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Start Date</span>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-blue-900">{offerStartDate ? offerStartDate.toLocaleDateString() : '—'}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Location</span>
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-900">{offerLocation}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-700">Employment Type</span>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-lg font-semibold text-orange-900">{offerEmploymentType}</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-8">
          <h4 className="font-medium text-gray-900 mb-3">Benefits & Perks</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offerBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Terms */}
        {offerAdditionalTerms && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Additional Terms</h4>
            <p className="text-gray-600 text-sm">{offerAdditionalTerms}</p>
          </div>
        )}
      </div>

      {/* Download Offer Letter */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Official Offer Letter</h3>
        
        <div className="flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-violet-600" />
            <div>
              <p className="font-medium text-gray-900">Offer Letter - {offerJobTitle}</p>
              <p className="text-sm text-gray-500">PDF Document • {offerCompany}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </button>
            <button className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Upload Documents */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
        <p className="text-gray-600 mb-6">Please upload the following documents to proceed with your offer acceptance</p>
        
        <div className="space-y-4">
          {/* Signed Offer Letter */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Signed Offer Letter *</h4>
              <span className="text-sm text-red-600">Required</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Upload the signed copy of your offer letter</p>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 'signed_offer')}
                  disabled={isUploading}
                />
              </label>
              {isUploading && (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600 mr-2"></div>
                  Uploading...
                </div>
              )}
            </div>
          </div>

          {/* Additional Documents */}
          {requiredDocs.map((docType, index) => (
            <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{docType.name}</h4>
                <span className={`text-sm ${docType.required ? 'text-red-600' : 'text-gray-500'}`}>
                  {docType.required ? 'Required' : 'Optional'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{docType.description}</p>
              
              <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm w-fit">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
                <input 
                  type="file" 
                  className="hidden" 
                  accept={docType.acceptedFormats}
                  onChange={(e) => handleFileUpload(e, docType.type)}
                  disabled={isUploading}
                />
              </label>
            </div>
          ))}
        </div>

        {/* Uploaded Documents */}
        {uploadedDocuments.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents</h4>
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded on {doc.uploadDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeDocument(doc.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {offerStatus === 'pending' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Ready to respond?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Make sure you've reviewed all terms and uploaded required documents
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowDeclineModal(true)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
              <button 
                onClick={onAcceptOffer}
                disabled={uploadedDocuments.length === 0}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Decline Offer</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to decline this offer? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onDeclineOffer?.();
                  setShowDeclineModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Decline Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLetterStep;
