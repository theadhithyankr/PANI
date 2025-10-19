import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  FileCheck
} from 'lucide-react';

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

const HiringStep = ({ candidates, loading = false, onViewInterviews, onStartOnboarding, isMigrationRunning }) => {
  const { t } = useTranslation('employer');
  const [activeTab, setActiveTab] = useState('all');

  const filteredCandidates = candidates.filter(candidate => {
    switch (activeTab) {
      case 'recent':
        // Show candidates hired in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(candidate.hiredDate) > weekAgo;
      case 'all':
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('hiringProcess.hiringStep.title')}</h2>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('hiringProcess.hiringStep.allHired')}
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'recent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('hiringProcess.hiringStep.recent7Days')}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('hiringProcess.hiringStep.loading')}</p>
        </div>
      ) : filteredCandidates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                    <p className="text-gray-600 mb-2">{candidate.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{t('hiringProcess.hiringStep.interviewType', { type: candidate.interviewType })}</span>
                      <span>•</span>
                      <span>{t('hiringProcess.hiringStep.interviewedDate', { date: new Date(candidate.interviewDate).toLocaleDateString() })}</span>
                      <span>•</span>
                      <span>{t('hiringProcess.hiringStep.hiredDate', { date: new Date(candidate.hiredDate).toLocaleDateString() })}</span>
                    </div>
                    {candidate.feedback && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <strong>{t('hiringProcess.hiringStep.feedback')}:</strong> {candidate.feedback.substring(0, 100)}
                        {candidate.feedback.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                    {t('hiringProcess.hiringStep.hired')}
                  </span>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">{t('hiringProcess.hiringStep.rating')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {candidate.rating ? `${candidate.rating}/5 ⭐` : t('hiringProcess.hiringStep.noRating')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('hiringProcess.hiringStep.subtitle')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onStartOnboarding && onStartOnboarding(candidate)}
                      disabled={isMigrationRunning}
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        isMigrationRunning
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-violet-600 text-white hover:bg-violet-700'
                      }`}
                    >
                      <ChevronRight className="h-4 w-4 mr-2" />
                      {isMigrationRunning ? 'Migration Running...' : t('hiringProcess.hiringStep.startOnboarding')}
                    </button>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      {t('hiringProcess.hiringStep.viewProfile')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck}
          title={activeTab === 'all' ? t('hiringProcess.hiringStep.noCandidates') : t('hiringProcess.hiringStep.noRecentHires')}
          description={
            activeTab === 'all'
              ? t('hiringProcess.hiringStep.noCandidatesDesc')
              : t('hiringProcess.hiringStep.noRecentHiresDesc')
          }
          action={
            activeTab === 'all' ? (
              <button
                onClick={onViewInterviews}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
              >
                {t('hiringProcess.hiringStep.viewInterviews')}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('all')}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
              >
                {t('hiringProcess.hiringStep.viewAllHired')}
              </button>
            )
          }
        />
      )}
    </div>
  );
};

export default HiringStep;

