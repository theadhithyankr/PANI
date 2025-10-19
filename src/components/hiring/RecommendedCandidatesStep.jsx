import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Heart,
  UserPlus,
  Star,
  MapPin,
  Clock,
  Search,
  Filter
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

const RecommendedCandidatesStep = ({
  candidates,
  favoritesCandidates,
  onToggleFavorite,
  onInviteCandidate,
  onViewProfile
}) => {
  const { t } = useTranslation('employer');

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('hiringProcess.recommendedCandidates.title')}</h2>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              {t('hiringProcess.recommendedCandidates.filter')}
            </button>
            <button className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Search className="h-4 w-4 mr-2" />
              {t('hiringProcess.recommendedCandidates.search')}
            </button>
          </div>
        </div>
        <p className="text-gray-600">{t('hiringProcess.recommendedCandidates.subtitle', { count: candidates.length })}</p>
      </div>

      {/* Candidates Grid */}
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
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                      <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        <Star className="h-3 w-3 mr-1" />
                        {t('hiringProcess.recommendedCandidates.matchPercentage', { score: candidate.matchScore })}
                      </div>
                    </div>
                    <p className="text-gray-600">{candidate.title} {t('hiringProcess.recommendedCandidates.currentCompany', { company: candidate.currentCompany })}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4 mt-1">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {candidate.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {t('hiringProcess.recommendedCandidates.experienceYears', { years: candidate.experience.replace(' years', '') })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <button
                    onClick={() => onToggleFavorite(candidate.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      favoritesCandidates.includes(candidate.id)
                        ? 'text-red-600 bg-red-50 hover:bg-red-100'
                        : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${favoritesCandidates.includes(candidate.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {candidate.skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                    {skill}
                  </span>
                ))}
              </div>

              {candidate.summary && (
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
                    {t('hiringProcess.interviewingStep.viewProfile')}
                  </button>
                </div>
                <button
                  onClick={() => onInviteCandidate(candidate.id)}
                  className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('hiringProcess.recommendedCandidates.invite')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title={t('hiringProcess.recommendedCandidates.noCandidates')}
          description={t('hiringProcess.recommendedCandidates.noCandidatesDesc')}
          action={
            <button className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
              {t('hiringProcess.recommendedCandidates.adjustCriteria')}
            </button>
          }
        />
      )}
    </div>
  );
};

export default RecommendedCandidatesStep;