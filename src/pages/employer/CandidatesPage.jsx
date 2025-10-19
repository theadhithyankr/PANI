import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Star, Users, CheckSquare, X, Loader, AlertCircle, EyeOff } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import CandidateCard from '../../components/employer/CandidateCard';
import CandidateDetailPanel from '../../components/employer/CandidateDetailPanel';
import JobSelectionModal from '../../components/employer/JobSelectionModal';
import { useMatchedCandidates, useJobPost } from '../../hooks/employer';
import { useToast } from '../../hooks/common';
import useShortlistStore from '../../store/shortlistStore';
import useCandidatesStore from '../../store/candidatesStore';
import useGlobalStore from '../../stores/globalStore';
import { supabase } from '../../clients/supabaseClient';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/common/Dialog';
import InterviewSchedulingModal from '../../components/employer/InterviewSchedulingModal';

const LoadingState = () => {
  const { t } = useTranslation('employer');
  
  return (
    <div className="relative w-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-lg border border-gray-100 bg-white/50">
      <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
      <p className="text-gray-600">{t('candidatesPage.emptyState.loading')}</p>
    </div>
  );
};

const ErrorState = ({ error, onRetry }) => {
  const { t } = useTranslation('employer');
  
  return (
    <div className="relative w-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-lg border border-red-100 bg-red-50">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">{t('candidatesPage.error.title')}</h3>
      <p className="text-red-700 text-center max-w-md mb-6">{error || t('candidatesPage.error.message')}</p>
      <Button onClick={onRetry} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
        {t('candidatesPage.error.tryAgain')}
      </Button>
    </div>
  );
};

const EmptyState = ({ searchTerm, statusFilter, activeJobTab, onClearFilters }) => {
  const { t } = useTranslation('employer');
  const isFiltering = searchTerm || statusFilter !== 'all' || activeJobTab !== 'all';

  return (
    <div className="relative w-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-lg border border-gray-100 bg-white/50">
      <div className="w-16 h-16 mb-6 text-gray-300">
        <Users className="w-full h-full" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {isFiltering 
          ? t('candidatesPage.emptyState.noCandidatesFound')
          : t('candidatesPage.emptyState.noCandidatesYet')}
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        {isFiltering 
          ? t('candidatesPage.emptyState.adjustFilters')
          : t('candidatesPage.emptyState.noMatches')}
      </p>
      {isFiltering && (
        <Button 
          variant="outline" 
          onClick={onClearFilters}
          className="bg-white hover:bg-gray-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          {t('candidatesPage.emptyState.clearFilters')}
        </Button>
      )}
    </div>
  );
};

