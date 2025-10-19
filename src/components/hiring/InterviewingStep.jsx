import React from 'react';
import useCandidatesStore from '../../store/candidatesStore';
import { useTranslation } from 'react-i18next';
import {
  User,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare
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

const InterviewingStep = ({
  candidates,
  loading = false,
  onViewInvited,
  onRescheduleInterview,
  onCancelInterview,
  onViewProfile,
  onAddFeedback,
  onHireCandidate,
  onRejectCandidate,
  onMarkCompleted
}) => {
  const { t } = useTranslation('employer');
  const { candidateMatchScores } = useCandidatesStore();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('hiringProcess.interviewingStep.title')}</h2>
        <p className="text-gray-600">{t('hiringProcess.interviewingStep.subtitle')}</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('hiringProcess.interviewingStep.loading')}</p>
        </div>
      ) : candidates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {candidates.map((interview) => (
            <div key={interview.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{interview.name}</h3>
                    <p className="text-gray-600">{interview.title}</p>
                    {candidateMatchScores && candidateMatchScores[interview.candidateId] && (
                      <p className="text-sm text-gray-500">Match Score: {candidateMatchScores[interview.candidateId]}%</p>
                    )}
                    {interview.agenda && (
                      <p className="text-sm text-gray-500 mt-1">{interview.agenda}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{interview.interviewType} Interview</p>
                    <p className="text-sm text-gray-500">with {interview.interviewer}</p>
                    <p className="text-sm text-gray-500">{new Date(interview.interviewDate).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{interview.duration}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    interview.status === 'hired' 
                      ? 'bg-green-500 text-white'
                      : interview.status === 'rejected'
                      ? 'bg-red-500 text-white'
                      : interview.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : interview.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : interview.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : interview.status === 'rescheduled'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {interview.status}
                  </span>
                </div>
              </div>
              
              {interview.meetingLink && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{t('hiringProcess.interviewingStep.meetingLink')}:</strong>
                    <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                      {t('hiringProcess.interviewingStep.joinInterview')}
                    </a>
                  </p>
                </div>
              )}
              
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewProfile && onViewProfile(interview)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {t('hiringProcess.interviewingStep.viewProfile')}
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={() => onAddFeedback && onAddFeedback(interview)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {interview.feedback ? t('hiringProcess.interviewingStep.viewFeedback') : t('hiringProcess.interviewingStep.addFeedback')}
                  </button>
                </div>
                
                {interview.status === 'completed' ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onHireCandidate && onHireCandidate(interview)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('hiringProcess.interviewingStep.hire')}
                    </button>
                    <button
                      onClick={() => onRejectCandidate && onRejectCandidate(interview)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('hiringProcess.interviewingStep.reject')}
                    </button>
                  </div>
                ) : interview.status === 'scheduled' ? (
                  <div className="flex items-center space-x-2">
                    {/* Always show Mark as Completed for demo purposes */}
                    <button 
                      onClick={() => onMarkCompleted && onMarkCompleted(interview)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('hiringProcess.interviewingStep.markCompleted')}
                    </button>
                    <button
                      onClick={() => onRescheduleInterview && onRescheduleInterview(interview)}
                      className="flex items-center px-4 py-2 text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors text-sm"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('hiringProcess.interviewingStep.reschedule')}
                    </button>
                    <button
                      onClick={() => onCancelInterview && onCancelInterview(interview)}
                      className="flex items-center px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('hiringProcess.interviewingStep.cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {interview.status === 'cancelled' ? t('hiringProcess.interviewingStep.interviewCancelled') :
                       interview.status === 'rescheduled' ? t('hiringProcess.interviewingStep.interviewRescheduled') :
                       t('hiringProcess.interviewingStep.interviewCompleted')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title={t('hiringProcess.interviewingStep.noInterviews')}
          description={t('hiringProcess.interviewingStep.noInterviewsDesc')}
          action={
            <button
              onClick={onViewInvited}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              {t('hiringProcess.interviewingStep.viewInvited')}
            </button>
          }
        />
      )}
    </div>
  );
};

export default InterviewingStep;
