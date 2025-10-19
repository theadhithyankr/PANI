import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Star,
  MapPin,
  Calendar,
  Heart,
  Download,
  ChevronDown,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Languages,
  Plane,
  FileText,
  Clock,
  Phone,
  Mail,
  Globe,
  Award,
  Users,
  Brain,
  Target,
  TrendingUp,
  Shield,
  Sparkles,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import useDynamicAIAssessment from '../../hooks/employer/useDynamicAIAssessment';
import useCandidatesStore from '../../store/candidatesStore';
import useCandidateDocuments from '../../hooks/employer/useCandidateDocuments';
import DocumentViewer from '../candidate/DocumentViewer';
import { getContactDisplayText } from '../../utils/contactMasking';

const CandidateDetailPanel = ({ candidate, isOpen, onClose, onShortlist, onReject, onScheduleInterview, isShortlisted = false }) => {
  const { t, i18n } = useTranslation('employer');
  const [expandedSections, setExpandedSections] = useState({
    aiInsights: true,
    overview: true,
    experience: true,
    education: false,
    visa: true,
    documents: true,
  });

  const [viewingDocument, setViewingDocument] = useState(null);

  const {
    isLoading: isAssessmentLoading,
    error: assessmentError,
    generateAssessment
  } = useDynamicAIAssessment();

  const { documents, loading: documentsLoading, error: documentsError } = useCandidateDocuments(candidate?.id);

  const updateCandidate = useCandidatesStore(state => state.updateCandidate);

  const [aiSubScores, setAiSubScores] = useState({
    culturalFit: 0,
    technicalAlignment: 0,
    relocationReadiness: 0,
  });

  useEffect(() => {
    const technicalAlignmentScore = Math.round(Math.random() * 40 + 50);
    const culturalFitScore = Math.round(Math.random() * 40 + 50);
    const relocationReadinessScore = Math.round(Math.random() * 15 + 80);

    setAiSubScores({
      culturalFit: culturalFitScore,
      technicalAlignment: technicalAlignmentScore,
      relocationReadiness: relocationReadinessScore,
    });
  }, [candidate]);

  const handleGenerateAssessment = () => {
    // Extract job information from candidate's best job match
    const jobInfo = candidate.bestJobMatch || null;
    
    generateAssessment(candidate, (newAssessment) => {
      updateCandidate(candidate.id, { ai_career_insights: newAssessment });
    }, i18n.language || 'en', jobInfo);
  };

  const hasExistingInsights = candidate && candidate.ai_career_insights && Object.keys(candidate.ai_career_insights).length > 0;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen || !candidate) return null;

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'interviewing': return 'warning';
      case 'hired': return 'info';
      default: return 'default';
    }
  };

  const formatSalary = (salaryRange) => {
    if (!salaryRange) return t('candidateDetailPanel.notSpecified');

    if (typeof salaryRange === 'object') {
      if (salaryRange.type === 'fixed' && salaryRange.fixed) {
        return `${salaryRange.currency || '€'}${salaryRange.fixed}`;
      }
      if (salaryRange.type === 'range' && salaryRange.min && salaryRange.max) {
        return `${salaryRange.currency || '€'}${salaryRange.min} - ${salaryRange.max}`;
      }
    }

    return t('candidateDetailPanel.notSpecified');
  };

  const formatExperience = (years) => {
    if (!years && years !== 0) return t('candidateDetailPanel.notSpecified');
    return t('candidateDetailPanel.experience_other', { count: years });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-400';

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];

    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getSafelyMergedAIInsights = () => {
    const defaultStructure = {
      culturalFit: { insights: [] },
      technicalAlignment: { insights: [] },
      relocationReadiness: { insights: [] },
      riskFactors: [],
    };

    const sourceData = candidate.ai_career_insights;

    if (!sourceData) {
      return defaultStructure;
    }

    return {
      culturalFit: { ...defaultStructure.culturalFit, ...sourceData.culturalFit },
      technicalAlignment: { ...defaultStructure.technicalAlignment, ...sourceData.technicalAlignment },
      relocationReadiness: { ...defaultStructure.relocationReadiness, ...sourceData.relocationReadiness },
      riskFactors: sourceData.riskFactors || defaultStructure.riskFactors,
    };
  };

  const aiInsights = getSafelyMergedAIInsights();

  // Get masked contact information
  const contactInfo = getContactDisplayText(candidate);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            {candidate.avatar ? (
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg border-3 border-white shadow-lg ${getAvatarColor(candidate.name)} ${
                candidate.avatar ? 'hidden' : 'flex'
              }`}
            >
              {getInitials(candidate.name)}
            </div>
            {/* Online status indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-3 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{candidate.name}</h2>
            <p className="text-gray-600 text-sm">{candidate.headline || t('candidateDetailPanel.noHeadline')}</p>
            <div className="flex items-center gap-2 mt-2">
              {candidate.bestJobMatch && (
                <Badge variant="info" size="sm" className="bg-blue-100 text-blue-700 border-blue-200">
                  {candidate.bestJobMatch.title}
                </Badge>
              )}
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getMatchColor(candidate.matchScore)}`}>
                <Star className="w-3 h-3 inline mr-1" />
                {t('candidateDetailPanel.matchPercentage', { score: candidate.matchScore })}
              </div>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/50">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {false && (<Button
            variant="primary"
            size="sm"
            onClick={() => onScheduleInterview(candidate)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {t('candidateDetailPanel.interview')}
          </Button>)}
          {false && (<Button
            variant={isShortlisted ? "primary" : "outline"}
            size="sm"
            onClick={() => onShortlist(candidate)}
            className={isShortlisted
              ? 'bg-pink-600 hover:bg-pink-700 border-pink-600 text-white'
              : 'border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400'
            }
          >
            <Heart className={`w-4 h-4 mr-2 ${isShortlisted ? 'fill-current' : ''}`} />
            {isShortlisted ? t('candidateDetailPanel.shortlisted') : t('candidateDetailPanel.shortlist')}
          </Button>)}
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-600" />
            {t('candidateDetailPanel.contactInfo')}
            {contactInfo.message && (
              <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-700 border-amber-200">
                <EyeOff className="w-3 h-3 mr-1" />
                Contact Hidden
              </Badge>
            )}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{contactInfo.phone || t('candidateDetailPanel.noPhone')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{contactInfo.location || t('candidateDetailPanel.noLocation')}</span>
              {candidate.willing_to_relocate && (
                <Badge variant="info" size="sm" className="bg-green-100 text-green-700 border-green-200">
                  {t('candidateDetailPanel.relocatable')}
                </Badge>
              )}
            </div>
            {contactInfo.message && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 text-sm">
                  <EyeOff className="w-4 h-4" />
                  <span className="font-medium">Contact Information Hidden</span>
                </div>
                <p className="text-amber-600 text-xs mt-1">
                  {contactInfo.message}
                </p>
              </div>
          )}
        </div>
      </div>

        {/* Overview Section */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">{t('candidateDetailPanel.overview')}</h3>
            </div>
            {expandedSections.overview ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.overview && (
            <div className="p-4 border-t border-gray-200 space-y-4 bg-white">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('candidateDetailPanel.summary')}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {candidate.summary || candidate.ai_generated_summary || t('candidateDetailPanel.noSummary')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">{t('candidateDetailPanel.experience')}</h4>
                  <p className="text-sm text-gray-600">{formatExperience(candidate.experience_years)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">{t('candidateDetailPanel.targetSalary')}</h4>
                  <p className="text-sm text-gray-600">{formatSalary(candidate.target_salary_range)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">{t('candidateDetailPanel.jobTypes')}</h4>
                  <p className="text-sm text-gray-600">
                    {candidate.preferred_job_types?.join(', ') || t('candidateDetailPanel.notSpecified')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">{t('candidateDetailPanel.relocationTimeline')}</h4>
                  <p className="text-sm text-gray-600">{candidate.relocation_timeline || t('candidateDetailPanel.notSpecified')}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">{t('candidateDetailPanel.skills')}</h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills?.map((skill, index) => (
                    <Badge key={index} variant="default" size="sm" className="bg-blue-100 text-blue-700 border-blue-200">
                      {skill}
                    </Badge>
                  )) || <span className="text-sm text-gray-500">{t('candidateDetailPanel.noSkills')}</span>}
                </div>
              </div>

              {candidate.languages && candidate.languages.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    {t('candidateDetailPanel.languages')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.languages.map((lang, index) => (
                      <Badge key={index} variant="outline" size="sm" className="border-gray-300">
                        {lang.language} ({lang.proficiency})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Insights Section */}
        <div className="border border-blue-200 rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
          <button
            onClick={() => toggleSection('aiInsights')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <div className="flex flex-col">
                <h3 className="font-semibold text-gray-900">{t('candidateDetailPanel.aiInsights.title')}</h3>
                {candidate.bestJobMatch && (
                  <p className="text-xs text-gray-600">for {candidate.bestJobMatch.title}</p>
                )}
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {t('candidateDetailPanel.matchPercentage', { score: candidate.matchScore })}
              </div>
            </div>
            {expandedSections.aiInsights ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.aiInsights && (
             <div className="p-4 border-t border-blue-200 space-y-6 bg-white">
             {isAssessmentLoading ? (
               <div className="flex flex-col items-center justify-center py-10">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                 <p className="mt-4 text-sm font-medium text-gray-600">
                   {candidate.bestJobMatch 
                     ? `${t('candidateDetailPanel.aiInsights.loading')} for ${candidate.bestJobMatch.title}...`
                     : t('candidateDetailPanel.aiInsights.loading')
                   }
                 </p>
                 <p className="text-xs text-gray-500">{t('candidateDetailPanel.aiInsights.loadingSubtext')}</p>
               </div>
             ) : assessmentError ? (
               <div className="text-center py-10 px-4">
                 <p className="text-sm font-medium text-red-600">{t('candidateDetailPanel.aiInsights.errorTitle')}</p>
                 <p className="text-xs text-gray-500 mt-1">{assessmentError}</p>
                 <Button size="sm" variant="outline" className="mt-4" onClick={handleGenerateAssessment}>
                   {t('candidateDetailPanel.aiInsights.retry')}
                 </Button>
               </div>
             ) : hasExistingInsights ? (
              <>
                {/* Key Insights Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-700 mb-1">{t('candidateDetailPanel.aiInsights.culturalFit')}</p>
                    <p className="text-2xl font-bold text-blue-600">{aiSubScores.culturalFit}%</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-700 mb-1">{t('candidateDetailPanel.aiInsights.techAlignment')}</p>
                    <p className="text-2xl font-bold text-green-600">{aiSubScores.technicalAlignment}%</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <Plane className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-700 mb-1">{t('candidateDetailPanel.aiInsights.relocation')}</p>
                    <p className="text-2xl font-bold text-purple-600">{aiSubScores.relocationReadiness}%</p>
                  </div>
                </div>

                {/* Detailed Insights */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      {t('candidateDetailPanel.aiInsights.culturalCompatibility')}
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.culturalFit.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      {t('candidateDetailPanel.aiInsights.technicalAssessment')}
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.technicalAlignment.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2">
                      <Plane className="w-4 h-4 text-purple-600" />
                      {t('candidateDetailPanel.aiInsights.relocationReadiness')}
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.relocationReadiness.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risk Assessment */}
                  {aiInsights.riskFactors && aiInsights.riskFactors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-600" />
                        {t('candidateDetailPanel.aiInsights.riskAssessment')}
                      </h4>
                      <div className="space-y-2">
                        {aiInsights.riskFactors.map((risk, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className={`w-3 h-3 rounded-full ${
                              risk.type === 'low' ? 'bg-green-500' :
                              risk.type === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-gray-600">{risk.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-4 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 hover:bg-blue-50"
                      onClick={handleGenerateAssessment}
                    >
                      {candidate.bestJobMatch 
                        ? `${t('candidateDetailPanel.aiInsights.regenerate')} for ${candidate.bestJobMatch.title}`
                        : t('candidateDetailPanel.aiInsights.regenerate')
                      }
                    </Button>
                  </div>
                </div>
              </>
            ) : (
                <div className="text-center py-10 px-4">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <Brain className="w-full h-full" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('candidateDetailPanel.aiInsights.getStartedTitle')}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {candidate.bestJobMatch 
                      ? `${t('candidateDetailPanel.aiInsights.getStartedBody')} for the ${candidate.bestJobMatch.title} position, considering specific job requirements.`
                      : t('candidateDetailPanel.aiInsights.getStartedBody')
                    }
                  </p>
                  <div className="mt-6">
                    <Button
                      size="sm"
                      onClick={handleGenerateAssessment}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {candidate.bestJobMatch 
                        ? `${t('candidateDetailPanel.aiInsights.generateButton')} for ${candidate.bestJobMatch.title} (with requirements)`
                        : t('candidateDetailPanel.aiInsights.generateButton')
                      }
                    </Button>
                  </div>
                </div>
            )}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('documents')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">{t('candidateDetailPanel.documents.title')}</h3>
            </div>
            {expandedSections.documents ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedSections.documents && (
            <div className="p-4 border-t border-gray-200 bg-white">
              {documentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">{t('candidateDetailPanel.documents.loading')}</span>
                </div>
              ) : documentsError ? (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span>{t('candidateDetailPanel.documents.error')}</span>
                </div>
              ) : documents.length > 0 ? (
                <ul className="space-y-3">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div >
                          <p className="font-medium text-gray-800 text-sm">{doc.document_name || doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {t(`candidateDetailPanel.documents.type.${doc.document_type}`, doc.document_type)} - {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingDocument(doc)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t('candidateDetailPanel.documents.view')}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">{t('candidateDetailPanel.documents.noDocuments')}</p>
              )}
            </div>
          )}
        </div>

        {/* Best Job Match */}
        {candidate.bestJobMatch && (
          <div className="border border-green-200 rounded-xl overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">{t('candidateDetailPanel.bestJobMatch.title')}</h3>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {t('candidateDetailPanel.matchPercentage', { score: candidate.bestJobMatch.matchScore })}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-gray-900">{candidate.bestJobMatch.title}</h4>
                  <p className="text-sm text-gray-600">{candidate.bestJobMatch.location}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{candidate.bestJobMatch.job_type}</span>
                  <span>•</span>
                  <span>{candidate.bestJobMatch.experience_level}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cultural Preferences */}
        {candidate.cultural_preferences && (
          <div className="border border-purple-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('cultural')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">{t('candidateDetailPanel.culturalPreferences.title')}</h3>
              </div>
              {expandedSections.cultural ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.cultural && (
              <div className="p-4 border-t border-purple-200 space-y-4 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm">{t('candidateDetailPanel.culturalPreferences.workEnvironment')}</h4>
                    <p className="text-sm text-gray-600">{candidate.cultural_preferences.work_environment || t('candidateDetailPanel.notSpecified')}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm">{t('candidateDetailPanel.culturalPreferences.companySize')}</h4>
                    <p className="text-sm text-gray-600">{candidate.cultural_preferences.company_size || t('candidateDetailPanel.notSpecified')}</p>
                  </div>
                </div>
                {candidate.cultural_preferences.values && candidate.cultural_preferences.values.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">{t('candidateDetailPanel.culturalPreferences.values')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.cultural_preferences.values.map((value, index) => (
                        <Badge key={index} variant="outline" size="sm" className="border-purple-300 text-purple-700">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
          viewerRole="employer"
        />
      )}
    </div>
  );
};

export default CandidateDetailPanel;