const CandidatesPage = () => {
  const { t } = useTranslation('employer');
  
  // Get user and profile from global store
  const user = useGlobalStore((state) => state.user);
  const profile = useGlobalStore((state) => state.profile);
  
  // Zustand store
  const {
    // State
    candidates: storeCandidates,
    loading: storeLoading,
    error: storeError,
    filters,
    selectedCandidates,
    showBulkActions,
    showDetailPanel,
    selectedCandidate,
    showSchedulingModal,
    showJobSelectionModal,
    schedulingCandidate,
    shortlistingCandidate,
    
    // Actions
    setLoading,
    setError,
    setCandidates,
    setSearchTerm,
    setDebouncedSearchTerm,
    setStatusFilter,
    setActiveJobTab,
    clearFilters,
    toggleCandidateSelection,
    clearSelection,
    setShowBulkActions,
    setShowDetailPanel,
    setSelectedCandidate,
    setShowSchedulingModal,
    setShowJobSelectionModal,
    setSchedulingCandidate,
    setShortlistingCandidate,
    
    // Computed values
    getFilteredCandidates,
    getPinnedCandidates,
    getRegularCandidates,
    reset
  } = useCandidatesStore();

  const { candidates, loading, error, fetchMatchedCandidates } = useMatchedCandidates();
  const { jobs: employerJobs, listJobs: fetchEmployerJobs } = useJobPost();
  const toast = useToast();
  // Invite flow removed
  
  // Shortlist store
  const { 
    addToShortlist, 
    removeFromShortlist, 
    isApplicationShortlisted,
    bulkAddToShortlist,
    addToRejected,
    isApplicationRejected,
    getCandidateStatus
  } = useShortlistStore();

  // Reset store and fetch fresh data on every page load
  useEffect(() => {
    const loadFreshData = async () => {
      try {
        console.log('CandidatesPage - Loading fresh data...');
        
        // Reset store to clear any cached data
        reset();
        
        // Set loading state
        setLoading(true);
        setError(null);
        
        // Fetch fresh data
        const [jobsResult, candidatesResult] = await Promise.all([
          fetchEmployerJobs(),
          fetchMatchedCandidates()
        ]);
        
        // Sync candidates with store for filtering
        if (candidatesResult && candidatesResult.length > 0) {
          setCandidates(candidatesResult);
        }
        
        console.log('CandidatesPage - Fresh data loaded successfully');
      } catch (err) {
        console.error('Error loading fresh data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Only load data if we have user and profile data
    if (user && profile) {
      loadFreshData();
    }
  }, [user, profile, setCandidates]); // Depend on user and profile

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [filters.searchTerm, setDebouncedSearchTerm]);

  // Status filter options
  const statusOptions = [
    { value: 'all', label: t('candidatesPage.filters.allStatuses') },
    { value: 'new', label: t('candidatesPage.filters.new') },
    { value: 'shortlisted', label: t('candidatesPage.filters.shortlisted') },
    { value: 'interviewing', label: t('candidatesPage.filters.interviewing') },
    { value: 'rejected', label: t('candidatesPage.filters.rejected') }
  ];

  // Job tabs from employer's jobs data
  const jobTabs = useMemo(() => {
    const activeJobs = employerJobs.filter(job => job.status === 'active');
    return [
      { id: 'all', title: t('candidatesPage.filters.allJobs') }, 
      ...activeJobs.map(job => ({
        id: job.id,
        title: job.title
      }))
    ];
  }, [employerJobs, t]);

  // Get filtered candidates from store
  const filteredCandidates = getFilteredCandidates();
  const pinnedCandidates = getPinnedCandidates();
  const regularCandidates = getRegularCandidates();

  // Determine loading state
  const isLoading = storeLoading || loading || !user || !profile;

  // Determine if we should show empty state
  const shouldShowEmptyState = !isLoading && storeCandidates.length === 0;

  // Determine if we should show error state
  const shouldShowError = !isLoading && (storeError || error);

  const handleCandidateSelect = (candidateId, selected) => {
    toggleCandidateSelection(candidateId);
    setShowBulkActions(selectedCandidates.length > 0 || selected);
  };

  const handleBulkShortlist = () => {
    const candidatesToShortlist = filteredCandidates.filter(c => selectedCandidates.includes(c.id));
    if (candidatesToShortlist.length > 0) {
      setShortlistingCandidate(candidatesToShortlist);
      setShowJobSelectionModal(true);
    }
  };

  const handleBulkReject = () => {
    console.log('Bulk reject:', selectedCandidates);
    toast.success(t('candidatesPage.toasts.bulkRejectSuccess', { count: selectedCandidates.length }));
    clearSelection();
    setShowBulkActions(false);
  };

  const handleShortlist = (candidate) => {
    if (isApplicationShortlisted(candidate.id)) {
      const success = removeFromShortlist(candidate.id);
      if (success) {
        toast.success(t('candidatesPage.toasts.removedFromShortlist', { name: candidate.name }));
      }
    } else {
      setShortlistingCandidate(candidate);
      setShowJobSelectionModal(true);
    }
  };

  const handleReject = (candidate) => {
    try {
      const selectedJob = filters.activeJobTab !== 'all' 
        ? employerJobs.find(job => job.id === filters.activeJobTab)
        : null;

      const rejectedApplicationData = {
        id: candidate.id,
        applicationId: candidate.id,
        jobId: selectedJob?.id || filters.activeJobTab !== 'all' ? filters.activeJobTab : 'unknown',
        candidateId: candidate.id,
        matchScore: candidate.matchScore || 0,
        status: 'rejected',
        coverNote: candidate.coverNote || '',
        applicationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        job: selectedJob ? {
          id: selectedJob.id,
          title: selectedJob.title,
          companyId: selectedJob.company_id
        } : null,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          avatar: candidate.avatar,
          phone: candidate.phone,
          emailVerified: candidate.email_verified,
          phoneVerified: candidate.phone_verified,
          profile: {
            headline: candidate.headline,
            summary: candidate.summary,
            experienceYears: candidate.experience_years,
            location: candidate.current_location,
            skills: candidate.skills || [],
            languages: candidate.languages || [],
            salaryRange: candidate.target_salary_range,
            aiSummary: candidate.ai_generated_summary
          }
        },
        rejectedBy: 'current_user_id'
      };

      const success = addToRejected(rejectedApplicationData);
      if (success) {
        toast.success(t('candidatesPage.toasts.rejectSuccess', { name: candidate.name }));
      } else {
        toast.error(t('candidatesPage.toasts.rejectError'));
      }
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      toast.error(t('candidatesPage.toasts.rejectError'));
    }
  };

  const handleViewProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailPanel(true);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedCandidate(null);
  };

  const handleScheduleInterview = (candidate) => {
    setSchedulingCandidate(candidate);
    setShowSchedulingModal(true);
  };

  const handleInterviewScheduled = (interviewData) => {
    console.log('Interview scheduled:', interviewData);
    setShowSchedulingModal(false);
    setSchedulingCandidate(null);
    // Optionally, refresh candidate list or update candidate status
  };

  const handleJobSelection = async (candidateOrCandidates, selectedJob) => {
    try {
      if (Array.isArray(candidateOrCandidates)) {
        const applicationsData = candidateOrCandidates.map(candidate => ({
          id: candidate.id,
          applicationId: candidate.id,
          jobId: selectedJob.id,
          candidateId: candidate.id,
          matchScore: candidate.matchScore || 0,
          status: 'shortlisted',
          coverNote: candidate.coverNote || '',
          applicationDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          job: {
            id: selectedJob.id,
            title: selectedJob.title,
            companyId: selectedJob.company_id
          },
          candidate: {
            id: candidate.id,
            name: candidate.name,
            avatar: candidate.avatar,
            phone: candidate.phone,
            emailVerified: candidate.email_verified,
            phoneVerified: candidate.phone_verified,
            profile: {
              headline: candidate.headline,
              summary: candidate.summary,
              experienceYears: candidate.experience_years,
              location: candidate.current_location,
              skills: candidate.skills || [],
              languages: candidate.languages || [],
              salaryRange: candidate.target_salary_range,
              aiSummary: candidate.ai_generated_summary
            }
          },
          shortlistedBy: 'current_user_id'
        }));

        const success = bulkAddToShortlist(applicationsData);
        if (success) {
          toast.success(t('candidatesPage.toasts.bulkShortlistSuccess', { 
            count: candidateOrCandidates.length,
            jobTitle: selectedJob.title 
          }));
          clearSelection();
          setShowBulkActions(false);
        }
      } else {
        const applicationData = {
          id: candidateOrCandidates.id,
          applicationId: candidateOrCandidates.id,
          jobId: selectedJob.id,
          candidateId: candidateOrCandidates.id,
          matchScore: candidateOrCandidates.matchScore || 0,
          status: 'shortlisted',
          coverNote: candidateOrCandidates.coverNote || '',
          applicationDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          job: {
            id: selectedJob.id,
            title: selectedJob.title,
            companyId: selectedJob.company_id
          },
          candidate: {
            id: candidateOrCandidates.id,
            name: candidate.name,
            avatar: candidate.avatar,
            phone: candidate.phone,
            emailVerified: candidate.email_verified,
            phoneVerified: candidate.phone_verified,
            profile: {
              headline: candidate.headline,
              summary: candidate.summary,
              experienceYears: candidate.experience_years,
              location: candidate.current_location,
              skills: candidate.skills || [],
              languages: candidate.languages || [],
              salaryRange: candidate.target_salary_range,
              aiSummary: candidate.ai_generated_summary
            }
          },
          shortlistedBy: 'current_user_id'
        };

        const success = addToShortlist(applicationData);
        if (success) {
          toast.success(t('candidatesPage.toasts.shortlistSuccess', { 
            name: candidateOrCandidates.name,
            jobTitle: selectedJob.title 
          }));
        }
      }
    } catch (error) {
      console.error('Error shortlisting candidate(s):', error);
      toast.error(t('candidatesPage.toasts.shortlistError'));
    } finally {
      setShowJobSelectionModal(false);
      setShortlistingCandidate(null);
    }
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handleRetry = () => {
    // Reset and reload fresh data
    reset();
    fetchMatchedCandidates();
  };

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      {/* Left Column - Main Content */}
      <div className={`transition-all duration-300 ${showDetailPanel ? 'w-1/2' : 'w-full'}`}>
        <div className="max-w-4xl mx-auto h-full flex flex-col pt-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('candidatesPage.header.title')}</h1>
              <p className="text-gray-600 mt-1">
                {isLoading 
                  ? t('candidatesPage.header.subtitleLoading') 
                  : t('candidatesPage.header.subtitle', { count: filteredCandidates.length })
                }
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('candidatesPage.searchPlaceholder')}
                value={filters.searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filters.statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {jobTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveJobTab(tab.id)}
                  disabled={isLoading}
                  className={`${
                    tab.id === filters.activeJobTab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-current={tab.id === filters.activeJobTab ? 'page' : undefined}
                >
                  {tab.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {t('candidatesPage.bulkActions.selected', { count: selectedCandidates.length })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkShortlist}>
                  <Star className="w-4 h-4 mr-2" />
                  {t('candidatesPage.bulkActions.shortlistAll')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkReject}>
                  <X className="w-4 h-4 mr-2" />
                  {t('candidatesPage.bulkActions.rejectAll')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  clearSelection();
                  setShowBulkActions(false);
                }}>
                  {t('candidatesPage.bulkActions.cancel')}
                </Button>
              </div>
            </div>
          )}

          {/* Candidates List - Scrollable Area */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Show loading state */}
            {isLoading && (
              <LoadingState />
            )}

            {/* Show error state */}
            {shouldShowError && (
              <ErrorState 
                error={storeError || error}
                onRetry={handleRetry}
              />
            )}

            {/* Show empty state */}
            {shouldShowEmptyState && (
              <EmptyState 
                searchTerm={filters.searchTerm}
                statusFilter={filters.statusFilter}
                activeJobTab={filters.activeJobTab}
                onClearFilters={handleClearFilters}
              />
            )}

            {/* Show candidates when not loading and candidates exist */}
            {!isLoading && !shouldShowError && !shouldShowEmptyState && filteredCandidates.length > 0 && (
              <>
                {/* Best Matches Section */}
                {pinnedCandidates.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      {t('candidatesPage.sections.bestMatches', { count: pinnedCandidates.length })}
                    </h2>
                    <div className="space-y-3">
                      {pinnedCandidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedCandidates.includes(candidate.id)}
                            onChange={(e) => handleCandidateSelect(candidate.id, e.target.checked)}
                            className="mt-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <CandidateCard
                              candidate={candidate}
                              onShortlist={handleShortlist}
                              onReject={handleReject}
                              onViewProfile={handleViewProfile}
                              isSelected={selectedCandidate?.id === candidate.id}
                              isShortlisted={isApplicationShortlisted(candidate.id)}
                              isRejected={isApplicationRejected(candidate.id)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Candidates Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {pinnedCandidates.length > 0 ? t('candidatesPage.sections.otherCandidates', { count: regularCandidates.length }) : t('candidatesPage.sections.allCandidates', { count: filteredCandidates.length })}
                  </h2>
                  
                  <div className="space-y-3">
                    {regularCandidates.map((candidate) => (
                      <div key={candidate.id} className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={(e) => handleCandidateSelect(candidate.id, e.target.checked)}
                          className="mt-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <CandidateCard
                            candidate={candidate}
                            onShortlist={handleShortlist}
                            onReject={handleReject}
                            onViewProfile={handleViewProfile}
                            isSelected={selectedCandidate?.id === candidate.id}
                            isShortlisted={isApplicationShortlisted(candidate.id)}
                            isRejected={isApplicationRejected(candidate.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Show filtered empty state when we have candidates but none match filters */}
            {!isLoading && !shouldShowError && !shouldShowEmptyState && storeCandidates.length > 0 && filteredCandidates.length === 0 && (
              <EmptyState 
                searchTerm={filters.searchTerm}
                statusFilter={filters.statusFilter}
                activeJobTab={filters.activeJobTab}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Candidate Detail Panel */}
      {showDetailPanel && (
        <div className="w-1/2 h-full p-6 pl-0 flex flex-col">
          <div className="h-full">
            <CandidateDetailPanel
              candidate={selectedCandidate}
              isOpen={showDetailPanel}
              onClose={handleCloseDetailPanel}
              onShortlist={handleShortlist}
              onReject={handleReject}
              onScheduleInterview={(candidate) => {
                handleScheduleInterview(candidate);
              }}
              isShortlisted={selectedCandidate ? getCandidateStatus(selectedCandidate.id) === 'shortlisted' : false}
            />
          </div>
        </div>
      )}

      {/* Job Selection Modal */}
      <JobSelectionModal
        isOpen={showJobSelectionModal}
        onClose={() => setShowJobSelectionModal(false)}
        onSelectJob={handleJobSelection}
      />

      {/* Interview Scheduling Modal */}
      <InterviewSchedulingModal
        candidate={schedulingCandidate}
        isOpen={showSchedulingModal}
        onClose={() => {
          setShowSchedulingModal(false);
          setSchedulingCandidate(null);
        }}
        onSchedule={handleInterviewScheduled}
      />
    </div>
  );
};

export default CandidatesPage;
