import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, User, Send, CheckCircle, AlertCircle, Info, Eye, Trash2, Download } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import FileUpload from '../common/FileUpload';
import Stepper from '../common/Stepper';
import { useDocumentUpload } from '../../hooks/candidate/useDocumentUpload';
import { useJobApplication } from '../../hooks/candidate/useJobApplication';
import { useAuth } from '../../hooks/common/useAuth';
import { useJobSeekerProfile } from '../../hooks/candidate/useJobSeekerProfile';
import useDocumentsStore from '../../store/documentsStore';
import { supabase } from '../../clients/supabaseClient';
import { useToast } from '../../hooks/common/useToast';

const ApplicationModal = ({ job, isOpen, onClose, onSubmit }) => {
  const { user } = useAuth();
  const { uploadDocument, uploading, uploadError, uploadProgress } = useDocumentUpload();
  const { submitApplication, submitting, error: applicationError } = useJobApplication();
  const { 
    documents, 
    fetchDocuments, 
    isLoading: documentsLoading,
    getDocumentUrl,
    deleteDocument: deleteDocumentFromStore 
  } = useDocumentsStore();
  
  // Get user profile data for prefilling
  const { basicProfile, profile: jobSeekerProfile } = useJobSeekerProfile(user?.id);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [existingApplication, setExistingApplication] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [selectedDocuments, setSelectedDocuments] = useState({
    resume: null,
    coverLetter: null,
    additional: []
  });
  const [applicationData, setApplicationData] = useState({
    message: '',
    resumeId: null,
    coverLetterId: null,
    additionalDocumentIds: [],
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      currentLocation: ''
    },
    jobSpecific: {
      availabilityDate: '',
      salaryExpectation: '',
      visaStatus: '',
      relocatable: false,
      motivation: ''
    },
    customQuestions: {}
  });
  const { error: showError } = useToast();
  
  // Fetch user's documents when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchDocuments(user.id);
    }
  }, [isOpen, user?.id, fetchDocuments]);

  // Check for existing application when modal opens
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (isOpen && user?.id && job?.id) {
        try {
          const { data: application, error } = await supabase
            .from('job_applications_v2')
            .select('*')
            .eq('job_id', job.id)
            .eq('applicant_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error checking existing application:', error);
            return;
          }

          if (application) {
            setExistingApplication(application);
          }
        } catch (error) {
          console.error('Error checking existing application:', error);
        }
      }
    };

    checkExistingApplication();
  }, [isOpen, user?.id, job?.id]);

  // Reset form when modal closes and prefill with user data when opens
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setExistingApplication(null);
      setIsSubmitting(false);
      submittingRef.current = false;
      setSelectedDocuments({
        resume: null,
        coverLetter: null,
        additional: []
      });
      setApplicationData(prev => ({
        message: '',
        resumeId: null,
        coverLetterId: null,
        additionalDocumentIds: [],
        personalInfo: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          currentLocation: ''
        },
        jobSpecific: {
          ...prev.jobSpecific,
          salaryExpectation: jobSeekerProfile?.target_salary_range ? 
            `${jobSeekerProfile.target_salary_range.currency || '€'}${jobSeekerProfile.target_salary_range.min || ''} - ${jobSeekerProfile.target_salary_range.currency || '€'}${jobSeekerProfile.target_salary_range.max || ''}` : '',
          relocatable: jobSeekerProfile?.willing_to_relocate || false
        },
        customQuestions: {}
      }));
    } else if (isOpen && basicProfile) {
      // Prefill personal info when modal opens
      const fullName = basicProfile.full_name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setApplicationData(prev => ({
        ...prev,
        personalInfo: {
          firstName: firstName,
          lastName: lastName,
          email: user?.email || '',
          phone: basicProfile.phone || '',
          currentLocation: jobSeekerProfile?.current_location || ''
        },
        jobSpecific: {
          ...prev.jobSpecific,
          salaryExpectation: jobSeekerProfile?.target_salary_range ? 
            `${jobSeekerProfile.target_salary_range.currency || '€'}${jobSeekerProfile.target_salary_range.min || ''} - ${jobSeekerProfile.target_salary_range.currency || '€'}${jobSeekerProfile.target_salary_range.max || ''}` : '',
          relocatable: jobSeekerProfile?.willing_to_relocate || false
        },
        customQuestions: prev.customQuestions || {}
      }));
    }
  }, [isOpen, basicProfile, jobSeekerProfile, user?.email]);

  // Get documents by type
  const getDocumentsByType = (type) => {
    return documents.filter(doc => doc.document_type === type);
  };

  // Handle document selection
  const handleDocumentSelect = (doc, type) => {
    if (type === 'resume') {
      setSelectedDocuments(prev => ({ ...prev, resume: doc }));
      setApplicationData(prev => ({ ...prev, resumeId: doc.id }));
    } else if (type === 'coverLetter') {
      setSelectedDocuments(prev => ({ ...prev, coverLetter: doc }));
      setApplicationData(prev => ({ ...prev, coverLetterId: doc.id }));
    } else if (type === 'additional') {
      setSelectedDocuments(prev => ({ 
        ...prev, 
        additional: [...prev.additional, doc] 
      }));
      setApplicationData(prev => ({ 
        ...prev, 
        additionalDocumentIds: [...prev.additionalDocumentIds, doc.id] 
      }));
    }
  };

  // Handle document removal
  const handleDocumentRemove = (type, documentId) => {
    if (type === 'resume') {
      setSelectedDocuments(prev => ({ ...prev, resume: null }));
      setApplicationData(prev => ({ ...prev, resumeId: null }));
    } else if (type === 'coverLetter') {
      setSelectedDocuments(prev => ({ ...prev, coverLetter: null }));
      setApplicationData(prev => ({ ...prev, coverLetterId: null }));
    } else if (type === 'additional') {
      setSelectedDocuments(prev => ({ 
        ...prev, 
        additional: prev.additional.filter(doc => doc.id !== documentId) 
      }));
      setApplicationData(prev => ({ 
        ...prev, 
        additionalDocumentIds: prev.additionalDocumentIds.filter(id => id !== documentId) 
      }));
    }
  };

  // Handle document download
  const handleDocumentDownload = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document. Please try again.');
    }
  };

  // Handle document deletion
  const handleDocumentDelete = async (documentId) => {
    try {
      const doc = documents.find(doc => doc.id === documentId);
      if (doc) {
        await deleteDocumentFromStore(documentId);
        // Also remove from selected documents if it was selected
        handleDocumentRemove('resume', documentId);
        handleDocumentRemove('coverLetter', documentId);
        handleDocumentRemove('additional', documentId);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  if (!isOpen || !job) return null;

  // Show different content if user has already applied
  if (existingApplication) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
          
          <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Already Applied</h2>
                <Button variant="ghost" onClick={onClose}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">Application Status</h3>
                    <p className="text-sm text-blue-800 mt-1">
                      You have already applied for this position on{' '}
                      {new Date(existingApplication.application_date).toLocaleDateString()}.
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      Current status: <span className="font-medium capitalize">{existingApplication.status}</span>
                    </p>
                  </div>
                </div>
              </div>

              {existingApplication.employer_notes && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Employer Notes</h3>
                  <p className="text-sm text-gray-600">{existingApplication.employer_notes}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="primary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Documents' },
    { id: 2, title: 'Personal Info' },
    { id: 3, title: 'Job Details' },
    { id: 4, title: 'Review' }
  ];

  const visaStatusOptions = [
    { value: 'citizen', label: 'EU Citizen' },
    { value: 'permit', label: 'Work Permit Holder' },
    { value: 'student', label: 'Student Visa' },
    { value: 'none', label: 'No Work Authorization' },
    { value: 'applying', label: 'Visa Application in Progress' }
  ];

  const customQuestions = [
    {
      id: 'experience_years',
      question: 'How many years of experience do you have with React?',
      type: 'select',
      options: ['Less than 1 year', '1-2 years', '3-5 years', '5+ years'],
      required: true
    },
    {
      id: 'remote_experience',
      question: 'Do you have experience working remotely?',
      type: 'radio',
      options: ['Yes, extensively', 'Some experience', 'No, but willing to learn'],
      required: true
    },
    {
      id: 'start_date',
      question: 'What is your preferred start date?',
      type: 'text',
      placeholder: 'e.g., Immediately, 2 weeks notice, etc.',
      required: false
    }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = async (file, documentType) => {
    if (!file || !user?.id) return;

    try {
      const result = await uploadDocument(file, user.id, documentType, {
        jobId: job.id,
        jobTitle: job.title,
      });

      if (result) {
        // Auto-select the newly uploaded document
        handleDocumentSelect(result, documentType === 'resume' ? 'resume' : 
                           documentType === 'cover_letter' ? 'coverLetter' : 'additional');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    if (isSubmitting || submittingRef.current) {
      console.log('Application already being submitted');
      return;
    }

    try {
      setIsSubmitting(true);
      submittingRef.current = true;
      
      const application = await submitApplication({
        jobId: job.id,
        applicantId: user.id,
        coverNote: applicationData.message,
        documents: {
          resumeId: applicationData.resumeId,
          coverLetterId: applicationData.coverLetterId,
          additionalDocumentIds: applicationData.additionalDocumentIds
        },
        personalInfo: applicationData.personalInfo,
        jobSpecific: applicationData.jobSpecific,
        customQuestions: applicationData.customQuestions || {}
      }, (application) => {
        // Callback to update store state
        onSubmit(application);
      });

      // Close modal on successful submission
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      
      // If it's a duplicate application error, update the state to show existing application
      if (error.message.includes('already applied') || error.message.includes('already exists')) {
        // Fetch the existing application to show it
        try {
          const { data: existingApp } = await supabase
            .from('job_applications_v2')
            .select('*')
            .eq('job_id', job.id)
            .eq('applicant_id', user.id)
            .maybeSingle();
          
          if (existingApp) {
            setExistingApplication(existingApp);
          }
        } catch (fetchError) {
          console.error('Error fetching existing application:', fetchError);
        }
      }
      // Don't close modal on error - let user see the error or existing application
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const updatePersonalInfo = (field, value) => {
    setApplicationData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updateJobSpecific = (field, value) => {
    setApplicationData(prev => ({
      ...prev,
      jobSpecific: { ...prev.jobSpecific, [field]: value }
    }));
  };

  const updateCustomQuestion = (questionId, value) => {
    setApplicationData(prev => ({
      ...prev,
      customQuestions: { ...(prev.customQuestions || {}), [questionId]: value }
    }));
  };

  // Document Card Component
  const DocumentCard = ({ document, isSelected, onSelect, onRemove, onDownload, onDelete, type }) => (
    <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <FileText className="w-5 h-5 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{document.file_name}</p>
            <p className="text-xs text-gray-500">
              {new Date(document.created_at).toLocaleDateString()} • 
              {(document.file_size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(document);
            }}
          >
            <Download className="w-4 h-4" />
          </Button>
          
          {!isSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(document, type);
              }}
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          
          {isSelected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(type, document.id);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Select Your Documents</h3>
        <p className="text-gray-600">Choose from your existing documents or upload new ones</p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{uploadError}</p>
        </div>
      )}

      {/* Resume Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Resume/CV *</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('resume-upload').click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </div>
        
        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files[0]) {
              handleFileUpload(e.target.files[0], 'resume');
            }
          }}
        />

        {selectedDocuments.resume && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Selected Resume</p>
                  <p className="text-sm text-green-800">{selectedDocuments.resume.file_name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDocumentRemove('resume', selectedDocuments.resume.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {documentsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {getDocumentsByType('resume').map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                isSelected={selectedDocuments.resume?.id === doc.id}
                onSelect={handleDocumentSelect}
                onRemove={handleDocumentRemove}
                onDownload={handleDocumentDownload}
                onDelete={handleDocumentDelete}
                type="resume"
              />
            ))}
            {getDocumentsByType('resume').length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No resumes uploaded yet. Upload your first resume above.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cover Letter Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Cover Letter (Optional)</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('cover-letter-upload').click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </div>
        
        <input
          id="cover-letter-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files[0]) {
              handleFileUpload(e.target.files[0], 'cover_letter');
            }
          }}
        />

        {selectedDocuments.coverLetter && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Selected Cover Letter</p>
                  <p className="text-sm text-green-800">{selectedDocuments.coverLetter.file_name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDocumentRemove('coverLetter', selectedDocuments.coverLetter.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {getDocumentsByType('cover_letter').map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isSelected={selectedDocuments.coverLetter?.id === doc.id}
              onSelect={handleDocumentSelect}
              onRemove={handleDocumentRemove}
              onDownload={handleDocumentDownload}
              onDelete={handleDocumentDelete}
              type="coverLetter"
            />
          ))}
          {getDocumentsByType('cover_letter').length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No cover letters uploaded yet. Upload your first cover letter above.
            </p>
          )}
        </div>
      </div>

      {/* Additional Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Additional Documents (Optional)</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('additional-upload').click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </div>
        
        <input
          id="additional-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files).forEach(file => {
              handleFileUpload(file, 'additional');
            });
          }}
        />

        {selectedDocuments.additional.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="space-y-2">
              <p className="font-medium text-green-900">Selected Additional Documents ({selectedDocuments.additional.length})</p>
              {selectedDocuments.additional.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between">
                  <p className="text-sm text-green-800">{doc.file_name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDocumentRemove('additional', doc.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {getDocumentsByType('additional').map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isSelected={selectedDocuments.additional.some(selected => selected.id === doc.id)}
              onSelect={handleDocumentSelect}
              onRemove={handleDocumentRemove}
              onDownload={handleDocumentDownload}
              onDelete={handleDocumentDelete}
              type="additional"
            />
          ))}
          {getDocumentsByType('additional').length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No additional documents uploaded yet. Upload your first document above.
            </p>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Uploading document...</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm text-blue-700">{uploadProgress}%</span>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for a Strong Application</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure your resume is up-to-date and tailored to the position</li>
          <li>• Include relevant experience and skills that match the job requirements</li>
          <li>• Write a compelling cover letter that explains your interest in the role</li>
          <li>• Add any relevant certificates or portfolio pieces as additional documents</li>
        </ul>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
        <p className="text-gray-600">Your details have been prefilled from your profile</p>
      </div>

      {/* Prefilled Info Notice */}
      {basicProfile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Your personal information has been automatically filled from your profile. You can edit any field if needed.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          value={applicationData.personalInfo.firstName}
          onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
          placeholder="Enter your first name"
          required
        />
        
        <Input
          label="Last Name"
          value={applicationData.personalInfo.lastName}
          onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
          placeholder="Enter your last name"
          required
        />
        
        <Input
          label="Email Address"
          type="email"
          value={applicationData.personalInfo.email}
          onChange={(e) => updatePersonalInfo('email', e.target.value)}
          placeholder="your.email@example.com"
          required
        />
        
        <Input
          label="Phone Number"
          value={applicationData.personalInfo.phone}
          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
          placeholder="+91 98765 43210"
          required
        />
        
        <Input
          label="Current Location"
          value={applicationData.personalInfo.currentLocation}
          onChange={(e) => updatePersonalInfo('currentLocation', e.target.value)}
          placeholder="City, Country"
          containerClassName="md:col-span-2"
          required
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Job-Specific Information</h3>
        <p className="text-gray-600">Tell us more about your situation</p>
      </div>

      {/* Prefilled Info Notice */}
      {jobSeekerProfile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">
              Some information has been prefilled from your profile preferences. You can modify any field as needed.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="Availability Date"
          type="date"
          value={applicationData.jobSpecific.availabilityDate}
          onChange={(e) => updateJobSpecific('availabilityDate', e.target.value)}
          required
        />
        
        <Input
          label="Salary Expectation"
          value={applicationData.jobSpecific.salaryExpectation}
          onChange={(e) => updateJobSpecific('salaryExpectation', e.target.value)}
          placeholder="e.g., €60,000 - €80,000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visa Status
        </label>
        <select
          value={applicationData.jobSpecific.visaStatus}
          onChange={(e) => updateJobSpecific('visaStatus', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select your visa status</option>
          {visaStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={applicationData.jobSpecific.relocatable}
          onChange={(e) => updateJobSpecific('relocatable', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          I am willing to relocate for this position
        </span>
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Why are you interested in this role? (Optional)
        </label>
        <textarea
          value={applicationData.jobSpecific.motivation}
          onChange={(e) => updateJobSpecific('motivation', e.target.value)}
          placeholder="Tell us what excites you about this opportunity..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Custom Questions */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Additional Questions</h4>
        {customQuestions.map((question) => (
          <div key={question.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {question.type === 'select' && (
              <select
                value={(applicationData.customQuestions || {})[question.id] || ''}
                onChange={(e) => updateCustomQuestion(question.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={question.required}
              >
                <option value="">Select an option</option>
                {question.options.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            )}
            
            {question.type === 'radio' && (
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <label key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={(applicationData.customQuestions || {})[question.id] === option}
                      onChange={(e) => updateCustomQuestion(question.id, e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                      required={question.required}
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}
            
            {question.type === 'text' && (
              <input
                type="text"
                value={(applicationData.customQuestions || {})[question.id] || ''}
                onChange={(e) => updateCustomQuestion(question.id, e.target.value)}
                placeholder={question.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={question.required}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Review Your Application</h3>
        <p className="text-gray-600">Please review all information before submitting</p>
      </div>

      {/* Job Summary */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-3">Applying For</h4>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h5 className="font-medium text-gray-900">{job.title}</h5>
            <p className="text-gray-600">{job.companies?.name || job.company || 'Company not specified'} • {job.location}</p>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-3">Documents</h4>
        <div className="space-y-2">
          {selectedDocuments.resume && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Resume: {selectedDocuments.resume.file_name}</span>
            </div>
          )}
          {selectedDocuments.coverLetter && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Cover Letter: {selectedDocuments.coverLetter.file_name}</span>
            </div>
          )}
          {selectedDocuments.additional.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{selectedDocuments.additional.length} additional document(s):</span>
              </div>
              {selectedDocuments.additional.map((doc) => (
                <div key={doc.id} className="ml-6 text-sm text-gray-600">
                  • {doc.file_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Personal Info */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span>
            <p>{applicationData.personalInfo.firstName} {applicationData.personalInfo.lastName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <p>{applicationData.personalInfo.email}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Phone:</span>
            <p>{applicationData.personalInfo.phone}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Location:</span>
            <p>{applicationData.personalInfo.currentLocation}</p>
          </div>
        </div>
      </Card>

      {/* Job Specific */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-3">Job Details</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Availability:</span>
            <p>{applicationData.jobSpecific.availabilityDate || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Salary Expectation:</span>
            <p>{applicationData.jobSpecific.salaryExpectation || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Visa Status:</span>
            <p>{visaStatusOptions.find(o => o.value === applicationData.jobSpecific.visaStatus)?.label || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Willing to Relocate:</span>
            <p>{applicationData.jobSpecific.relocatable ? 'Yes' : 'No'}</p>
          </div>
        </div>
        {applicationData.jobSpecific.motivation && (
          <div className="mt-4">
            <span className="font-medium text-gray-700">Motivation:</span>
            <p className="text-sm text-gray-600 mt-1">{applicationData.jobSpecific.motivation}</p>
          </div>
        )}
      </Card>

      {/* Custom Questions */}
      {Object.keys(applicationData.customQuestions || {}).length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-3">Additional Questions</h4>
          <div className="space-y-3">
            {customQuestions.map((question) => {
              const answer = (applicationData.customQuestions || {})[question.id];
              if (!answer) return null;
              
              return (
                <div key={question.id}>
                  <span className="font-medium text-gray-700 text-sm">{question.question}</span>
                  <p className="text-sm text-gray-600 mt-1">{answer}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-yellow-900">Before You Submit</h5>
            <ul className="text-sm text-yellow-800 mt-1 space-y-1">
              <li>• Double-check all information for accuracy</li>
              <li>• Ensure your documents are up to date</li>
              <li>• You'll receive a confirmation email after submission</li>
              <li>• The employer will review your application within 5 business days</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return selectedDocuments.resume !== null;
      case 2: return applicationData.personalInfo.firstName && 
                     applicationData.personalInfo.lastName && 
                     applicationData.personalInfo.email && 
                     applicationData.personalInfo.phone;
      case 3: return applicationData.jobSpecific.availabilityDate && 
                     applicationData.jobSpecific.visaStatus;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Apply for {job.title}</h2>
              <p className="text-gray-600">{job.companies?.name || job.company || 'Company not specified'}</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Stepper */}
          <div className="px-6 py-4 border-b border-gray-200">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>

          {/* Content */}
          <div className="p-6 min-h-[500px]">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            <div className="flex space-x-3">
              {currentStep === 4 ? (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                  loading={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Next
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {(uploadError || applicationError) && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                {uploadError || applicationError}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
