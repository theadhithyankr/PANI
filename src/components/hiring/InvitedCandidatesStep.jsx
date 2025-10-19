import React from 'react';
import useCandidatesStore from '../../store/candidatesStore';
import { useTranslation } from 'react-i18next';
import {
  User,
  UserPlus,
  MessageSquare,
  Calendar,
  Eye,
  MapPin,
  Clock
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

const InvitedCandidatesStep = ({
  candidates,
  loading,
  onViewRecommendations,
  onViewProfile,
  onScheduleInterview,
  onMessage
}) => {
  const { t } = useTranslation('employer');
  const { candidateMatchScores } = useCandidatesStore();
  console.log('candidateMatchScores', candidateMatchScores);
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('hiringProcess.invitedCandidates.title')}</h2>
          <p className="text-gray-600">{t('hiringProcess.invitedCandidates.subtitle')}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-gray-500">{t('hiringProcess.invitedCandidates.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('hiringProcess.invitedCandidates.title')}</h2>
        <p className="text-gray-600">{t('hiringProcess.invitedCandidates.subtitle')}</p>
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{candidate.name || 'Unknown Candidate'}</h3>
                    <p className="text-gray-600">{candidate.title || 'Software Developer'}</p>
                    {candidateMatchScores && candidateMatchScores[candidate.id] && (
                      <p className="text-sm text-gray-500">Match Score: {candidateMatchScores[candidate.id]}%</p>
                    )}
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {candidate.location || t('hiringProcess.invitedCandidates.locationNotSpecified')}
                      </span>
                      <span className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {candidate.experience || t('hiringProcess.invitedCandidates.experienceNotSpecified')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {t('hiringProcess.invitedCandidates.invitedDate', {
                        date: candidate.invitedDate ? new Date(candidate.invitedDate).toLocaleDateString() : t('hiringProcess.invitedCandidates.recently')
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {candidate.skills && candidate.skills.length > 0
                        ? candidate.skills.slice(0, 3).join(', ')
                        : t('hiringProcess.invitedCandidates.noSkillsListed')
                      }
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    candidate.status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : candidate.status === 'declined'
                      ? 'bg-red-100 text-red-800'
                      : candidate.status === 'invited'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {candidate.status === 'invited' ? t('hiringProcess.invitedCandidates.pendingResponse') :
                     candidate.status === 'accepted' ? t('hiringProcess.invitedCandidates.accepted') :
                     candidate.status === 'declined' ? t('hiringProcess.invitedCandidates.declined') :
                     candidate.status || t('hiringProcess.invitedCandidates.unknownStatus')}
                  </span>
                </div>
              </div>
              
              {candidate.summary && candidate.summary !== t('hiringProcess.invitedCandidates.noSummary') && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 line-clamp-2">{candidate.summary}</p>
                </div>
              )}
              
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewProfile && onViewProfile(candidate)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {t('hiringProcess.invitedCandidates.viewProfile')}
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={() => onMessage && onMessage(candidate)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {t('hiringProcess.invitedCandidates.message')}
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {candidate.status === 'accepted' ? (
                    <button
                      onClick={() => onScheduleInterview && onScheduleInterview(candidate)}
                      className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('hiringProcess.invitedCandidates.scheduleInterview')}
                    </button>
                  ) : candidate.status === 'invited' ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{t('hiringProcess.invitedCandidates.pendingResponse')}</span>
                      <button
                        onClick={() => onMessage && onMessage(candidate)}
                        className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t('hiringProcess.invitedCandidates.followUp')}
                      </button>
                    </div>
                  ) : candidate.status === 'declined' ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-red-600 font-medium">{t('hiringProcess.invitedCandidates.candidateDeclined')}</span>
                      <button
                        onClick={() => onMessage && onMessage(candidate)}
                        className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t('hiringProcess.invitedCandidates.message')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{t('hiringProcess.invitedCandidates.unknownStatus')}</span>
                      <button
                        onClick={() => onMessage && onMessage(candidate)}
                        className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t('hiringProcess.invitedCandidates.message')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserPlus}
          title={t('hiringProcess.invitedCandidates.noInvitations')}
          description={t('hiringProcess.invitedCandidates.noInvitationsDesc')}
          action={
            <button
              onClick={onViewRecommendations}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              {t('hiringProcess.invitedCandidates.viewRecommendations')}
            </button>
          }
        />
      )}
    </div>
  );
};

export default InvitedCandidatesStep;
