import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Download,
  Plane,
  CheckSquare,
  Clock,
  FileCheck,
  FileText,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import useCandidateDocuments from '../../hooks/employer/useCandidateDocuments';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-16">
    <div className="mx-auto h-16 w-16 text-gray-300 mb-6">
      <Icon className="h-16 w-16" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
    {action && action}
  </div>
);

const CandidateCard = ({ candidate, onStartOnboarding, isMigrationRunning, t }) => {
  const { documents, loading: documentsLoading, error: documentsError } = useCandidateDocuments(candidate.candidateId);

  const handleDownloadDocument = async (documentType) => {
    try {
      // Find the document by type
      const document = documents.find(doc => doc.document_type === documentType);
      
      if (!document) {
        console.error(`Document of type ${documentType} not found`);
        alert(`${documentType.replace('_', ' ')} document not found. Please ensure the document has been uploaded.`);
        return;
      }

      // Use the file_url if available, otherwise create signed URL
      let downloadUrl = document.file_url;
      
      if (!downloadUrl) {
        console.error('No download URL available for document');
        alert('Unable to generate download link. Please try again later.');
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = document.file_name || `${documentType.replace('_', '-')}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Candidate Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
            <p className="text-gray-600">{candidate.title}</p>
            <p className="text-sm text-gray-500">{t('hiringProcess.onboardingStep.startDate', { date: new Date(candidate.startDate).toLocaleDateString() })}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            candidate.visaStatus === 'approved' 
              ? 'bg-green-100 text-green-800'
              : candidate.visaStatus === 'in_progress'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <Plane className="h-3 w-3 mr-1 inline" />
            {t('hiringProcess.onboardingStep.visaStatus', { status: candidate.visaStatus.replace('_', ' ') })}
          </span>
          <button 
            onClick={() => onStartOnboarding && onStartOnboarding(candidate)}
            disabled={isMigrationRunning}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isMigrationRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            {isMigrationRunning ? 'Migration Running...' : 'Start Onboarding'}
          </button>
          <button className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            <Download className="h-4 w-4 mr-2" />
            {t('hiringProcess.onboardingStep.documents')}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-medium text-gray-900 mb-4">{t('hiringProcess.onboardingStep.progress')}</h4>
        <div className="space-y-4">
          {candidate.timeline.map((step, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.completed 
                  ? 'bg-green-100 text-green-600'
                  : step.inProgress
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step.completed ? (
                  <CheckSquare className="h-4 w-4" />
                ) : step.inProgress ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <div className="h-2 w-2 bg-current rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${
                    step.completed ? 'text-gray-900' : step.inProgress ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.step}
                  </p>
                  {step.date && (
                    <span className="text-sm text-gray-500">
                      {new Date(step.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {step.inProgress && (
                  <p className="text-sm text-gray-600 mt-1">
                    {t('hiringProcess.onboardingStep.processing')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documents Section */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h4 className="font-medium text-gray-900 mb-4">{t('hiringProcess.onboardingStep.documents')}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg border-2 border-dashed ${
            candidate.documents.includes('signed_offer') 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="text-center">
              <FileCheck className={`h-6 w-6 mx-auto mb-2 ${
                candidate.documents.includes('signed_offer') ? 'text-green-600' : 'text-gray-400'
              }`} />
              <p className="text-sm font-medium text-gray-900">{t('hiringProcess.onboardingStep.signedOffer')}</p>
              {candidate.documents.includes('signed_offer') && (
                <button 
                  onClick={() => handleDownloadDocument('signed_offer')}
                  disabled={documentsLoading || documentsError}
                  className="text-xs text-green-600 hover:text-green-800 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {documentsLoading ? 'Loading...' : documentsError ? 'Error' : t('hiringProcess.onboardingStep.download')}
                </button>
              )}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border-2 border-dashed ${
            candidate.documents.includes('i9_form') 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="text-center">
              <FileText className={`h-6 w-6 mx-auto mb-2 ${
                candidate.documents.includes('i9_form') ? 'text-green-600' : 'text-gray-400'
              }`} />
              <p className="text-sm font-medium text-gray-900">{t('hiringProcess.onboardingStep.i9Form')}</p>
              {candidate.documents.includes('i9_form') && (
                <button 
                  onClick={() => handleDownloadDocument('i9_form')}
                  disabled={documentsLoading || documentsError}
                  className="text-xs text-green-600 hover:text-green-800 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {documentsLoading ? 'Loading...' : documentsError ? 'Error' : t('hiringProcess.onboardingStep.download')}
                </button>
              )}
            </div>
          </div>
          
          <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{t('hiringProcess.onboardingStep.backgroundCheck')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('hiringProcess.onboardingStep.pending')}</p>
            </div>
          </div>
          
          <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <Plane className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{t('hiringProcess.onboardingStep.visaDocs')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('hiringProcess.onboardingStep.inProgress')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OnboardingStep = ({ candidates, onViewHiring, onStartOnboarding, isMigrationRunning }) => {
  const { t } = useTranslation('employer');
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('hiringProcess.onboardingStep.title')}</h2>
        <p className="text-gray-600">{t('hiringProcess.onboardingStep.subtitle')}</p>
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onStartOnboarding={onStartOnboarding}
              isMigrationRunning={isMigrationRunning}
              t={t}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title={t('hiringProcess.onboardingStep.noCandidates')}
          description={t('hiringProcess.onboardingStep.noCandidatesDesc')}
          action={
            <button
              onClick={onViewHiring}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              {t('hiringProcess.onboardingStep.viewHiring')}
            </button>
          }
        />
      )}
    </div>
  );
};

export default OnboardingStep;
