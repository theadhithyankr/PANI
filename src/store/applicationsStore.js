import { create } from 'zustand';
import { supabase } from '../clients/supabaseClient';

const useApplicationsStore = create((set, get) => ({
  // State
  applications: [],
  matchedJobs: [],
  offers: [],
  invitations: [],
  loading: {
    applications: false,
    matchedJobs: false,
    offers: false,
    invitations: false
  },
  error: {
    applications: null,
    matchedJobs: null,
    offers: null,
    invitations: null
  },
  filters: {
    searchTerm: '',
    statusFilter: 'all',
    activeTab: 'applications'
  },
  selectedApplication: null,
  showDetailPanel: false,
  isInitialized: false,
  lastApplicantId: null,

  // Actions
  setLoading: (key, loading) => 
    set(state => ({
      loading: { ...state.loading, [key]: loading }
    })),

  setError: (key, error) => 
    set(state => ({
      error: { ...state.error, [key]: error }
    })),

  setFilters: (filters) => 
    set(state => ({
      filters: { ...state.filters, ...filters }
    })),

  setSelectedApplication: (application) => 
    set({ selectedApplication: application }),

  setShowDetailPanel: (show) => 
    set({ showDetailPanel: show }),

  // Interview-related actions
  joinInterview: (applicationId) => {
    const state = get();
    const application = state.applications.find(app => app.id === applicationId);
    
    if (application?.interview?.meetingLink) {
      window.open(application.interview.meetingLink, '_blank');
      return true;
    } else {
      console.log('No meeting link available for application:', applicationId);
      return false;
    }
  },

  getInterviewForApplication: (applicationId) => {
    const state = get();
    const application = state.applications.find(app => app.id === applicationId);
    return application?.interview || null;
  },

  updateInterviewStatus: async (interviewId, status) => {
    try {
      const { error } = await supabase
        .from('interviews_v2')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', interviewId);

      if (error) throw error;

      // Update the local state
      const state = get();
      const updatedApplications = state.applications.map(app => {
        if (app.interview?.id === interviewId) {
          return {
            ...app,
            interview: {
              ...app.interview,
              status
            }
          };
        }
        return app;
      });

      set({ applications: updatedApplications });
      return true;
    } catch (err) {
      console.error('Error updating interview status:', err);
      return false;
    }
  },

  refreshApplicationInterview: async (applicationId) => {
    try {
      const { data, error } = await supabase
        .from('interviews_v2')
        .select(`
          id,
          interview_type,
          interview_format,
          location,
          interview_date,
          duration_minutes,
          notes,
          status,
          application_status,
          feedback,
          rating,
          meeting_link,
          agenda,
          reminder_sent,
          interviewer:interviewer_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('application_id', applicationId)
        .eq('status', 'scheduled')
        .order('interview_date', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      // Update the local state
      const state = get();
      const updatedApplications = state.applications.map(app => {
        if (app.id === applicationId) {
          let interview = null;
          if (data) {
            const interviewDate = new Date(data.interview_date);
            interview = {
              id: data.id,
              date: interviewDate.toISOString().split('T')[0],
              time: interviewDate.toTimeString().split(' ')[0].substring(0, 5),
              duration: data.duration_minutes || 60,
              type: data.interview_type,
              format: data.interview_format,
              platform: data.interview_format === 'video' ? 'Video Call' : 
                       data.interview_format === 'phone' ? 'Phone Call' : 'In Person',
              location: data.location,
              meetingLink: data.meeting_link,
              agenda: data.agenda,
              notes: data.notes,
              status: data.status,
              application_status: data.application_status, // Include application status
              round: data.interview_type === '1st_interview' ? 1 : 
                     data.interview_type === 'technical' ? 2 :
                     data.interview_type === 'hr_interview' ? 3 :
                     data.interview_type === 'final' ? 4 : 1,
              totalRounds: 4,
              canReschedule: data.status === 'scheduled',
              instructions: data.agenda || 'Please prepare for the interview and have your portfolio ready.',
              interviewer: data.interviewer ? {
                id: data.interviewer.id,
                name: data.interviewer.full_name || 'Interviewer',
                title: 'Hiring Manager',
                avatar: data.interviewer.avatar_url || '/default-avatar.png',
                bio: 'Experienced hiring professional.',
                linkedin: `https://linkedin.com/in/${data.interviewer.full_name?.toLowerCase().replace(/\s+/g, '-')}`
              } : null
            };
          }
          return { ...app, interview };
        }
        return app;
      });

      set({ applications: updatedApplications });
      return true;
    } catch (err) {
      console.error('Error refreshing application interview:', err);
      return false;
    }
  },

  hasUpcomingInterview: (applicationId) => {
    const state = get();
    const application = state.applications.find(app => app.id === applicationId);
    if (!application?.interview) return false;
    
    const interviewDate = new Date(application.interview.date + 'T' + application.interview.time);
    const now = new Date();
    return interviewDate > now && application.interview.status === 'scheduled';
  },

  // Fetch job applications using NEW UNIFIED STRUCTURE
  fetchApplications: async (applicantId, profile = null) => {
    if (!applicantId) {
      console.warn('No applicantId provided for fetchApplications');
      set({ applications: [] });
      return;
    }

    // Prevent multiple simultaneous fetches
    if (get().loading.applications) return;

    get().setLoading('applications', true);
    get().setError('applications', null);

    try {
      console.log('Fetching applications for applicantId:', applicantId);
      
      // Fetch applications using the NEW UNIFIED STRUCTURE
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications_v2')
        .select(`
          id,
          job_id,
          applicant_id,
          cover_note,
          ai_match_score,
          status,
          application_date,
          updated_at,
          resume_id,
          cover_letter_id,
          additional_document_ids,
          availability_date,
          salary_expectation,
          visa_status,
          motivation,
          custom_questions,
          employer_notes,
          jobs:job_id (
            id,
            title,
            location,
            job_type,
            salary_range,
            is_remote,
            companies:company_id (
              id,
              name,
              logo_url
            )
          ),
          interviews:interviews_v2!application_id (
            id,
            interview_type,
            interview_format,
            location,
            interview_date,
            duration_minutes,
            notes,
            status,
            application_status,
            feedback,
            rating,
            meeting_link,
            agenda,
            reminder_sent,
            interviewer:interviewer_id (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('applicant_id', applicantId)
        .order('application_date', { ascending: false });

      if (applicationsError) throw applicationsError;

      console.log('Fetched applications count:', applicationsData?.length || 0);

      // Additional security check - ensure all applications belong to the user
      const userApplications = (applicationsData || []).filter(app => app.applicant_id === applicantId);
      
      if (userApplications.length !== (applicationsData || []).length) {
        console.warn('Security warning: Some applications do not belong to the current user');
      }

      // Map applications to a flat structure for easier UI use
      const mappedApplications = userApplications.map(app => {
        // Process interview data if available
        let interview = null;
        let allInterviews = [];
        if (app.interviews && app.interviews.length > 0) {
          // Transform all interviews to the expected format
          allInterviews = app.interviews.map(interviewData => {
            const interviewDate = new Date(interviewData.interview_date);
            return {
              id: interviewData.id,
              date: interviewDate.toISOString().split('T')[0], // YYYY-MM-DD format
              time: interviewDate.toTimeString().split(' ')[0].substring(0, 5), // HH:MM format
              duration: interviewData.duration_minutes || 60, // Updated to match backend field name
              type: interviewData.interview_type,
              format: interviewData.interview_format,
              platform: interviewData.interview_format === 'video' ? 'Video Call' : 
                       interviewData.interview_format === 'phone' ? 'Phone Call' : 'In Person',
              location: interviewData.location, // Updated to match backend field name
              meetingLink: interviewData.meeting_link,
              agenda: interviewData.agenda,
              notes: interviewData.interview_notes, // Updated to match backend field name
              status: interviewData.status,
              application_status: interviewData.application_status, // Include application status
              round: interviewData.interview_type === '1st_interview' ? 1 : 
                     interviewData.interview_type === 'technical' ? 2 :
                     interviewData.interview_type === 'hr_interview' ? 3 :
                     interviewData.interview_type === 'final' ? 4 : 1,
              totalRounds: 4, // This could be dynamic based on job requirements
              canReschedule: interviewData.status === 'scheduled',
              instructions: interviewData.agenda || 'Please prepare for the interview and have your portfolio ready.',
              interviewer: interviewData.interviewer ? {
                id: interviewData.interviewer.id,
                name: interviewData.interviewer.full_name || 'Interviewer',
                title: 'Hiring Manager',
                avatar: interviewData.interviewer.avatar_url || '/default-avatar.png',
                bio: 'Experienced hiring professional.',
                linkedin: `https://linkedin.com/in/${interviewData.interviewer.full_name?.toLowerCase().replace(/\s+/g, '-')}`
              } : null
            };
          });

          // Get the most recent scheduled interview for the main interview field
          const latestScheduledInterview = allInterviews
            .filter(interview => interview.status === 'scheduled')
            .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time))[0];
          
          interview = latestScheduledInterview || allInterviews[0]; // Fallback to first interview if no scheduled ones
        }

        // Determine application status - consider both application status and interview application_status
        let applicationStatus = app.status;
        
        // Check if any interview has a more specific application status (hired, offered, rejected)
        if (allInterviews && allInterviews.length > 0) {
          // Find the most recent interview with a specific application status
          const interviewWithStatus = allInterviews
            .filter(interview => interview.application_status && 
                   ['hired', 'offered', 'rejected', 'withdrawn'].includes(interview.application_status))
            .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time))[0];
          
          if (interviewWithStatus) {
            applicationStatus = interviewWithStatus.application_status;
          }
        }
        
        // Handle rescheduled interviews
        if (interview && interview.status === 'rescheduled' && app.status === 'interviewing') {
          applicationStatus = 'reviewing'; // Rescheduled interviews show as "reviewing" (waiting for company)
        }

        return {
          id: app.id,
          jobId: app.job_id,
          applicantId: app.applicant_id, // Keep track of applicant ID for security
          status: applicationStatus,
          appliedDate: app.application_date,
          updatedAt: app.updated_at,
          coverNote: app.cover_note,
          matchScore: app.ai_match_score,
          jobTitle: app.jobs?.title || '',
          jobType: app.jobs?.job_type || '',
          location: app.jobs?.location || (app.jobs?.is_remote ? 'Remote' : ''),
          salary: app.jobs?.salary_range ?
            (typeof app.jobs.salary_range === 'object' && app.jobs.salary_range.min && app.jobs.salary_range.max ?
              `€${app.jobs.salary_range.min} - €${app.jobs.salary_range.max}` :
              app.jobs.salary_range) : '',
          company: app.jobs?.companies?.name || '',
          companyLogo: app.jobs?.companies?.logo_url || '/default-company-logo.png',
          interview: interview, // Include interview data
          allInterviews: allInterviews, // Include all interviews for the application
          // New fields from updated schema
          documents: {
            resumeId: app.resume_id,
            coverLetterId: app.cover_letter_id,
            additionalDocumentIds: app.additional_document_ids || []
          },
          jobSpecific: {
            availabilityDate: app.availability_date,
            salaryExpectation: app.salary_expectation,
            visaStatus: app.visa_status,
            motivation: app.motivation
          },
          customQuestions: app.custom_questions || {},
          employerNotes: app.employer_notes || '',
          // Document information for display
          resumeFileName: app.resume?.file_name,
          resumeFileSize: app.resume?.file_size,
          coverLetterFileName: app.cover_letter?.file_name,
          coverLetterFileSize: app.cover_letter?.file_size
        };
      });

      // Set applications (no direct interviews anymore)
      const allApplications = mappedApplications;
      
      // Sort by date (most recent first)
      allApplications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

      set({ applications: allApplications });
    } catch (err) {
      console.error('Error fetching applications:', err);
      get().setError('applications', err.message || 'Failed to fetch applications');
      set({ applications: [] });
    } finally {
      get().setLoading('applications', false);
    }
  },

  // Fetch AI matched jobs
  fetchMatchedJobs: async (applicantId, profile = null) => {
    if (!applicantId) {
      set({ matchedJobs: [] });
      return;
    }

    // Prevent multiple simultaneous fetches
    if (get().loading.matchedJobs) return;

    get().setLoading('matchedJobs', true);
    get().setError('matchedJobs', null);

    try {
      // Get jobs that match the user's preferences
      let query = supabase
        .from('jobs')
        .select(`
          id,
          title,
          location,
          job_type,
          salary_range,
          is_remote,
          experience_level,
          skills_required,
          description,
          created_at,
          companies:company_id (
            id,
            name,
            logo_url,
            industry,
            size
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply filters based on user preferences
      if (profile) {
        // Filter by job type if specified
        if (profile.preferred_job_types && profile.preferred_job_types.length > 0) {
          query = query.in('job_type', profile.preferred_job_types);
        }

        // Filter by location preferences
        if (profile.preferred_locations && profile.preferred_locations.length > 0) {
          const locationFilter = profile.preferred_locations.map(loc => 
            `location.ilike.%${loc}%`
          ).join(',');
          query = query.or(locationFilter);
        }

        // Filter by remote preference
        if (profile.willing_to_relocate === false) {
          query = query.eq('is_remote', true);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Calculate match scores and sort by relevance
      const jobsWithScores = (data || []).map(job => {
        let matchScore = 50; // Base score

        // Calculate score based on various factors
        if (profile) {
          // Skills match
          if (profile.skills && job.skills_required) {
            const userSkills = profile.skills.map(s => s.toLowerCase());
            const jobSkills = job.skills_required.map(s => s.toLowerCase());
            const skillMatches = userSkills.filter(skill => 
              jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
            );
            const skillScore = (skillMatches.length / Math.max(userSkills.length, jobSkills.length)) * 30;
            matchScore += skillScore;
          }

          // Experience level match
          if (profile.experience_years && job.experience_level) {
            const experienceMatch = Math.max(0, 20 - Math.abs(profile.experience_years - job.experience_level));
            matchScore += experienceMatch;
          }

          // Location preference match
          if (profile.preferred_locations && job.location) {
            const locationMatch = profile.preferred_locations.some(loc => 
              job.location.toLowerCase().includes(loc.toLowerCase())
            );
            if (locationMatch) matchScore += 10;
          }

          // Remote preference match
          if (profile.willing_to_relocate === false && job.is_remote) {
            matchScore += 10;
          }
        }

        return {
          id: job.id,
          title: job.title,
          location: job.location,
          jobType: job.job_type,
          salary: job.salary_range ?
            (typeof job.salary_range === 'object' && job.salary_range.min && job.salary_range.max ?
              `€${job.salary_range.min} - €${job.salary_range.max}` :
              job.salary_range) : '',
          isRemote: job.is_remote,
          experienceLevel: job.experience_level,
          requiredSkills: job.skills_required || [],
          description: job.description,
          createdAt: job.created_at,
          company: job.companies?.name || '',
          companyLogo: job.companies?.logo_url || '/default-company-logo.png',
          companyIndustry: job.companies?.industry || '',
          companySize: job.companies?.size || '',
          matchScore: Math.round(matchScore)
        };
      });

      // Sort by match score (highest first) and take top 12
      const sortedJobs = jobsWithScores
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 12);

      set({ matchedJobs: sortedJobs });
    } catch (err) {
      get().setError('matchedJobs', err.message || 'Failed to fetch matched jobs');
      set({ matchedJobs: [] });
    } finally {
      get().setLoading('matchedJobs', false);
    }
  },

  // Fetch candidate invitations using NEW UNIFIED STRUCTURE
  fetchInvitations: async (applicantId) => {
    if (!applicantId) {
      console.warn('No applicantId provided for fetchInvitations');
      set({ invitations: [] });
      return;
    }

    // Prevent multiple simultaneous fetches
    if (get().loading.invitations) return;

    get().setLoading('invitations', true);
    get().setError('invitations', null);

    try {
      console.log('Fetching invitations for applicantId:', applicantId);
      
      // Fetch invitations from the NEW UNIFIED STRUCTURE
      const query = supabase
        .from('job_applications_v2')
        .select(`
          id,
          job_id,
          status,
          application_date,
          updated_at,
          jobs:job_id (
            id,
            title,
            location,
            job_type,
            salary_range,
            is_remote,
            description,
            companies:company_id (
              id,
              name,
              logo_url,
              industry
            )
          )
        `)
        .eq('applicant_id', applicantId)
        .eq('status', 'invited')
        .order('application_date', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log('Fetched invitations count:', data?.length || 0);

      // Additional security check - ensure all invitations belong to the user
      const userInvitations = (data || []).filter(app => app.applicant_id === applicantId);
      
      if (userInvitations.length !== (data || []).length) {
        console.warn('Security warning: Some invitations do not belong to the current user');
      }

      // Transform invitations to application-like structure for consistency
      const mappedInvitations = userInvitations.map(app => ({
        id: app.id,
        jobId: app.job_id,
        applicantId: app.applicant_id,
        status: 'invited',
        appliedDate: app.application_date,
        updatedAt: app.updated_at,
        coverNote: `Invitation from ${app.jobs?.companies?.name || 'employer'}`,
        matchScore: null, // No match score for invitations
        jobTitle: app.jobs?.title || '',
        jobType: app.jobs?.job_type || '',
        location: app.jobs?.location || (app.jobs?.is_remote ? 'Remote' : ''),
        salary: app.jobs?.salary_range ?
          (typeof app.jobs.salary_range === 'object' && 
           app.jobs.salary_range.min && app.jobs.salary_range.max ?
            `€${app.jobs.salary_range.min} - €${app.jobs.salary_range.max}` :
            app.jobs.salary_range) : '',
        company: app.jobs?.companies?.name || '',
        companyLogo: app.jobs?.companies?.logo_url || '/default-company-logo.png',
        isInvitation: true, // Mark as invitation
        documents: {
          resumeId: null,
          coverLetterId: null,
          additionalDocumentIds: []
        },
        jobSpecific: {
          availabilityDate: null,
          salaryExpectation: null,
          visaStatus: null,
          motivation: null
        },
        customQuestions: {},
        resumeFileName: null,
        resumeFileSize: null,
        coverLetterFileName: null,
        coverLetterFileSize: null
      }));

      set({ invitations: mappedInvitations });
    } catch (err) {
      console.error('Error fetching invitations:', err);
      get().setError('invitations', err.message || 'Failed to fetch invitations');
      set({ invitations: [] });
    } finally {
      get().setLoading('invitations', false);
    }
  },

  // Accept invitation and create interview
  acceptInvitation: async (invitationId, applicantId) => {
    if (!invitationId || !applicantId) {
      console.error('Missing required parameters for acceptInvitation');
      return false;
    }

    try {
      console.log('Accepting invitation:', invitationId);
      
      // Update the application status to accepted
      const { error: updateError } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('applicant_id', applicantId); // Security check

      if (updateError) throw updateError;

      // Note: Interview will be created by the employer after acceptance
      // Candidates cannot create interviews due to RLS policies
      // The employer will schedule the interview and the candidate will see it

      // Refresh invitations and applications to reflect the change
      await Promise.all([
        get().fetchInvitations(applicantId),
        get().fetchApplications(applicantId)
      ]);

      return { success: true };
    } catch (err) {
      console.error('Error accepting invitation:', err);
      get().setError('invitations', err.message || 'Failed to accept invitation');
      return false;
    }
  },

  // Decline invitation
  declineInvitation: async (invitationId, applicantId) => {
    if (!invitationId || !applicantId) {
      console.error('Missing required parameters for declineInvitation');
      return false;
    }

    try {
      console.log('Declining invitation:', invitationId);
      
      const { error: updateError } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('applicant_id', applicantId); // Security check

      if (updateError) throw updateError;

      // Refresh invitations to reflect the change
      await get().fetchInvitations(applicantId);

      return { success: true };
    } catch (err) {
      console.error('Error declining invitation:', err);
      get().setError('invitations', err.message || 'Failed to decline invitation');
      return false;
    }
  },

  // Fetch offers using NEW UNIFIED STRUCTURE
  fetchOffers: async (applicantId) => {
    if (!applicantId) {
      console.warn('No applicantId provided for fetchOffers');
      set({ offers: [] });
      return;
    }

    // Prevent multiple simultaneous fetches
    if (get().loading.offers) return;

    get().setLoading('offers', true);
    get().setError('offers', null);

    try {
      console.log('Fetching offers for applicantId:', applicantId);
      
      // Fetch offers from job_applications with status 'offered'
      const { data, error: fetchError } = await supabase
        .from('job_applications_v2')
        .select(`
          id,
          job_id,
          applicant_id,
          status,
          application_date,
          updated_at,
          jobs:job_id (
            id,
            title,
            location,
            job_type,
            salary_range,
            is_remote,
            companies:company_id (
              id,
              name,
              logo_url
            )
          )
        `)
        .eq('applicant_id', applicantId)
        .eq('status', 'offered')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      console.log('Fetched offers count:', data?.length || 0);

      // Additional security check - ensure all offers belong to the user
      const userOffers = (data || []).filter(app => app.applicant_id === applicantId);
      
      if (userOffers.length !== (data || []).length) {
        console.warn('Security warning: Some offers do not belong to the current user');
      }

      // Map to offer structure
      const mappedOffers = userOffers.map(app => ({
        id: app.id,
        applicantId: app.applicant_id, // Keep track of applicant ID for security
        position: app.jobs?.title || '',
        companyName: app.jobs?.companies?.name || '',
        companyLogo: app.jobs?.companies?.logo_url || '/default-company-logo.png',
        status: 'pending', // Default status
        offerDate: app.updated_at,
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        compensation: {
          baseSalary: app.jobs?.salary_range?.min || 50000,
          currency: 'EUR',
          benefits: ['Health Insurance', 'Pension Plan', 'Flexible Working Hours']
        },
        relocationPackage: {
          included: true,
          details: 'Relocation assistance provided'
        },
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        notes: 'We are excited to offer you this position based on your excellent interview performance.'
      }));

      set({ offers: mappedOffers });
    } catch (err) {
      console.error('Error fetching offers:', err);
      get().setError('offers', err.message || 'Failed to fetch offers');
      set({ offers: [] });
    } finally {
      get().setLoading('offers', false);
    }
  },

  // Update offer status
  updateOfferStatus: async (offerId, newStatus, applicantId) => {
    if (!offerId || !newStatus || !applicantId) {
      console.error('Missing required parameters for updateOfferStatus');
      return false;
    }

    try {
      console.log(`Updating offer ${offerId} status to ${newStatus}`);
      
      // Update the offer status in the database
      const { error: updateError } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: newStatus === 'accepted' ? 'accepted' : 
                 newStatus === 'declined' ? 'declined' : 
                 newStatus === 'negotiating' ? 'negotiating' : 'offered',
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .eq('applicant_id', applicantId); // Security check

      if (updateError) throw updateError;

      // Update the local state
      set(state => ({
        offers: state.offers.map(offer => 
          offer.id === offerId 
            ? { ...offer, status: newStatus }
            : offer
        )
      }));

      console.log(`Successfully updated offer ${offerId} status to ${newStatus}`);
      return true;
    } catch (err) {
      console.error('Error updating offer status:', err);
      get().setError('offers', err.message || 'Failed to update offer status');
      return false;
    }
  },

  // Fetch all data
  fetchAllData: async (applicantId, profile = null) => {
    // Prevent multiple simultaneous fetches
    if (get().isInitialized && applicantId === get().lastApplicantId) {
      return;
    }

    set({ isInitialized: true, lastApplicantId: applicantId });

    await Promise.all([
      get().fetchApplications(applicantId, profile),
      get().fetchMatchedJobs(applicantId, profile),
      get().fetchOffers(applicantId),
      get().fetchInvitations(applicantId)
    ]);
  },

  // Clear all data
  clearData: () => {
    set({
      applications: [],
      matchedJobs: [],
      offers: [],
      invitations: [],
      selectedApplication: null,
      showDetailPanel: false,
      isInitialized: false,
      lastApplicantId: null,
      filters: {
        searchTerm: '',
        statusFilter: 'all',
        activeTab: 'applications'
      }
    });
  },

  // Reset store to initial state
  reset: () => {
    set({
      applications: [],
      matchedJobs: [],
      offers: [],
      invitations: [],
      loading: {
        applications: false,
        matchedJobs: false,
        offers: false,
        invitations: false
      },
      error: {
        applications: null,
        matchedJobs: null,
        offers: null,
        invitations: null
      },
      filters: {
        searchTerm: '',
        statusFilter: 'all',
        activeTab: 'applications'
      },
      selectedApplication: null,
      showDetailPanel: false,
      isInitialized: false,
      lastApplicantId: null
    });
  },

  // Debug function to verify data isolation
  verifyDataIsolation: (expectedApplicantId) => {
    const state = get();
    const { applications, offers } = state;
    
    // Check applications
    const invalidApplications = applications.filter(app => app.applicantId !== expectedApplicantId);
    if (invalidApplications.length > 0) {
      console.error('SECURITY ISSUE: Found applications not belonging to current user:', invalidApplications);
      return false;
    }
    
    // Check offers
    const invalidOffers = offers.filter(offer => offer.applicantId !== expectedApplicantId);
    if (invalidOffers.length > 0) {
      console.error('SECURITY ISSUE: Found offers not belonging to current user:', invalidOffers);
      return false;
    }
    
    console.log('✅ Data isolation verified - all data belongs to user:', expectedApplicantId);
    return true;
  }
}));

export default useApplicationsStore;