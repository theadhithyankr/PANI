import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Edit, Eye, Users, Calendar, Settings, BarChart3, MapPin, Clock, Euro, Briefcase, Star, MessageCircle, UserCheck, UserX, Target, CheckCircle, AlertCircle, Building, Award, TrendingUp, Globe, Calendar as CalendarIcon } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';
import InterviewSchedulingModal from './InterviewSchedulingModal';
import { getApplicationsForJob, getCandidatesForJob, applications, candidates } from '../../data/dummyData';
import { formatDistanceToNow } from 'date-fns';
import useSkillMatchingStore from '../../hooks/employer/useSkillMatching';
import { useCompanyData } from '../../hooks/employer/useCompanyData';

const JobDetailModal = ({ job, isOpen, onClose, onEdit }) => {
  const { t } = useTranslation('employer');
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Use Zustand store for skill matching
  const { 
    skillMatches, 
    loading: loadingSkillMatches, 
    error: skillMatchError,
    fetchSkillMatches, 
    clearSkillMatches,
    getMatchStats 
  } = useSkillMatchingStore();

  // Fetch company data using the company_id from the job
  const { 
    company: companyData, 
    loading: loadingCompany, 
    error: companyError,
    storeState 
  } = useCompanyData(job?.company_id);

  // Debug logging for Zustand store state
  useEffect(() => {
    if (job?.company_id) {
      console.log('Employer JobDetailModal - Job company_id:', job.company_id);
      console.log('Employer JobDetailModal - Job companies data:', job.companies);
      console.log('Employer JobDetailModal - Company data from store:', companyData);
      console.log('Employer JobDetailModal - Company loading:', loadingCompany);
      console.log('Employer JobDetailModal - Company error:', companyError);
      console.log('Employer JobDetailModal - Store state:', storeState);
      console.log('Employer JobDetailModal - All cached companies:', storeState.companies);
    }
  }, [job?.company_id, job?.companies, companyData, loadingCompany, companyError, storeState]);

  // Fetch skill matches when tab changes or job changes
  useEffect(() => {
    if (activeTab === 'applicants' && job) {
      fetchSkillMatches(job);
    }
  }, [activeTab, job?.id, fetchSkillMatches]);

  // Clear skill matches when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearSkillMatches();
    }
    }, [isOpen, clearSkillMatches]);
  
  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate);
    setShowInterviewModal(true);
  };

  const handleInterviewScheduled = (interview) => {
    // Handle the scheduled interview - you can add logic here
    console.log('Interview scheduled:', interview);
    setShowInterviewModal(false);
    setSelectedCandidate(null);
  };

  // Dynamic data processing with memoization
  const processedJobData = useMemo(() => {
    if (!job) return null;

    // Helper function to safely process array fields
    const processArrayField = (field, splitPattern = /\r?\n|,/) => {
      if (Array.isArray(field)) {
        return field.map(item => typeof item === 'string' ? item.trim() : String(item)).filter(Boolean);
      }
      if (typeof field === 'string' && field.trim() !== '') {
        return field.split(splitPattern).map(item => item.trim()).filter(Boolean);
      }
      return [];
    };

    // Helper function to format salary
    const formatSalary = (salaryRange) => {
      if (!salaryRange) return t('jobDetailModal.notSpecified');
      
      if (typeof salaryRange === 'string') {
        return salaryRange;
      }
      
      if (typeof salaryRange === 'object') {
        const currency = salaryRange.currency || '€';
        if (salaryRange.fixed) {
          return `${currency} ${salaryRange.fixed}`;
        }
        if (salaryRange.min && salaryRange.max) {
          return `${currency} ${salaryRange.min} - ${salaryRange.max}`;
        }
      }
      
      return t('jobDetailModal.notSpecified');
    };

    // Helper function to format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
      } catch (error) {
        console.warn('Invalid date format:', dateString);
        return 'N/A';
      }
    };

    return {
      // Basic info
      title: job.title || 'Untitled Job',
      status: job.status || 'draft',
      description: job.description || 'No description available',
      location: job.location || 'Not specified',
      
      // Processed arrays
      requirements: processArrayField(job.requirements),
      benefits: processArrayField(job.benefits),
      skills: processArrayField(job.skills_required, /,|\r?\n/),
      
      // Formatted data
      salary: formatSalary(job.salary_range),
      postedDate: formatDate(job.created_at),
      
      // Company info - Updated to use real company data from companies table
      company: companyData?.name || job.companies?.name || job.company || t('jobDetailModal.companyNotSpecified'),
      companyDescription: companyData?.description || job.companies?.description || job.companyDescription || t('jobDetailModal.companyDescription'),
      companySize: companyData?.size || job.companies?.size || job.companySize || t('jobDetailModal.companySize'),
      industry: companyData?.industry || job.companies?.industry || job.industry || t('jobDetailModal.industry'),
      companyWebsite: companyData?.website || job.companies?.website || null,
      companyLocation: companyData?.headquarters_location || job.companies?.headquarters_location || null,
      companyFoundedYear: companyData?.founded_year || job.companies?.founded_year || null,
      companyLogo: companyData?.logo_url || job.companies?.logo_url || null,
      companyAverageSalary: companyData?.average_salary || job.companies?.average_salary || null,
      
      // Analytics data with fallbacks
      viewsCount: job.viewsCount || job.views_count || 0,
      applicationsCount: job.applicationsCount || job.applications_count || 0,
      
      // Work details
      workModel: job.is_remote ? 'Remote' : job.is_hybrid ? 'Hybrid' : 'On-site',
      experienceLevel: job.experience_level || 'Not specified',
      jobType: job.job_type || 'Full-time',
      
      // Additional fields
      visaSponsorship: job.visa_sponsorship || false,
      relocation: job.relocation || false,
      equity: job.equity || false,
    };
    }, [job, companyData]);
  
  const jobApplications = job ? getApplicationsForJob(job.id) : [];
  const jobCandidates = job ? getCandidatesForJob(job.id) : [];

  // Dynamic applicant stats calculation - moved to top level
  const applicantStats = useMemo(() => {
    const stats = {
      total: jobApplications.length,
      reviewing: jobApplications.filter(app => app.status === 'reviewing').length,
      interviewing: jobApplications.filter(app => app.status === 'interviewing').length,
      offered: jobApplications.filter(app => app.status === 'offered').length,
      rejected: jobApplications.filter(app => app.status === 'rejected').length,
    };
    
    return stats;
  }, [jobApplications]);

  // Dynamic analytics calculations - moved to top level
  const analyticsData = useMemo(() => {
    const totalViews = processedJobData?.viewsCount || 0;
    const totalApplications = processedJobData?.applicationsCount || 0;
    const applicationRate = totalViews > 0 ? Math.round((totalApplications / totalViews) * 100) : 0;
    
    const avgMatchScore = jobCandidates.length > 0 
      ? Math.round(jobCandidates.reduce((sum, c) => sum + (c.matchScore || 0), 0) / jobCandidates.length)
      : 0;
    
    const timeToFill = processedJobData?.postedDate 
      ? Math.floor((new Date() - new Date(processedJobData.postedDate)) / (1000 * 60 * 60 * 24))
      : 0;

    const funnelData = [
      { stage: 'Job Views', count: totalViews, color: 'bg-blue-500' },
      { stage: 'Applications', count: totalApplications, color: 'bg-green-500' },
      { stage: 'Under Review', count: applicantStats?.reviewing || 0, color: 'bg-yellow-500' },
      { stage: 'Interviews', count: applicantStats?.interviewing || 0, color: 'bg-purple-500' },
      { stage: 'Offers', count: applicantStats?.offered || 0, color: 'bg-red-500' },
    ];

    const sourceData = [
      { source: 'Direct Applications', count: Math.round(totalApplications * 0.6), percentage: 62 },
      { source: 'LinkedIn', count: Math.round(totalApplications * 0.25), percentage: 25 },
      { source: 'Job Boards', count: Math.round(totalApplications * 0.15), percentage: 13 },
    ];

    return {
      applicationRate,
      avgMatchScore,
      timeToFill,
      funnelData,
      sourceData,
      totalViews,
      totalApplications
    };
  }, [processedJobData, jobCandidates, applicantStats]);

  // Dynamic settings configuration - moved to top level
  const settingsConfig = useMemo(() => ({
    notifications: [
      { label: 'New applications', enabled: true, key: 'new_applications' },
      { label: 'Application status updates', enabled: true, key: 'status_updates' },
      { label: 'Interview reminders', enabled: false, key: 'interview_reminders' },
      { label: 'Weekly analytics digest', enabled: true, key: 'analytics_digest' },
      { label: 'Skill match alerts', enabled: true, key: 'skill_matches' },
    ],
    subscription: {
      plan: 'Professional Plan',
      tier: 'Pro',
      features: [
        'Unlimited job postings',
        'AI-powered candidate matching',
        'Advanced analytics',
        'Priority support',
        'Visa sponsorship tracking',
        'Custom branding',
      ]
    }
  }), []);

  // Dynamic tabs configuration - must be before early return
  const tabs = useMemo(() => [
    { id: 'overview', label: t('jobDetailModal.overview'), icon: Eye },
    { 
      id: 'applicants', 
      label: t('jobDetailModal.applicants'), 
      icon: Users, 
      count: skillMatches.length,
      disabled: false
    },
  ], [skillMatches.length, t]);

  // Early return after all hooks
  if (!isOpen || !job) return null;

  // Dynamic status color mapping
  const getStatusColor = (status) => {
    const statusColors = {
      'active': 'success',
      'draft': 'warning',
      'paused': 'error',
      'closed': 'default',
      'published': 'success',
      'archived': 'default',
    };
    return statusColors[status] || 'default';
  };

  const getApplicationStatusColor = (status) => {
    const statusColors = {
      'applied': 'info',
      'reviewing': 'warning',
      'interviewing': 'secondary',
      'offered': 'success',
      'rejected': 'error',
      'withdrawn': 'default',
    };
    return statusColors[status] || 'default';
  };

  const getMatchScoreColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'secondary';
    if (percentage >= 40) return 'warning';
    return 'default';
  };

  // Dynamic content renderer
  const renderDynamicContent = (content, fallback = 'No content available') => {
    if (!content || content.length === 0) {
      return <span className="text-gray-500">{fallback}</span>;
    }
    return content;
  };

  const renderOverview = () => {
    if (!processedJobData) return <div>{t('jobDetailModal.loading')}</div>;

    return (
      <div className="space-y-6">
        {/* Job Header */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{processedJobData.title}</h2>
                <Badge variant={getStatusColor(processedJobData.status)} size="sm">
                  {processedJobData.status}
                </Badge>
              </div>
              <div className="flex items-center gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {processedJobData.location}
                </div>
                <div className="flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  {processedJobData.salary}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {t('jobDetailModal.posted')} {processedJobData.postedDate}
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {t('jobDetailModal.workModel')}: {processedJobData.workModel}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => {
              console.log('Edit button clicked, calling onEdit with job:', job);
              onEdit(job);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              {t('jobDetailModal.edit')}
            </Button>
          </div>
        </Card>

        {/* Job Description */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">{t('jobDetailModal.description')}</h3>
          <p className="text-gray-700 leading-relaxed mb-6">{processedJobData.description}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t('jobDetailModal.requirements')}</h4>
              <ul className="space-y-2">
                {processedJobData.requirements.length > 0 ? (
                  processedJobData.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">{t('jobDetailModal.noRequirementsSpecified')}</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t('jobDetailModal.benefits')}</h4>
              <ul className="space-y-2">
                {processedJobData.benefits.length > 0 ? (
                  processedJobData.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">{t('jobDetailModal.noBenefitsSpecified')}</li>
                )}
              </ul>
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">{t('jobDetailModal.skillsRequired')}</h3>
          <div className="flex flex-wrap gap-2">
            {processedJobData.skills.length > 0 ? (
              processedJobData.skills.map((skill, index) => (
                <Badge key={index} variant="default" size="sm">
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-gray-500">{t('jobDetailModal.noSkillsSpecified')}</span>
            )}
          </div>

        </Card>

        {/* Additional Job Details */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">{t('jobDetailModal.additionalDetails')}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('jobDetailModal.experienceLevel')}</span>
                <span className="font-medium">{processedJobData.experienceLevel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('jobDetailModal.jobType')}</span>
                <span className="font-medium">{processedJobData.jobType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('jobDetailModal.visaSponsorship')}</span>
                <Badge variant={processedJobData.visaSponsorship ? 'success' : 'default'} size="sm">
                  {processedJobData.visaSponsorship ? t('jobDetailModal.available') : t('jobDetailModal.notAvailable')}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('jobDetailModal.relocation')}</span>
                <Badge variant={processedJobData.relocation ? 'success' : 'default'} size="sm">
                  {processedJobData.relocation ? t('jobDetailModal.available') : t('jobDetailModal.notAvailable')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('jobDetailModal.equity')}</span>
                <Badge variant={processedJobData.equity ? 'success' : 'default'} size="sm">
                  {processedJobData.equity ? t('jobDetailModal.available') : t('jobDetailModal.notAvailable')}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Company Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">{t('jobDetailModal.companyInformation')}</h3>
          
          {loadingCompany ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">{t('jobDetailModal.loadingCompanyInfo')}</span>
            </div>
          ) : companyError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {t('jobDetailModal.errorLoadingCompany')} {companyError}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Company Header */}
              <div className="flex items-center gap-4">
                {processedJobData.companyLogo ? (
                  <img 
                    src={processedJobData.companyLogo} 
                    alt={processedJobData.company}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{processedJobData.company}</h4>
                  <p className="text-sm text-gray-600">{processedJobData.industry} • {processedJobData.companySize}</p>
                </div>
              </div>

              {/* Company Description */}
              {processedJobData.companyDescription && (
                <p className="text-gray-700">{processedJobData.companyDescription}</p>
              )}

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {processedJobData.companyLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('jobDetailModal.headquarters')}</p>
                      <p className="text-sm text-gray-600">{processedJobData.companyLocation}</p>
                    </div>
                  </div>
                )}

                {processedJobData.companyWebsite && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('jobDetailModal.website')}</p>
                      <a 
                        href={processedJobData.companyWebsite} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {processedJobData.companyWebsite}
                      </a>
                    </div>
                  </div>
                )}

                {processedJobData.companyFoundedYear && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('jobDetailModal.founded')}</p>
                      <p className="text-sm text-gray-600">{processedJobData.companyFoundedYear}</p>
                    </div>
                  </div>
                )}

                {processedJobData.companyAverageSalary && (
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('jobDetailModal.averageSalary')}</p>
                      <p className="text-sm text-gray-600">€{processedJobData.companyAverageSalary.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderApplicants = () => {
    console.log('Rendering applicants with skillMatches:', skillMatches);
    const matchStats = getMatchStats();
    
    return (
      <div className="space-y-6">
        {/* Applicant Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{applicantStats.total}</div>
              <div className="text-sm text-gray-600">{t('jobDetailModal.totalApplications')}</div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{applicantStats.reviewing}</div>
              <div className="text-sm text-gray-600">{t('jobDetailModal.underReview')}</div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{applicantStats.interviewing}</div>
              <div className="text-sm text-gray-600">{t('jobDetailModal.interviewing')}</div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{applicantStats.offered}</div>
              <div className="text-sm text-gray-600">{t('jobDetailModal.offersMade')}</div>
            </div>
          </Card>
        </div>

        {/* Skill Matches Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{t('jobDetailModal.candidatesWithMatchingSkills')}</h3>
              <p className="text-sm text-gray-600">{t('jobDetailModal.showingCandidates')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchSkillMatches(job)} disabled={loadingSkillMatches}>
              <Target className="w-4 h-4 mr-2" />
              {loadingSkillMatches ? t('jobDetailModal.refreshing') : t('jobDetailModal.refreshMatches')}
            </Button>
          </div>

          {/* Job Skills Overview */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">{t('jobDetailModal.requiredSkillsForPosition')}</h4>
            <div className="flex flex-wrap gap-2">
              {processedJobData.skills.length > 0 ? (
                processedJobData.skills.map((skill, index) => (
                  <Badge key={index} variant="primary" size="sm">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500">{t('jobDetailModal.noSkillsSpecified')}</span>
              )}
            </div>
          </div>

          {/* Error Display */}
          {skillMatchError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {t('jobDetailModal.errorLoadingSkillMatches')} {skillMatchError}
              </p>
            </div>
          )}
          
          {loadingSkillMatches ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">{t('jobDetailModal.findingCandidates')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {skillMatches.length > 0 ? (
                skillMatches.map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <img
                          src={match.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${match.profiles?.full_name}&size=40`}
                          alt={match.profiles?.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{match.profiles?.full_name || 'Unknown Candidate'}</h4>
                          <p className="text-xs text-gray-600">{match.headline || 'No headline'}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <span>📍 {match.current_location || 'Location not specified'}</span>
                            <span>💼 {match.experience_years || 0} years</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getMatchScoreColor(match.matchPercentage)} size="sm" className="mb-1">
                          {match.matchPercentage || 0}% match
                        </Badge>
                        {match.hasApplied && (
                          <Badge variant="success" size="sm">
                            Applied
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Matching Skills */}
                    {match.matchingSkills && match.matchingSkills.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-medium text-gray-900">{t('jobDetailModal.matching')} {match.matchingSkills.length} {t('jobDetailModal.skills')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.matchingSkills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="success" size="sm" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.matchingSkills.length > 3 && (
                            <Badge variant="success" size="sm" className="text-xs">
                              +{match.matchingSkills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {match.missingSkills && match.missingSkills.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-medium text-gray-900">{t('jobDetailModal.missing')} {match.missingSkills.length} {t('jobDetailModal.skills')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.missingSkills.slice(0, 2).map((skill, index) => (
                            <Badge key={index} variant="warning" size="sm" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.missingSkills.length > 2 && (
                            <Badge variant="warning" size="sm" className="text-xs">
                              +{match.missingSkills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        {match.target_salary_range && (
                          <span>
                            {t('jobDetailModal.expected')}: {match.target_salary_range.currency || '€'} {match.target_salary_range.min || 0}k - {match.target_salary_range.max || 0}k
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="primary" size="sm" className="text-xs px-2 py-1" onClick={() => handleScheduleInterview(match)}>
                          <Calendar className="w-3 h-3 mr-1" />
                          {t('jobDetailModal.scheduleInterview')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {processedJobData.skills.length > 0 
                      ? t('jobDetailModal.noCandidatesWithSkills')
                      : t('jobDetailModal.noSkillsSpecifiedForJob')
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderAnalytics = () => {
    return (
      <div className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Application Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.applicationRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Match Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.avgMatchScore}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time to Fill</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.timeToFill} days
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Application Funnel */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Application Funnel</h3>
          <div className="space-y-4">
            {analyticsData.funnelData.map((stage, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm font-medium text-gray-700">{stage.stage}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className={`${stage.color} h-6 rounded-full flex items-center justify-end pr-2`}
                    style={{ 
                      width: `${analyticsData.totalViews > 0 
                        ? Math.max((stage.count / analyticsData.totalViews) * 100, 5) 
                        : 5}%` 
                    }}
                  >
                    <span className="text-white text-xs font-medium">{stage.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Source Analytics */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Application Sources</h3>
          <div className="space-y-3">
            {analyticsData.sourceData.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{source.source}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{source.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Additional Insights */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Performance Summary</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {analyticsData.totalViews} total job views</li>
                <li>• {analyticsData.totalApplications} applications received</li>
                <li>• {analyticsData.applicationRate}% application rate</li>
                <li>• {analyticsData.timeToFill} days since posting</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Quality Metrics</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• {analyticsData.avgMatchScore}% average match score</li>
                <li>• {skillMatches.length} candidates with matching skills</li>
                <li>• {applicantStats?.interviewing || 0} candidates in interview stage</li>
                <li>• {applicantStats?.offered || 0} offers made</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6">
        {/* Job Status */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Job Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Current Status</p>
                <p className="text-sm text-gray-600">Job is currently {processedJobData.status}</p>
              </div>
              <Badge variant={getStatusColor(processedJobData.status)} size="sm">
                {processedJobData.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={processedJobData.status === 'paused'}
              >
                Pause Job
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={processedJobData.status === 'closed'}
              >
                Close Job
              </Button>
              <Button variant="outline" size="sm">
                Duplicate Job
              </Button>
            </div>
          </div>
        </Card>

        {/* Subscription Tier */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Subscription Tier</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Current Plan</p>
                <p className="text-sm text-gray-600">{settingsConfig.subscription.plan}</p>
              </div>
              <Badge variant="primary" size="sm">{settingsConfig.subscription.tier}</Badge>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Available Features</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {settingsConfig.subscription.features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
            
            <Button variant="outline" size="sm">Upgrade Plan</Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
          <div className="space-y-3">
            {settingsConfig.notifications.map((setting, index) => (
              <label key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{setting.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={setting.enabled}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </Card>

        {/* Job Configuration */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Job Configuration</h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-close after</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option>30 days</option>
                  <option>60 days</option>
                  <option>90 days</option>
                  <option>Never</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Application limit</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option>No limit</option>
                  <option>50 applications</option>
                  <option>100 applications</option>
                  <option>200 applications</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-match"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto-match" className="text-sm text-gray-700">
                Enable automatic skill matching
              </label>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <p className="font-medium text-red-900">Delete Job</p>
                <p className="text-sm text-red-700">Permanently delete this job posting and all associated data</p>
              </div>
              <Button variant="danger" size="sm">Delete</Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div>
                <p className="font-medium text-orange-900">Archive Job</p>
                <p className="text-sm text-orange-700">Archive this job posting (can be restored later)</p>
              </div>
              <Button variant="warning" size="sm">Archive</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderTabContent = () => {
    // Dynamic tab content with loading states
    if (!processedJobData) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">{t('jobDetailModal.loadingJobDetails')}</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'applicants': return renderApplicants();
      default: return renderOverview();
    }
  };

  // Dynamic modal title and subtitle
  const modalTitle = processedJobData ? `Job Details - ${processedJobData.title}` : 'Job Details';
  const modalSubtitle = processedJobData ? `${processedJobData.company} • ${processedJobData.location}` : '';

  // Safety check - if no job data, don't render
  if (!processedJobData) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{modalTitle}</h2>
              {modalSubtitle && <p className="text-gray-600 mt-1">{modalSubtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose} className="p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : tab.disabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <Badge variant="default" size="sm">{tab.count}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {renderTabContent()}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => {
                console.log('Footer edit button clicked, calling onEdit with job:', job);
                onEdit(job);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                {t('jobDetailModal.editJob')}
              </Button>

            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t('jobDetailModal.close')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Scheduling Modal */}
      {showInterviewModal && (
        <InterviewSchedulingModal
          isOpen={showInterviewModal}
          onClose={() => setShowInterviewModal(false)}
          onSchedule={handleInterviewScheduled}
          candidate={selectedCandidate}
          job={job}
        />
      )}
    </div>
  );
};

export default JobDetailModal;