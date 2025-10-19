import { useEffect, useRef, useMemo, useCallback } from 'react';
import useApplicationsStore from '../../store/applicationsStore';

/**
 * Main hook to access the applications store with filtered data and actions
 * @param {string} applicantId - The user's profile ID
 * @param {Object} profile - The user's job seeker profile
 */
export const useApplicationsStoreData = (applicantId, profile = null) => {
  // Use separate selectors for better performance and stability
  const applications = useApplicationsStore(state => state.applications);
  const matchedJobs = useApplicationsStore(state => state.matchedJobs);
  const offers = useApplicationsStore(state => state.offers);
  const invitations = useApplicationsStore(state => state.invitations);
  const loading = useApplicationsStore(state => state.loading);
  const error = useApplicationsStore(state => state.error);
  const filters = useApplicationsStore(state => state.filters);
  const selectedApplication = useApplicationsStore(state => state.selectedApplication);
  const showDetailPanel = useApplicationsStore(state => state.showDetailPanel);
  
  // Actions
  const setFilters = useApplicationsStore(state => state.setFilters);
  const setSelectedApplication = useApplicationsStore(state => state.setSelectedApplication);
  const setShowDetailPanel = useApplicationsStore(state => state.setShowDetailPanel);
  const fetchAllData = useApplicationsStore(state => state.fetchAllData);
  const clearData = useApplicationsStore(state => state.clearData);
  const verifyDataIsolation = useApplicationsStore(state => state.verifyDataIsolation);
  const updateOfferStatus = useApplicationsStore(state => state.updateOfferStatus);
  const acceptInvitation = useApplicationsStore(state => state.acceptInvitation);
  const declineInvitation = useApplicationsStore(state => state.declineInvitation);

  // Use ref to track if we've already fetched data for this user
  const hasFetchedRef = useRef(false);
  const lastApplicantIdRef = useRef(null);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    if (!applicantId) {
      console.warn('No applicantId provided to useApplicationsStoreData hook');
      return;
    }

    if (!hasFetchedRef.current || lastApplicantIdRef.current !== applicantId) {
      console.log('Fetching data for applicantId:', applicantId);
      hasFetchedRef.current = true;
      lastApplicantIdRef.current = applicantId;
      await fetchAllData(applicantId, profile);
    }
  }, [applicantId, profile, fetchAllData]);

  // Fetch all data when component mounts or dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Verify data isolation after data is loaded
  useEffect(() => {
    if (applicantId && applications.length > 0) {
      // Small delay to ensure data is fully loaded
      const timer = setTimeout(() => {
        verifyDataIsolation(applicantId);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [applicantId, applications, offers, verifyDataIsolation]);

  // Cleanup effect - reset store when component unmounts or user changes
  useEffect(() => {
    return () => {
      // Reset the fetch tracking when component unmounts
      hasFetchedRef.current = false;
      lastApplicantIdRef.current = null;
    };
  }, []);

  // Memoize filtered data based on current filters
  const filteredData = useMemo(() => {
    const { searchTerm, statusFilter, activeTab } = filters;

    switch (activeTab) {
      case 'ai-matched':
        return matchedJobs.filter(job => 
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      case 'applications':
        // Combine applications and invitations for the applications tab
        const allApplications = [...applications, ...invitations];
        return allApplications.filter(app => {
          const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               app.company.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
          return matchesSearch && matchesStatus;
        });
      
      case 'review':
        return applications.filter(app => {
          const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               app.company.toLowerCase().includes(searchTerm.toLowerCase());
          return app.status === 'reviewing' && matchesSearch;
        });
      
      case 'interview':
        // Include applications with interviews and accepted invitations
        const allInterviewItems = [...applications, ...invitations];
        return allInterviewItems.filter(app => {
          const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               app.company.toLowerCase().includes(searchTerm.toLowerCase());
          return (app.status === 'interviewing' || (app.allInterviews && app.allInterviews.length > 0) || app.isInvitation) && matchesSearch;
        });
      
      case 'invitations':
        return invitations.filter(invitation => {
          const matchesSearch = invitation.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               invitation.company.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
          return matchesSearch && matchesStatus;
        });
      
      case 'offers':
        return offers.filter(offer => 
          offer.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      case 'accepted':
        return applications.filter(app => {
          const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               app.company.toLowerCase().includes(searchTerm.toLowerCase());
          return app.status === 'accepted' && matchesSearch;
        });
      
      case 'hired':
        return applications.filter(app => {
          const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               app.company.toLowerCase().includes(searchTerm.toLowerCase());
          return app.status === 'hired' && matchesSearch;
        });
      
      case 'declined':
        return applications.filter(app => {
          const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               app.company.toLowerCase().includes(searchTerm.toLowerCase());
          return (app.status === 'declined' || app.status === 'withdrawn') && matchesSearch;
        });
      
      case 'rejected':
        return applications.filter(app => {
          const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               app.company.toLowerCase().includes(searchTerm.toLowerCase());
          return app.status === 'rejected' && matchesSearch;
        });
      
      default:
        return [];
    }
  }, [applications, matchedJobs, offers, filters]);

  // Memoize application statistics
  const stats = useMemo(() => {
    const allItems = [...applications, ...invitations];
    return {
      total: allItems.length,
      applied: applications.filter(a => a.status === 'applied').length,
      reviewing: applications.filter(a => a.status === 'reviewing').length,
      interviewing: allItems.filter(a => a.status === 'interviewing' || (a.allInterviews && a.allInterviews.length > 0) || a.isInvitation).length,
      offered: applications.filter(a => a.status === 'offered').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      hired: applications.filter(a => a.status === 'hired').length,
      declined: allItems.filter(a => a.status === 'declined' || a.status === 'withdrawn').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      invited: invitations.filter(i => i.status === 'invited').length,
    };
  }, [applications, invitations]);

  // Memoize tab counts
  const tabCounts = useMemo(() => {
    const allItems = [...applications, ...invitations];
    return {
      'ai-matched': matchedJobs.length,
      'applications': allItems.length,
      'review': applications.filter(a => a.status === 'reviewing').length,
      'interview': allItems.filter(a => a.status === 'interviewing' || (a.allInterviews && a.allInterviews.length > 0) || a.isInvitation).length,
      'invitations': invitations.length,
      'offers': offers.length,
      'accepted': applications.filter(a => a.status === 'accepted').length,
      'hired': applications.filter(a => a.status === 'hired').length,
      'declined': allItems.filter(a => a.status === 'declined' || a.status === 'withdrawn').length,
      'rejected': applications.filter(a => a.status === 'rejected').length
    };
  }, [applications, matchedJobs, offers, invitations]);

  return {
    // Data
    applications,
    matchedJobs,
    offers,
    invitations,
    filteredData,
    
    // Loading and Error States
    loading,
    error,
    
    // UI State
    filters,
    selectedApplication,
    showDetailPanel,
    
    // Statistics
    stats,
    tabCounts,
    
    // Actions
    setFilters,
    setSelectedApplication,
    setShowDetailPanel,
    clearData,
    verifyDataIsolation,
    updateOfferStatus,
    acceptInvitation,
    declineInvitation,
    fetchData,
    fetchAllData
  };
}; 