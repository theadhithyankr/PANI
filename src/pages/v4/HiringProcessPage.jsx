import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import { useJobPost, useMatchedCandidates } from '../../hooks/employer';
import toast from 'react-hot-toast';
import { supabase } from '../../clients/supabaseClient';
import useGlobalStore from '../../stores/globalStore';
import useEmailNotifications from '../../hooks/common/useEmailNotifications';

// Import step components
import JobDetailsStep from '../../components/hiring/JobDetailsStep';
import RecommendedCandidatesStep from '../../components/hiring/RecommendedCandidatesStep';
import AppliedCandidatesStep from '../../components/hiring/AppliedCandidatesStep';
import InvitedCandidatesStep from '../../components/hiring/InvitedCandidatesStep';
import InterviewingStep from '../../components/hiring/InterviewingStep';
import HiringStep from '../../components/hiring/HiringStep';
import OnboardingStep from '../../components/hiring/OnboardingStep';
import CandidateDetailPanel from '../../components/employer/CandidateDetailPanel';
import InterviewSchedulingModal from '../../components/hiring/InterviewSchedulingModal';

const HiringProcessPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [favoritesCandidates, setFavoritesCandidates] = useState([]);
  const [jobData, setJobData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appliedCandidates, setAppliedCandidates] = useState([]);
  const [loadingAppliedCandidates, setLoadingAppliedCandidates] = useState(false);
  const [totalApplicationsCount, setTotalApplicationsCount] = useState(0);
const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [invitedCandidates, setInvitedCandidates] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [hiredCandidates, setHiredCandidates] = useState([]);
  const [loadingHiredCandidates, setLoadingHiredCandidates] = useState(false);
  const [interviewDetails, setInterviewDetails] = useState({
    date: '',
    time: '',
    type: '1st_interview',
    format: 'video',
    duration: 60,
    location: '',
    agenda: '',
    interviewer: ''
  });
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    feedback: '',
    rating: null
  });
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState(null);
  const [showHireConfirmationModal, setShowHireConfirmationModal] = useState(false);
  const [candidateToHire, setCandidateToHire] = useState(null);
  const [showRejectConfirmationModal, setShowRejectConfirmationModal] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState(null);
  const [showMarkCompletedModal, setShowMarkCompletedModal] = useState(false);
  const [interviewToMarkCompleted, setInterviewToMarkCompleted] = useState(null);
  const [showCancelInterviewModal, setShowCancelInterviewModal] = useState(false);
  const [interviewToCancel, setInterviewToCancel] = useState(null);
  const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);
  const [offerLetterFile, setOfferLetterFile] = useState(null);
  const [uploadingOfferLetter, setUploadingOfferLetter] = useState(false);
  const [onboardingCandidates, setOnboardingCandidates] = useState([]);
  const [loadingOnboardingCandidates, setLoadingOnboardingCandidates] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [isMigrationRunning, setIsMigrationRunning] = useState(false);
  const [candidateForMigration, setCandidateForMigration] = useState(null);
  const [migrationSourceStep, setMigrationSourceStep] = useState(null);
  
  const { getJobById } = useJobPost();
  const { candidates: matchedCandidates, loading: candidatesLoading, fetchMatchedCandidates } = useMatchedCandidates();
  const { sendInterviewScheduledNotification } = useEmailNotifications();
  
  // Get user and company from global store
  const user = useGlobalStore((state) => state.user);
  const company = useGlobalStore((state) => state.company);

  // Set default interviewer when user is available
  useEffect(() => {
    if (user?.id && !interviewDetails.interviewer) {
      setInterviewDetails(prev => ({ ...prev, interviewer: user.id }));
    }
  }, [user?.id, interviewDetails.interviewer]);

  // Fetch job data and matched candidates when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch job data and matched candidates in parallel
        const [job] = await Promise.all([
          getJobById(jobId),
          fetchMatchedCandidates(),
          fetchTotalApplicationsCount(),
          fetchShortlistedCandidates()
        ]);
        
        setJobData(job);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        toast.error('Failed to load job details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [jobId]); // Remove getJobById from dependencies

  // Function to fetch invited candidates
  const fetchInvitedCandidates = async () => {
    if (!jobId || !user?.id) return;
    
    setLoadingInvitations(true);
    try {
    // Use the new unified job_applications table with more detailed candidate info
    const { data, error } = await supabase
      .from('job_applications_v2')
      .select(`
        *,
        applicant:profiles!job_applications_v2_applicant_id_fkey (
          id,
          full_name,
          avatar_url,
          phone,
          email_verified,
          phone_verified,
          job_seeker_profiles (
            id,
            headline,
            summary,
            experience_years,
            current_location,
            skills,
            ai_generated_summary
          )
        )
      `)
      .eq('job_id', jobId)
      .in('status', ['invited', 'accepted', 'declined'])
      .order('application_date', { ascending: false });

      if (error) throw error;

      // Get list of candidates who have scheduled interviews or have been hired
      const { data: scheduledInterviews, error: interviewError } = await supabase
        .from('interviews_v2')
        .select('application_id')
        .eq('job_id', jobId)
        .in('status', ['scheduled', 'interviewing', 'completed', 'hired']);

      if (interviewError) {
        console.error('Error fetching scheduled interviews:', interviewError);
      }

      const scheduledApplicationIds = new Set(scheduledInterviews?.map(interview => interview.application_id) || []);

      // Transform the data to match the expected format and filter out candidates with scheduled interviews
      const transformedInvitations = data
        .filter(invitation => !scheduledApplicationIds.has(invitation.id))
        .map(invitation => {
          const jobSeekerProfile = invitation.applicant?.job_seeker_profiles?.[0]; // Get first job seeker profile
          
          return {
            id: invitation.applicant?.id || invitation.id, // Use applicant ID as primary ID
            candidateId: invitation.applicant_id,
            name: invitation.applicant?.full_name || 'Unknown Candidate',
            title: jobSeekerProfile?.headline || 'Software Developer',
            location: jobSeekerProfile?.current_location || 'Location not specified',
            experience: jobSeekerProfile?.experience_years 
              ? `${jobSeekerProfile.experience_years} years` 
              : 'Experience not specified',
            status: invitation.status,
            invitedDate: invitation.application_date || invitation.created_at,
            skills: jobSeekerProfile?.skills || [],
            summary: jobSeekerProfile?.ai_generated_summary || 
                     jobSeekerProfile?.summary || 
                     'No summary available',
            response: invitation.response,
            applicationId: invitation.id // Add application ID for interview scheduling
          };
        });

      setInvitedCandidates(transformedInvitations);
    } catch (error) {
      console.error('Error fetching invited candidates:', error);
      setError('Failed to fetch invited candidates');
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Function to fetch total applications count
  const fetchTotalApplicationsCount = async () => {
    if (!jobId) return;

    try {
      const { count, error } = await supabase
        .from('job_applications_v2')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);

      if (error) throw error;
      setTotalApplicationsCount(count);
    } catch (error) {
      console.error('Error fetching total applications count:', error);
    }
  };

  // Function to fetch shortlisted candidates
  const fetchShortlistedCandidates = async () => {
    if (!jobId) return;

    try {
      const { data, error } = await supabase
        .from('job_applications_v2')
        .select(`
          *,
          applicant:profiles!job_applications_v2_applicant_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified,
            job_seeker_profiles (
              id,
              headline,
              summary,
              experience_years,
              current_location,
              skills,
              ai_generated_summary
            )
          )
        `)
        .eq('job_id', jobId)
        .eq('status', 'shortlisted');

      if (error) throw error;

      const transformedShortlisted = data.map(application => {
        const jobSeekerProfile = application.applicant?.job_seeker_profiles?.[0];
        return {
          ...application.applicant,
          application_id: application.id,
          status: application.status,
          headline: jobSeekerProfile?.headline || 'No headline available',
          summary: jobSeekerProfile?.summary || 'No summary available',
        };
      });
      setShortlistedCandidates(transformedShortlisted);
    } catch (error) {
      console.error('Error fetching shortlisted candidates:', error);
      setError('Failed to fetch shortlisted candidates');
    }
  };

  // Function to fetch applied candidates
  const fetchAppliedCandidates = async () => {
    if (!jobId || !user?.id) return;
    
    setLoadingAppliedCandidates(true);
    try {
      // Fetch candidates who applied for this job
      const { data, error } = await supabase
        .from('job_applications_v2')
        .select(`
          *,
          applicant:profiles!job_applications_v2_applicant_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified,
            job_seeker_profiles (
              id,
              headline,
              summary,
              experience_years,
              current_location,
              skills,
              ai_generated_summary
            )
          )
        `)
        .eq('job_id', jobId)
        .in('status', ['applied', 'reviewing', 'shortlisted', 'offered', 'hired', 'rejected', 'withdrawn', 'expired'])
        .order('application_date', { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedAppliedCandidates = data.map(application => {
        const jobSeekerProfile = application.applicant?.job_seeker_profiles?.[0];
        
        return {
          id: application.applicant?.id || application.id,
          candidateId: application.applicant_id,
          name: application.applicant?.full_name || 'Unknown Candidate',
          title: jobSeekerProfile?.headline || 'Software Developer',
          location: jobSeekerProfile?.current_location || 'Location not specified',
          experience: jobSeekerProfile?.experience_years 
            ? `${jobSeekerProfile.experience_years} years` 
            : 'Experience not specified',
          status: application.status,
          appliedDate: application.application_date || application.created_at,
          skills: jobSeekerProfile?.skills || [],
          summary: jobSeekerProfile?.ai_generated_summary || 
                   jobSeekerProfile?.summary || 
                   'No summary available',
          coverLetter: application.cover_note || 'No cover letter provided',
          matchScore: application.ai_match_score || 0,
          applicationId: application.id,
          // Additional fields from the database schema
          internalRating: application.internal_rating,
          salaryExpectation: application.salary_expectation,
          availabilityDate: application.availability_date,
          visaStatus: application.visa_status,
          motivation: application.motivation,
          employerNotes: application.employer_notes,
          customQuestions: application.custom_questions || {},
          response: application.response,
          resumeId: application.resume_id,
          coverLetterId: application.cover_letter_id,
          additionalDocumentIds: application.additional_document_ids || [],
          updatedAt: application.updated_at
        };
      });

      console.log('Fetched applied candidates:', transformedAppliedCandidates.length, 'candidates');
      console.log('Status breakdown:', transformedAppliedCandidates.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}));
      
      setAppliedCandidates(transformedAppliedCandidates);
    } catch (error) {
      console.error('Error fetching applied candidates:', error);
      setError('Failed to fetch applied candidates');
    } finally {
      setLoadingAppliedCandidates(false);
    }
  };

  // Fetch applied candidates for this job
  useEffect(() => {
    fetchAppliedCandidates();
  }, [jobId, user?.id]);

  // Fetch invited candidates for this job
  useEffect(() => {
    fetchInvitedCandidates();
  }, [jobId, user?.id]);

  // Function to fetch hired candidates
  const fetchHiredCandidates = async () => {
    if (!jobId || !user?.id) return;
    
    setLoadingHiredCandidates(true);
    try {
      // First, get all hired interviews for this job
      const { data: hiredInterviews, error: interviewError } = await supabase
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
          feedback,
          rating,
          meeting_link,
          agenda,
          reminder_sent,
          seeker_id,
          interviewer_id,
          updated_at,
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url,
            phone
          ),
          interviewer:profiles!interviews_v2_interviewer_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('job_id', jobId)
        .eq('application_status', 'hired')
        .order('updated_at', { ascending: false }); // Order by when they were hired

      if (interviewError) throw interviewError;

      console.log('Fetched hired interviews:', hiredInterviews);
      console.log('Number of hired interviews found:', hiredInterviews?.length || 0);

      // Transform the data to match the expected format
      const transformedHiredCandidates = hiredInterviews.map(interview => {
        const interviewDate = new Date(interview.interview_date);
        
        return {
          id: interview.id,
          candidateId: interview.seeker_id,
          name: interview.seeker_profile?.full_name || 'Unknown',
          title: interview.seeker_profile?.headline || 'Software Developer',
          interviewDate: interviewDate.toISOString(),
          interviewType: interview.interview_type === '1st_interview' ? 'Initial' :
                        interview.interview_type === 'technical' ? 'Technical' :
                        interview.interview_type === 'hr_interview' ? 'HR' :
                        interview.interview_type === 'final' ? 'Final' : 'Interview',
          interviewer: interview.interviewer?.full_name || 'Interviewer',
          status: interview.status,
          format: interview.interview_format,
          location: interview.location || (interview.interview_format === 'video' ? 'Video Call' : 'TBD'),
          duration: `${interview.duration_minutes || 60} minutes`,
          agenda: interview.agenda || 'Interview to discuss the role and your background',
          feedback: interview.feedback || null,
          rating: interview.rating || null,
          meetingLink: interview.meeting_link || null,
          notes: interview.notes || null,
          hiredDate: interview.updated_at || new Date().toISOString()
        };
      });

      setHiredCandidates(transformedHiredCandidates);
    } catch (err) {
      console.error('Error fetching hired candidates:', err);
      toast.error('Failed to load hired candidates');
    } finally {
      setLoadingHiredCandidates(false);
    }
  };

  // Function to fetch interviews
  const fetchInterviews = async () => {
    if (!jobId || !user?.id) return;
    
    setLoadingInterviews(true);
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
          seeker_id,
          interviewer_id,
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url,
            phone
          ),
          interviewer:profiles!interviews_v2_interviewer_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('job_id', jobId)
        .neq('application_status', 'hired') // Exclude hired candidates from interviews list
        .order('interview_date', { ascending: true });

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedInterviews = data.map(interview => {
        const interviewDate = new Date(interview.interview_date);
        
        return {
          id: interview.id,
          candidateId: interview.seeker_id,
          name: interview.seeker_profile?.full_name || 'Unknown',
          title: interview.seeker_profile?.headline || 'Software Developer',
          interviewDate: interviewDate.toISOString(),
          interviewType: interview.interview_type === '1st_interview' ? 'Initial' :
                        interview.interview_type === 'technical' ? 'Technical' :
                        interview.interview_type === 'hr_interview' ? 'HR' :
                        interview.interview_type === 'final' ? 'Final' : 'Interview',
          interviewer: interview.interviewer?.full_name || 'Interviewer',
          status: interview.status,
          format: interview.interview_format,
          location: interview.location || (interview.interview_format === 'video' ? 'Video Call' : 'TBD'),
          duration: `${interview.duration_minutes || 60} minutes`,
          agenda: interview.agenda || 'Interview to discuss the role and your background',
          feedback: interview.feedback || null,
          rating: interview.rating || null,
          meetingLink: interview.meeting_link || null,
          notes: interview.notes || null
        };
      });

      console.log('Fetched interviews:', transformedInterviews.length, 'interviews');
      
      setInterviews(transformedInterviews);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      toast.error('Failed to load interviews');
    } finally {
      setLoadingInterviews(false);
    }
  };

  // Fetch interviews for this job
  useEffect(() => {
    fetchInterviews();
  }, [jobId, user?.id]);

  // Fetch hired candidates for this job
  useEffect(() => {
    fetchHiredCandidates();
  }, [jobId, user?.id]);

  const steps = [
    { id: 1, name: 'Job Details', description: 'Review and edit job posting', count: null },
    { id: 2, name: 'Recommended', description: 'AI-matched candidates', count: matchedCandidates.length },
    { id: 3, name: 'Applied', description: 'Candidates who applied', count: appliedCandidates.length },
    { id: 4, name: 'Invited', description: 'Candidates you\'ve invited', count: invitedCandidates.length },
    { id: 5, name: 'Interviewing', description: 'Active interviews', count: interviews.length },
    { id: 6, name: 'Hiring', description: 'Offers and decisions', count: hiredCandidates.length },
    { id: 7, name: 'Onboarding', description: 'New hire process', count: onboardingCandidates.length },
  ];

  // Navigate to edit job page (reuse JobsPage edit flow)
  const handleEditJob = () => {
    if (!jobData) return;
    // Navigate to create job page with edit state
    navigate('/dashboard/employer/jobs/create', { state: { editJob: jobData } });
  };

  // Transform fetched job data to match expected format
  const transformedJobData = jobData ? {
    title: jobData.title,
    company: jobData.companies?.name || 'Company',
    location: jobData.location,
    type: jobData.job_type,
    salary: jobData.salary_range ? `${jobData.salary_range.min} - ${jobData.salary_range.max} ${jobData.salary_range.currency}` : 'Not specified',
    description: jobData.description,
    requirements: jobData.requirements && typeof jobData.requirements === 'string' 
      ? jobData.requirements.split('\n').filter(r => r.trim() !== '') 
      : [],
    benefits: Array.isArray(jobData.benefits) 
      ? jobData.benefits 
      : jobData.benefits && typeof jobData.benefits === 'string'
        ? jobData.benefits.split('\n').filter(b => b.trim() !== '')
        : []
  } : null;

  // Filter and transform matched candidates for this specific job
  const recommendedCandidates = matchedCandidates
    .filter(candidate => {
      // Filter candidates that match this specific job
      if (jobData && candidate.bestJobMatch) {
        return candidate.bestJobMatch.id === jobId;
      }
      return true; // Show all candidates if no specific job match
    })
    .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score
    .slice(0, 10) // Limit to top 10 candidates
    .map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      title: candidate.headline || 'Software Developer',
      location: candidate.current_location || 'Unknown',
      matchScore: candidate.matchScore || 0,
      avatar: candidate.avatar,
      skills: candidate.skills || [],
      experience: `${candidate.experience_years || 0} years`,
      currentCompany: candidate.current_company || 'Unknown',
      summary: candidate.ai_generated_summary || candidate.summary || 'No summary available.'
    }));

  // Dynamic interviewing candidates from real interview data
  const interviewingCandidates = interviews;

  const hiringCandidates = [
    {
      id: 5,
      name: 'Emily Davis',
      title: 'Frontend Engineer',
      status: 'offer_sent',
      offerDate: '2024-01-16',
      salary: '$140,000',
      deadline: '2024-01-23'
    },
    {
      id: 6,
      name: 'Michael Brown',
      title: 'Senior Developer',
      status: 'accepted',
      offerDate: '2024-01-10',
      acceptedDate: '2024-01-12',
      salary: '$155,000'
    },
    {
      id: 7,
      name: 'Lisa Wilson',
      title: 'Frontend Developer',
      status: 'rejected',
      offerDate: '2024-01-08',
      rejectedDate: '2024-01-11',
      reason: 'Accepted another offer'
    }
  ];

  // Onboarding candidates state (replace hardcoded sample)
  // const [onboardingCandidates, setOnboardingCandidates] = useState([]);
  // const [loadingOnboardingCandidates, setLoadingOnboardingCandidates] = useState(false);

  // Fetch candidates who are hired for this job and display them in onboarding
  const fetchOnboardingCandidates = async () => {
    if (!jobId || !user?.id) return;

    setLoadingOnboardingCandidates(true);
    try {
      const { data, error } = await supabase
        .from('interviews_v2')
        .select(`
          id,
          interview_type,
          interview_date,
          seeker_id,
          application_status,
          seeker_profile:profiles!interviews_v2_seeker_id_fkey (
            id,
            full_name,
            avatar_url,
            onboarding_complete
          )
        `)
        .eq('job_id', jobId)
        .eq('application_status', 'hired')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map((row) => {
        const isCompleted = !!row.seeker_profile?.onboarding_complete;
        const interviewDate = row.interview_date ? new Date(row.interview_date) : new Date();

        // Build a simple timeline indicating current onboarding state
        const timeline = [
          { step: 'Offer Accepted', completed: true, date: interviewDate.toISOString() },
          { step: 'Background Check', completed: !isCompleted, inProgress: !isCompleted },
          { step: isCompleted ? 'Onboarding Completed' : 'Equipment Setup', completed: isCompleted, inProgress: false }
        ];

        return {
          id: row.id,
          candidateId: row.seeker_id,
          name: row.seeker_profile?.full_name || 'Unknown',
          title: 'Hired Candidate',
          startDate: interviewDate.toISOString(),
          visaStatus: isCompleted ? 'approved' : 'in_progress',
          documents: isCompleted ? ['signed_offer', 'i9_form'] : ['signed_offer'],
          timeline
        };
      });

      setOnboardingCandidates(transformed);
    } catch (err) {
      console.error('Error fetching onboarding candidates:', err);
      toast.error('Failed to load onboarding candidates');
    } finally {
      setLoadingOnboardingCandidates(false);
    }
  };

  // Load onboarding candidates
  useEffect(() => {
    fetchOnboardingCandidates();
  }, [jobId, user?.id]);

  // Realtime updates for onboarding candidates list
  useEffect(() => {
    if (!jobId || !user?.id) return;

    // Listen for changes to interviews for this job (e.g., status transitions)
    const interviewsChannel = supabase
      .channel(`onboarding-interviews-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interviews_v2',
          filter: `job_id=eq.${jobId}`
        },
        () => {
          // Refetch list on any interview change for this job
          fetchOnboardingCandidates();
        }
      )
      .subscribe();

    // Listen for changes to profiles (to catch onboarding_complete updates)
    const profilesChannel = supabase
      .channel('onboarding-profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Refetch when a profile updates; joined field onboarding_complete may have changed
          fetchOnboardingCandidates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(interviewsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [jobId, user?.id]);

  // Event handlers
  const toggleFavorite = (candidateId) => {
    setFavoritesCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // Get available interviewers from the company
  const getAvailableInterviewers = async () => {
    if (!company?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('employer_profiles')
        .select(`
          id,
          position,
          profiles!employer_profiles_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('company_id', company.id);

      if (error) throw error;

      return data.map(employer => ({
        id: employer.id,
        name: employer.profiles?.full_name || 'Unknown',
        position: employer.position || 'Team Member',
        avatar: employer.profiles?.avatar_url
      }));
    } catch (err) {
      console.error('Error fetching interviewers:', err);
      return [];
    }
  };

  // Open interview scheduling modal
  const openInterviewModal = async (candidate) => {
    if (!jobId || !user?.id) {
      toast.error('Missing required information for invitation');
      return;
    }

    // Check if candidate already has an application for this job
    const { data: existingApplication } = await supabase
      .from('job_applications_v2')
      .select('id, status')
      .eq('job_id', jobId)
      .eq('applicant_id', candidate.candidateId || candidate.id)
      .maybeSingle();

    if (existingApplication) {
      // If already invited, show error
      if (existingApplication.status === 'invited') {
        toast.error('Candidate has already been invited. Please wait for them to accept.');
        return;
      }
      // If accepted, allow scheduling interview
      if (existingApplication.status === 'accepted') {
        console.log('Candidate has accepted invitation - proceeding with interview scheduling');
        setSelectedCandidate(candidate);
        setShowInterviewModal(true);
        return;
      }
      // If in other status (applied, reviewing, shortlisted, etc.), 
      // we can still send an invitation which will update the existing record
      console.log('Existing application found with status:', existingApplication.status, '- proceeding with invitation');
    }

    setSelectedCandidate(candidate);
    setShowInterviewModal(true);
  };

  // Removed candidate email lookups; notifications will be sent only to employer here

  // Helper: send scheduled/rescheduled interview notifications
  const sendInterviewNotifications = async ({
    interviewId,
    interviewDateISO,
    interviewFormat,
    durationMinutes,
    locationOrLink
  }) => {
    try {
      const interviewDate = new Date(interviewDateISO);
      const formattedDate = interviewDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = interviewDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const jobTitle = jobData?.title || 'Position';
      const companyName = jobData?.companies?.name || 'Company';
      const candidateName = 'Candidate';
      const interviewerName = user?.user_metadata?.full_name || user?.email || 'Interviewer';
      const interviewTypeLabel = interviewFormat === 'video' ? 'Video Call' : interviewFormat === 'phone' ? 'Phone Call' : 'In-person';

      // Employer/interviewer email
      if (user?.email) {
        await sendInterviewScheduledNotification({
          to: user.email,
          recipientType: 'employer',
          jobTitle,
          companyName,
          candidateName,
          interviewerName,
          interviewDate: formattedDate,
          interviewTime: formattedTime,
          interviewLocation: locationOrLink || 'To be confirmed',
          interviewType: interviewTypeLabel,
          interviewDuration: `${durationMinutes} minutes`,
          interviewUrl: `${window.location.origin}/interviews/${interviewId}`,
          jobUrl: `${window.location.origin}/jobs/${jobId}`
        });
      }
    } catch (emailError) {
      console.error('Failed to send interview notification emails:', emailError);
      // Do not block main flows on email failure
    }
  };

  // Send invitation with interview details OR schedule interview for accepted candidate
  const sendInvitationWithInterview = async () => {
    if (!selectedCandidate || !jobId || !user?.id) {
      toast.error('Missing required information');
      return;
    }

    if (!interviewDetails.date || !interviewDetails.time) {
      toast.error('Please select interview date and time');
      return;
    }

    try {
      // Combine date and time
      const interviewDateTime = new Date(`${interviewDetails.date}T${interviewDetails.time}`);
      
      // Check the candidate's current application status
      const { data: existingApplication } = await supabase
        .from('job_applications_v2')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('applicant_id', selectedCandidate.candidateId || selectedCandidate.id)
        .maybeSingle();

      // If candidate has accepted invitation, schedule interview
      if (existingApplication && existingApplication.status === 'accepted') {
        await scheduleInterviewForAcceptedCandidate(selectedCandidate);
        return;
      }
      
      // Check if this is an applied candidate (has existing application) or new invitation
      const isAppliedCandidate = selectedCandidate.applicationId;
      
      if (isAppliedCandidate) {
        // For applied candidates, create interview directly and update application status
        const interviewData = {
          job_id: jobId,
          seeker_id: selectedCandidate.candidateId,
          application_id: selectedCandidate.applicationId, // Link interview to application
          interviewer_id: interviewDetails.interviewer,
          interview_type: interviewDetails.type,
          interview_format: interviewDetails.format,
          location: interviewDetails.location, // Backend expects location column
          interview_date: interviewDateTime.toISOString(),
          duration_minutes: interviewDetails.duration, // Backend expects duration_minutes
          agenda: interviewDetails.agenda,
          status: 'scheduled'
        };

        const { data: newInterview, error: interviewError } = await supabase
          .from('interviews_v2')
          .insert(interviewData)
          .select()
          .single();

        if (interviewError) throw interviewError;

        // Send notifications (non-blocking)
        sendInterviewNotifications({
          interviewId: newInterview.id,
          interviewDateISO: interviewData.interview_date,
          interviewFormat: interviewDetails.format,
          durationMinutes: interviewDetails.duration,
          locationOrLink: interviewDetails.location || null
        });

        // Update the application status to interviewing
        const { error: updateError } = await supabase
          .from('job_applications_v2')
          .update({ 
            status: 'interviewing',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedCandidate.applicationId);

        if (updateError) {
          console.error('Error updating application status:', updateError);
          // Don't throw error here, interview was created successfully
        } else {
          console.log('Successfully updated application status to interviewing for:', selectedCandidate.name);
        }

        toast.success('Interview scheduled successfully!');
        
        // Refresh both applied candidates and interviews data
        await Promise.all([
          fetchAppliedCandidates(),
          fetchInterviews()
        ]);
        
        // Move to interviewing step to show the scheduled interview
        setCurrentStep(5); // Move to interviewing step
        
      } else {
        // For new candidates (not applied), send invitation with interview details
        // Use upsert to handle existing applications gracefully
        const { data: invitationData, error: invitationError } = await supabase
          .from('job_applications_v2')
          .upsert({
            job_id: jobId,
            applicant_id: selectedCandidate.id,
            status: 'invited',
            response: JSON.stringify({
              interview_date: interviewDateTime.toISOString(),
              interview_type: interviewDetails.type,
              interview_format: interviewDetails.format,
              duration_minutes: interviewDetails.duration, // Backend expects duration_minutes
              location: interviewDetails.location, // Backend expects location column
              agenda: interviewDetails.agenda,
              interviewer_id: interviewDetails.interviewer
            }),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'job_id,applicant_id'
          })
          .select()
          .single();

        if (invitationError) throw invitationError;

        toast.success('Invitation sent! Candidate will receive interview details after accepting.');
        
        // Refresh invited candidates list
        const { data: newInvitation } = await supabase
          .from('job_applications_v2')
          .select(`
            *,
            candidate:profiles!job_applications_v2_applicant_id_fkey (
              id,
              full_name,
              avatar_url,
              phone
            )
          `)
          .eq('id', invitationData.id)
          .single();

        if (newInvitation) {
          const transformedInvitation = {
            id: newInvitation.candidate?.id,
            candidateId: newInvitation.applicant_id,
            name: newInvitation.candidate?.full_name || 'Unknown',
            title: 'Software Developer', // Default since we don't have headline in this query
            invitedDate: newInvitation.created_at,
            status: newInvitation.status,
            response: newInvitation.response,
            location: 'Location not specified', // Default since we don't have location in this query
            experience: 'Experience not specified', // Default since we don't have experience in this query
            skills: [], // Default empty array
            summary: 'No summary available' // Default since we don't have summary in this query
          };

          setInvitedCandidates(prev => [transformedInvitation, ...prev]);
        }
      }

      // Close modal and reset form
      setShowInterviewModal(false);
      setSelectedCandidate(null);
      setInterviewDetails({
        date: '',
        time: '',
        type: '1st_interview',
        format: 'video',
        duration: 60,
        location: '',
        agenda: '',
        interviewer: user?.id || ''
      });

    } catch (err) {
      console.error('Error scheduling interview:', err);
      toast.error('Failed to schedule interview');
    }
  };

  // Schedule interview for accepted candidate
  const scheduleInterviewForAcceptedCandidate = async (candidate) => {
    if (!candidate || !jobId || !user?.id) {
      toast.error('Missing required information for interview scheduling');
      return;
    }

    if (!interviewDetails.date || !interviewDetails.time) {
      toast.error('Please select interview date and time');
      return;
    }

    try {
      // Combine date and time
      const interviewDateTime = new Date(`${interviewDetails.date}T${interviewDetails.time}`);
      
      // Create the interview record for the accepted candidate
      const interviewData = {
        job_id: jobId,
        seeker_id: candidate.candidateId || candidate.id,
        application_id: candidate.applicationId, // Link interview to application
        interviewer_id: interviewDetails.interviewer,
        interview_type: interviewDetails.type,
        interview_format: interviewDetails.format,
        location: interviewDetails.location, // Backend expects location column
        interview_date: interviewDateTime.toISOString(),
        duration_minutes: interviewDetails.duration, // Backend expects duration_minutes
        agenda: interviewDetails.agenda,
        status: 'scheduled'
      };

      const { data: newInterview, error: interviewError } = await supabase
        .from('interviews_v2')
        .insert(interviewData)
        .select()
        .single();

      if (interviewError) throw interviewError;

      // Send notifications (non-blocking)
      sendInterviewNotifications({
        interviewId: newInterview.id,
        interviewDateISO: interviewData.interview_date,
        interviewFormat: interviewDetails.format,
        durationMinutes: interviewDetails.duration,
        locationOrLink: interviewDetails.location || null
      });

      // Update the application status to interviewing
      const { error: updateError } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'interviewing',
          updated_at: new Date().toISOString()
        })
        .eq('job_id', jobId)
        .eq('applicant_id', candidate.candidateId || candidate.id);

      if (updateError) {
        console.error('Error updating application status:', updateError);
        // Don't throw error here, interview was created successfully
      }

      toast.success('Interview scheduled successfully!');
      
      // Refresh both invited candidates and interviews data
      await Promise.all([
        fetchInvitedCandidates(),
        fetchInterviews()
      ]);
      
      // Move to interviewing step to show the scheduled interview
      setCurrentStep(5); // Move to interviewing step
      
    } catch (err) {
      console.error('Error scheduling interview:', err);
      toast.error('Failed to schedule interview');
    }
  };

  // Send direct invitation without interview details
  const sendDirectInvitation = async (candidateId) => {
    const candidate = recommendedCandidates.find(c => c.id === candidateId);
    if (!candidate || !jobId || !user?.id) {
      toast.error('Missing required information for invitation');
      return;
    }

    try {
      // Check if candidate already has an application for this job
      const { data: existingApplication } = await supabase
        .from('job_applications_v2')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('applicant_id', candidate.id)
        .maybeSingle();

      if (existingApplication) {
        // If already invited or accepted, show error
        if (['invited', 'accepted'].includes(existingApplication.status)) {
          toast.error('Candidate has already been invited and is in active status');
          return;
        }
        // If in other status, update to invited
        const { error: updateError } = await supabase
          .from('job_applications_v2')
          .update({ 
            status: 'invited',
            response: JSON.stringify({
              message: 'You have been invited to apply for this position. We will contact you soon to discuss next steps.'
            })
          })
          .eq('id', existingApplication.id);

        if (updateError) throw updateError;

        toast.success('Invitation sent successfully!');
        fetchInvitedCandidates();
        return;
      }

      // Insert basic invitation without interview details
      const { data: invitationData, error: invitationError } = await supabase
        .from('job_applications_v2')
        .insert({
          job_id: jobId,
          applicant_id: candidate.id,
          status: 'invited',
          response: JSON.stringify({
            message: 'You have been invited to apply for this position. We will contact you soon to discuss next steps.'
          })
        })
        .select()
        .single();

      if (invitationError) throw invitationError;

      toast.success('Invitation sent successfully!');
      
      // Refresh invited candidates list
      const { data: newInvitation } = await supabase
        .from('job_applications_v2')
        .select(`
          *,
          candidate:profiles!job_applications_v2_applicant_id_fkey (
            id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('id', invitationData.id)
        .single();

      if (newInvitation) {
        const transformedInvitation = {
          id: newInvitation.candidate?.id,
          candidateId: newInvitation.applicant_id,
          name: newInvitation.candidate?.full_name || 'Unknown',
          title: 'Software Developer', // Default since we don't have headline in this query
          invitedDate: newInvitation.created_at,
          status: newInvitation.status,
          response: newInvitation.response,
          location: 'Location not specified', // Default since we don't have location in this query
          experience: 'Experience not specified', // Default since we don't have experience in this query
          skills: [], // Default empty array
          summary: 'No summary available' // Default since we don't have summary in this query
        };

        setInvitedCandidates(prev => [transformedInvitation, ...prev]);
      }

      // Optionally move to invited candidates step
      setCurrentStep(3);

    } catch (err) {
      console.error('Error sending invitation:', err);
      toast.error('Failed to send invitation');
    }
  };

  // Check if a candidate can be re-invited
  const canReinviteCandidate = async (candidateId) => {
    try {
      // Check for any active invitations
      const { data: activeInvitation } = await supabase
        .from('job_applications_v2')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('applicant_id', candidateId)
        .in('status', ['invited', 'accepted'])
        .maybeSingle();

      if (activeInvitation) {
        return false; // Has active invitation
      }

      // Check if candidate has been hired for this job
      const { data: hiredInterview } = await supabase
        .from('interviews_v2')
        .select('id')
        .eq('job_id', jobId)
        .eq('seeker_id', candidateId)
        .eq('status', 'hired')
        .maybeSingle();

      if (hiredInterview) {
        return false; // Already hired
      }

      return true; // Can be re-invited
    } catch (error) {
      console.error('Error checking if candidate can be re-invited:', error);
      return false;
    }
  };

  // Legacy function for backward compatibility
  const inviteCandidate = async (candidateId) => {
    await sendDirectInvitation(candidateId);
  };

  // Handle viewing profile for applied candidates
  const handleViewAppliedProfile = async (candidate) => {
    try {
      // Fetch complete candidate profile from database
      const { data: candidateProfile, error } = await supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          headline,
          summary,
          experience_years,
          current_location,
          skills,
          languages,
          target_salary_range,
          ai_generated_summary,
          preferred_job_types,
          relocation_timeline,
          profiles!job_seeker_profiles_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified
          )
        `)
        .eq('id', candidate.id)
        .single();

      if (error) {
        console.error('Error fetching candidate profile:', error);
        toast.error('Failed to load candidate profile');
        return;
      }

      // Transform the data to match the expected format
      const candidateData = {
        id: candidateProfile.id,
        name: candidateProfile.profiles?.full_name || candidate.name,
        headline: candidateProfile.headline || candidate.title,
        avatar: candidateProfile.profiles?.avatar_url || null,
        phone: candidateProfile.profiles?.phone || null,
        email_verified: candidateProfile.profiles?.email_verified || false,
        phone_verified: candidateProfile.profiles?.phone_verified || false,
        summary: candidateProfile.summary || 'No summary available',
        experience_years: candidateProfile.experience_years || 0,
        current_location: candidateProfile.current_location || 'Location not specified',
        skills: candidateProfile.skills || [],
        languages: candidateProfile.languages || [],
        target_salary_range: candidateProfile.target_salary_range || null,
        ai_generated_summary: candidateProfile.ai_generated_summary || null,
        preferred_job_types: candidateProfile.preferred_job_types || [],
        relocation_timeline: candidateProfile.relocation_timeline || null,
        matchScore: candidate.matchScore || 0
      };
      
      setSelectedCandidateForProfile(candidateData);
      setShowProfilePanel(true);
    } catch (err) {
      console.error('Error in handleViewAppliedProfile:', err);
      toast.error('Failed to load candidate profile');
    }
  };

  // Handle messaging for applied candidates
  const handleMessageAppliedCandidate = async (candidate) => {
    try {
      // First, find the job application for this candidate and job
      const { data: application, error: appError } = await supabase
        .from('job_applications_v2')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', candidate.candidateId)
        .maybeSingle();

      if (appError) throw appError;

      if (!application) {
        toast.error('No application found for this candidate');
        return;
      }

      // Get or create conversation for this application
      const { data: conversation, error: convError } = await supabase
        .from('conversations_v2')
        .select('id')
        .eq('application_id', application.id)
        .maybeSingle();

      if (convError) throw convError;

      if (conversation) {
        // Ensure participants are added to existing conversation
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .upsert([
            {
              conversation_id: conversation.id,
              user_id: user.id, // Employer
              joined_at: new Date().toISOString()
            },
            {
              conversation_id: conversation.id,
              user_id: candidate.candidateId, // Candidate
              joined_at: new Date().toISOString()
            }
          ], {
            onConflict: 'conversation_id,user_id',
            ignoreDuplicates: true
          });

        if (participantsError) {
          console.error('Error ensuring participants in conversation:', participantsError);
        }

        // Get job data for existing conversation
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('title, companies(name)')
          .eq('id', jobId)
          .single();

        if (jobError) {
          console.error('Error fetching job data:', jobError);
        }

        // Navigate to existing conversation with candidate data
        navigate(`/dashboard/messages/${conversation.id}`, {
          state: {
            candidate: {
              id: candidate.candidateId,
              full_name: candidate.name,
              avatar_url: null
            },
            job: {
              id: jobId,
              title: jobData?.title || 'Job Application'
            }
          }
        });
      } else {
        // Create new conversation
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('title, companies(name)')
          .eq('id', jobId)
          .single();

        if (jobError) throw jobError;

        const { data: newConversation, error: createError } = await supabase
          .from('conversations_v2')
          .insert({
            application_id: application.id,
            title: `${jobData.title} - ${jobData.companies.name}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          // If it's a unique constraint violation, try to get the existing conversation
          if (createError.code === '23505' && createError.constraint === 'conversations_v2_application_id_unique') {
            console.log('Conversation already exists, fetching existing one...');
            const { data: existingConversation, error: fetchError } = await supabase
              .from('conversations_v2')
              .select('id')
              .eq('application_id', application.id)
              .single();
            
            if (fetchError) throw fetchError;
            
            // Use the existing conversation
            const conversation = existingConversation;
            
            // Ensure participants are added
            const { error: participantsError } = await supabase
              .from('conversation_participants')
              .upsert([
                {
                  conversation_id: conversation.id,
                  user_id: user.id,
                  joined_at: new Date().toISOString()
                },
                {
                  conversation_id: conversation.id,
                  user_id: candidate.candidateId,
                  joined_at: new Date().toISOString()
                }
              ], {
                onConflict: 'conversation_id,user_id',
                ignoreDuplicates: true
              });

            if (participantsError) {
              console.error('Error ensuring participants in existing conversation:', participantsError);
            }

            // Navigate to existing conversation
            navigate(`/dashboard/messages/${conversation.id}`, {
              state: {
                candidate: {
                  id: candidate.candidateId,
                  full_name: candidate.name,
                  avatar_url: null
                },
                job: {
                  id: jobId,
                  title: jobData.title
                }
              }
            });
            return;
          }
          throw createError;
        }

        // Add participants to the conversation
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert([
            {
              conversation_id: newConversation.id,
              user_id: user.id, // Employer
              joined_at: new Date().toISOString()
            },
            {
              conversation_id: newConversation.id,
              user_id: candidate.candidateId, // Candidate
              joined_at: new Date().toISOString()
            }
          ]);

        if (participantsError) {
          console.error('Error adding participants to conversation:', participantsError);
          // Don't throw error here, conversation was created successfully
        }

        // Navigate to new conversation with candidate data
        navigate(`/dashboard/messages/${newConversation.id}`, {
          state: {
            candidate: {
              id: candidate.candidateId,
              full_name: candidate.name,
              avatar_url: null
            },
            job: {
              id: jobId,
              title: jobData.title
            }
          }
        });
      }
    } catch (err) {
      console.error('Error creating/finding conversation:', err);
      toast.error('Failed to open conversation');
    }
  };

  // Handle rejecting an applied candidate
  const handleRejectAppliedCandidate = async (candidate) => {
    try {
      const { error } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.applicationId);

      if (error) throw error;

      toast.success(`${candidate.name} has been rejected.`);
      await fetchAppliedCandidates(); // Refresh the applied candidates list
    } catch (err) {
      console.error('Error rejecting candidate:', err);
      toast.error('Failed to reject candidate');
    }
  };

  // Handle moving applied candidate to under review
  const handleMoveToReview = async (candidate) => {
    try {
      const { error } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'reviewing',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.applicationId);

      if (error) throw error;

      toast.success(`${candidate.name} moved to reviewing.`);
      await fetchAppliedCandidates(); // Refresh the applied candidates list
    } catch (err) {
      console.error('Error moving candidate to review:', err);
      toast.error('Failed to move candidate to review');
    }
  };

  // Handle shortlisting a candidate
  const handleShortlistCandidate = async (candidate) => {
    try {
      const { error } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'shortlisted',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.applicationId);

      if (error) throw error;

      toast.success(`${candidate.name} has been shortlisted.`);
      await fetchAppliedCandidates(); // Refresh the applied candidates list
    } catch (err) {
      console.error('Error shortlisting candidate:', err);
      toast.error('Failed to shortlist candidate');
    }
  };

  // Handle moving candidate to interviewing status
  const handleMoveToInterviewing = async (candidate) => {
    try {
      const { error } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'interviewing',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.applicationId);

      if (error) throw error;

      toast.success(`${candidate.name} moved to interviewing stage.`);
      await fetchAppliedCandidates(); // Refresh the applied candidates list
    } catch (err) {
      console.error('Error moving candidate to interviewing:', err);
      toast.error('Failed to move candidate to interviewing');
    }
  };

  // Handle offering a position to candidate
  const handleOfferPosition = async (candidate) => {
    try {
      const { error } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'offered',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.applicationId);

      if (error) throw error;

      toast.success(`Offer sent to ${candidate.name}.`);
      await fetchAppliedCandidates(); // Refresh the applied candidates list
    } catch (err) {
      console.error('Error offering position to candidate:', err);
      toast.error('Failed to offer position to candidate');
    }
  };

  // Interview management functions
  const handleRescheduleInterview = (interview) => {
    setSelectedInterview(interview);
    // Pre-fill the form with current interview details
    const interviewDate = new Date(interview.interviewDate);
    // Map display label back to DB enum
    const mapDisplayToDbType = (label) => {
      switch ((label || '').toLowerCase()) {
        case 'initial':
          return '1st_interview';
        case 'technical':
          return 'technical';
        case 'hr':
          return 'hr_interview';
        case 'final':
          return 'final';
        default:
          return '1st_interview';
      }
    };
    setInterviewDetails({
      date: interviewDate.toISOString().split('T')[0],
      time: interviewDate.toTimeString().split(' ')[0].substring(0, 5),
      type: mapDisplayToDbType(interview.interviewType),
      format: interview.format,
      duration: parseInt(interview.duration),
      location: interview.location,
      agenda: interview.agenda,
      interviewer: user?.id || ''
    });
    setShowRescheduleModal(true);
  };

  const handleCancelInterview = (interview) => {
    setInterviewToCancel(interview);
    setShowCancelInterviewModal(true);
  };

  const confirmCancelInterview = async () => {
    if (!interviewToCancel) return;

    try {
      const { error } = await supabase
        .from('interviews_v2')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewToCancel.id);

      if (error) throw error;

      toast.success('Interview cancelled successfully!');
      await fetchInterviews(); // Refresh the interviews list
      
      // Close the modal
      setShowCancelInterviewModal(false);
      setInterviewToCancel(null);
    } catch (err) {
      console.error('Error cancelling interview:', err);
      toast.error('Failed to cancel interview');
    }
  };

  const handleViewProfile = async (interview) => {
    try {
      // Fetch complete candidate profile from database
      const { data: candidateProfile, error } = await supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          headline,
          summary,
          experience_years,
          current_location,
          skills,
          languages,
          target_salary_range,
          ai_generated_summary,
          preferred_job_types,
          relocation_timeline,
          profiles!job_seeker_profiles_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified
          )
        `)
        .eq('id', interview.candidateId)
        .single();

      if (error) {
        console.error('Error fetching candidate profile:', error);
        toast.error('Failed to load candidate profile');
        return;
      }

      // Transform the data to match the expected format
      const candidateData = {
        id: candidateProfile.id,
        name: candidateProfile.profiles?.full_name || interview.name,
        headline: candidateProfile.headline || interview.title,
        avatar: candidateProfile.profiles?.avatar_url || null,
        phone: candidateProfile.profiles?.phone || null,
        email_verified: candidateProfile.profiles?.email_verified || false,
        phone_verified: candidateProfile.profiles?.phone_verified || false,
        summary: candidateProfile.summary || 'No summary available',
        experience_years: candidateProfile.experience_years || 0,
        current_location: candidateProfile.current_location || 'Location not specified',
        skills: candidateProfile.skills || [],
        languages: candidateProfile.languages || [],
        target_salary_range: candidateProfile.target_salary_range || null,
        ai_generated_summary: candidateProfile.ai_generated_summary || null,
        preferred_job_types: candidateProfile.preferred_job_types || [],
        relocation_timeline: candidateProfile.relocation_timeline || null,
        matchScore: 0
      };
      
      setSelectedCandidateForProfile(candidateData);
      setShowProfilePanel(true);
    } catch (err) {
      console.error('Error in handleViewProfile:', err);
      toast.error('Failed to load candidate profile');
    }
  };

  const handleCloseProfilePanel = () => {
    setShowProfilePanel(false);
    setTimeout(() => setSelectedCandidateForProfile(null), 300);
  };

  // Handle viewing profile for invited candidates
  const handleViewInvitedProfile = async (candidate) => {
    try {
      // Fetch complete candidate profile from database
      const { data: candidateProfile, error } = await supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          headline,
          summary,
          experience_years,
          current_location,
          skills,
          languages,
          target_salary_range,
          ai_generated_summary,
          preferred_job_types,
          relocation_timeline,
          profiles!job_seeker_profiles_id_fkey (
            id,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified
          )
        `)
        .eq('id', candidate.candidateId)
        .single();

      if (error) {
        console.error('Error fetching candidate profile:', error);
        toast.error('Failed to load candidate profile');
        return;
      }

      // Transform the data to match the expected format
      const candidateData = {
        id: candidateProfile.id,
        name: candidateProfile.profiles?.full_name || candidate.name,
        headline: candidateProfile.headline || candidate.title,
        avatar: candidateProfile.profiles?.avatar_url || null,
        phone: candidateProfile.profiles?.phone || null,
        email_verified: candidateProfile.profiles?.email_verified || false,
        phone_verified: candidateProfile.profiles?.phone_verified || false,
        summary: candidateProfile.summary || 'No summary available',
        experience_years: candidateProfile.experience_years || 0,
        current_location: candidateProfile.current_location || 'Location not specified',
        skills: candidateProfile.skills || [],
        languages: candidateProfile.languages || [],
        target_salary_range: candidateProfile.target_salary_range || null,
        ai_generated_summary: candidateProfile.ai_generated_summary || null,
        preferred_job_types: candidateProfile.preferred_job_types || [],
        relocation_timeline: candidateProfile.relocation_timeline || null,
        matchScore: 0
      };
      
      setSelectedCandidateForProfile(candidateData);
      setShowProfilePanel(true);
    } catch (err) {
      console.error('Error in handleViewInvitedProfile:', err);
      toast.error('Failed to load candidate profile');
    }
  };

  // Handle messaging for invited candidates
  const handleMessageInvitedCandidate = async (candidate) => {
    try {
      // First, find the job application for this candidate and job
      const { data: application, error: appError } = await supabase
        .from('job_applications_v2')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', candidate.candidateId)
        .maybeSingle();

      if (appError) throw appError;

      if (!application) {
        toast.error('No application found for this candidate');
        return;
      }

      // Get or create conversation for this application
      const { data: conversation, error: convError } = await supabase
        .from('conversations_v2')
        .select('id')
        .eq('application_id', application.id)
        .maybeSingle();

      if (convError) throw convError;

      if (conversation) {
        // Ensure participants are added to existing conversation
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .upsert([
            {
              conversation_id: conversation.id,
              user_id: user.id, // Employer
              joined_at: new Date().toISOString()
            },
            {
              conversation_id: conversation.id,
              user_id: candidate.candidateId, // Candidate
              joined_at: new Date().toISOString()
            }
          ], {
            onConflict: 'conversation_id,user_id',
            ignoreDuplicates: true
          });

        if (participantsError) {
          console.error('Error ensuring participants in conversation:', participantsError);
        }

        // Get job data for existing conversation
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('title, companies(name)')
          .eq('id', jobId)
          .single();

        if (jobError) {
          console.error('Error fetching job data:', jobError);
        }

        // Navigate to existing conversation with candidate data
        navigate(`/dashboard/messages/${conversation.id}`, {
          state: {
            candidate: {
              id: candidate.candidateId,
              full_name: candidate.name,
              avatar_url: null // We don't have avatar in invited candidates data
            },
            job: {
              id: jobId,
              title: jobData?.title || 'Job Application'
            }
          }
        });
      } else {
        // Create new conversation
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('title, companies(name)')
          .eq('id', jobId)
          .single();

        if (jobError) throw jobError;

        const { data: newConversation, error: createError } = await supabase
          .from('conversations_v2')
          .insert({
            application_id: application.id,
            title: `${jobData.title} - ${jobData.companies.name}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          // If it's a unique constraint violation, try to get the existing conversation
          if (createError.code === '23505' && createError.constraint === 'conversations_v2_application_id_unique') {
            console.log('Conversation already exists, fetching existing one...');
            const { data: existingConversation, error: fetchError } = await supabase
              .from('conversations_v2')
              .select('id')
              .eq('application_id', application.id)
              .single();
            
            if (fetchError) throw fetchError;
            
            // Use the existing conversation
            const conversation = existingConversation;
            
            // Ensure participants are added
            const { error: participantsError } = await supabase
              .from('conversation_participants')
              .upsert([
                {
                  conversation_id: conversation.id,
                  user_id: user.id,
                  joined_at: new Date().toISOString()
                },
                {
                  conversation_id: conversation.id,
                  user_id: candidate.candidateId,
                  joined_at: new Date().toISOString()
                }
              ], {
                onConflict: 'conversation_id,user_id',
                ignoreDuplicates: true
              });

            if (participantsError) {
              console.error('Error ensuring participants in existing conversation:', participantsError);
            }

            // Navigate to existing conversation
            navigate(`/dashboard/messages/${conversation.id}`, {
              state: {
                candidate: {
                  id: candidate.candidateId,
                  full_name: candidate.name,
                  avatar_url: null
                },
                job: {
                  id: jobId,
                  title: jobData.title
                }
              }
            });
            return;
          }
          throw createError;
        }

        // Add participants to the conversation
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert([
            {
              conversation_id: newConversation.id,
              user_id: user.id, // Employer
              joined_at: new Date().toISOString()
            },
            {
              conversation_id: newConversation.id,
              user_id: candidate.candidateId, // Candidate
              joined_at: new Date().toISOString()
            }
          ]);

        if (participantsError) {
          console.error('Error adding participants to conversation:', participantsError);
          // Don't throw error here, conversation was created successfully
        }

        // Navigate to new conversation with candidate data
        navigate(`/dashboard/messages/${newConversation.id}`, {
          state: {
            candidate: {
              id: candidate.candidateId,
              full_name: candidate.name,
              avatar_url: null // We don't have avatar in invited candidates data
            },
            job: {
              id: jobId,
              title: jobData.title
            }
          }
        });
      }
    } catch (err) {
      console.error('Error creating/finding conversation:', err);
      toast.error('Failed to open conversation');
    }
  };

  const handleAddFeedback = (interview) => {
    setSelectedInterview(interview);
    setFeedbackData({
      feedback: interview.feedback || '',
      rating: interview.rating || null
    });
    setShowFeedbackModal(true);
  };

  const handleHireCandidate = (interview) => {
    setCandidateToHire(interview);
    setShowOfferLetterModal(true);
  };

  // Handle offer letter file selection
  const handleOfferLetterFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, or DOCX file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setOfferLetterFile(file);
    }
  };

  // Handle offer letter upload and hiring
  const handleOfferLetterUpload = async () => {
    if (!candidateToHire) return;
    
    if (!offerLetterFile) {
      toast.error('Please select an offer letter to upload');
      return;
    }

    setUploadingOfferLetter(true);
    
    try {
      // Simulate file upload for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update interview application status to hired
      console.log('Updating interview status to hired for interview ID:', candidateToHire.id);
      const { error: interviewError } = await supabase
        .from('interviews_v2')
        .update({ 
          application_status: 'hired', // This is the key field for hiring status
          status: 'completed', // Mark interview as completed
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateToHire.id);

      if (interviewError) {
        console.error('Error updating interview status:', interviewError);
        throw interviewError;
      }
      
      console.log('Successfully updated interview status to hired');

      // TODO: In real implementation, upload file to storage bucket
      // For demo, we'll just simulate the upload
      console.log('Offer letter uploaded:', {
        fileName: offerLetterFile.name,
        fileSize: offerLetterFile.size,
        fileType: offerLetterFile.type,
        candidateId: candidateToHire.candidateId,
        candidateName: candidateToHire.name
      });

      toast.success(`${candidateToHire.name} has been hired! Offer letter uploaded successfully.`);
      
      // Refresh data
      await Promise.all([
        fetchInterviews(),
        fetchHiredCandidates()
      ]);
      
      // Close modal and reset state
      setShowOfferLetterModal(false);
      setCandidateToHire(null);
      setOfferLetterFile(null);
      
      // Move to hiring step
      setCurrentStep(6); // Move to hiring step
      console.log('Moving to hiring step after hiring candidate');
      
    } catch (err) {
      console.error('Error hiring candidate:', err);
      toast.error('Failed to hire candidate');
    } finally {
      setUploadingOfferLetter(false);
    }
  };

  // Handle start onboarding with migration process
  const handleStartOnboarding = (candidate) => {
    setCandidateForMigration(candidate);
    setMigrationSourceStep(currentStep); // Track which step initiated the migration
    setShowMigrationModal(true);
    startMigrationProcess();
  };

  // Start the migration process simulation
  const startMigrationProcess = async () => {
    setIsMigrationRunning(true);
    setMigrationProgress(0);
    setMigrationStatus('Initializing migration process...');

    const migrationSteps = [
      { progress: 10, status: 'Connecting to Velai migration service...', delay: 1000 },
      { progress: 25, status: 'Validating candidate data...', delay: 1500 },
      { progress: 40, status: 'Setting up employee profile...', delay: 2000 },
      { progress: 60, status: 'Configuring access permissions...', delay: 1500 },
      { progress: 80, status: 'Generating onboarding documents...', delay: 2000 },
      { progress: 95, status: 'Finalizing migration...', delay: 1000 },
      { progress: 100, status: 'Migration completed successfully!', delay: 500 }
    ];

    for (const step of migrationSteps) {
      setMigrationProgress(step.progress);
      setMigrationStatus(step.status);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    // Migration completed
    setIsMigrationRunning(false);
    setMigrationStatus('Migration completed! Candidate is now ready for onboarding.');
    
    // Close modal after a short delay
    setTimeout(async () => {
      // Capture display name before clearing state to avoid undefined in toast
      const displayName =
        candidateForMigration?.profiles?.full_name ||
        candidateForMigration?.full_name ||
        candidateForMigration?.name ||
        'Candidate';

      // Navigate to onboarding section if migration was started from hiring section
      if (migrationSourceStep === 6) { // Step 6 is the hiring section
        setCurrentStep(7); // Move to onboarding section (step 7)
        toast.success(`${displayName} is now ready for onboarding. Moving to onboarding section.`);
      } else {
        toast.success(`${displayName} is now ready for onboarding.`);
      }

      // Refresh onboarding list so the candidate appears immediately
      try {
        await fetchOnboardingCandidates();
      } catch (e) {
        console.warn('Failed to refresh onboarding candidates after migration:', e);
      }

      // Now safely clear modal and migration state
      setShowMigrationModal(false);
      setCandidateForMigration(null);
      setMigrationProgress(0);
      setMigrationStatus('');
      setMigrationSourceStep(null);
    }, 2000);
  };

  const confirmHireCandidate = async () => {
    if (!candidateToHire) return;

    try {
      // Update interview application status to hired
      const { error: interviewError } = await supabase
        .from('interviews_v2')
        .update({ 
          application_status: 'hired',
          status: 'completed', // Mark interview as completed
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateToHire.id);

      if (interviewError) throw interviewError;

      // TODO: Create job application record or update existing one
      // This would typically involve creating an offer or updating application status

      toast.success(`${candidateToHire.name} has been hired!`);
      await fetchInterviews(); // Refresh the interviews list
      await fetchHiredCandidates(); // Refresh the hired candidates list
      
      // Close the modal
      setShowHireConfirmationModal(false);
      setCandidateToHire(null);
    } catch (err) {
      console.error('Error hiring candidate:', err);
      toast.error('Failed to hire candidate');
    }
  };

  const handleRejectCandidate = (interview) => {
    setCandidateToReject(interview);
    setShowRejectConfirmationModal(true);
  };

  const confirmRejectCandidate = async () => {
    if (!candidateToReject) return;

    try {
      // Update interview application status to rejected
      const { error: interviewError } = await supabase
        .from('interviews_v2')
        .update({ 
          application_status: 'rejected',
          status: 'completed', // Mark interview as completed
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateToReject.id);

      if (interviewError) throw interviewError;

      toast.success(`${candidateToReject.name} has been rejected.`);
      await fetchInterviews(); // Refresh the interviews list
      
      // Close the modal
      setShowRejectConfirmationModal(false);
      setCandidateToReject(null);
    } catch (err) {
      console.error('Error rejecting candidate:', err);
      toast.error('Failed to reject candidate');
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedInterview || !interviewDetails.date || !interviewDetails.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const interviewDateTime = new Date(`${interviewDetails.date}T${interviewDetails.time}`);
      
      const { error } = await supabase
        .from('interviews_v2')
        .update({
          interview_date: interviewDateTime.toISOString(),
          interview_type: interviewDetails.type,
          interview_format: interviewDetails.format,
          duration_minutes: interviewDetails.duration, // Backend expects duration_minutes
          location: interviewDetails.location, // Backend expects location column
          agenda: interviewDetails.agenda,
          status: 'rescheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInterview.id);

      if (error) throw error;

      toast.success('Interview rescheduled successfully!');
      // Send notifications (non-blocking)
      sendInterviewNotifications({
        interviewId: selectedInterview.id,
        interviewDateISO: interviewDateTime.toISOString(),
        interviewFormat: interviewDetails.format,
        durationMinutes: interviewDetails.duration,
        locationOrLink: interviewDetails.location || null
      });
      setShowRescheduleModal(false);
      setSelectedInterview(null);
      await fetchInterviews(); // Refresh the interviews list
    } catch (err) {
      console.error('Error rescheduling interview:', err);
      toast.error('Failed to reschedule interview');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedInterview) {
      toast.error('No interview selected');
      return;
    }

    try {
      // First, save the feedback to the interview record
      const { error: updateError } = await supabase
        .from('interviews_v2')
        .update({
          feedback: feedbackData.feedback,
          rating: feedbackData.rating,
          updated_at: new Date().toISOString()
          // Don't change the status - keep the current status
        })
        .eq('id', selectedInterview.id);

      if (updateError) throw updateError;

      // Now send the feedback as a message to the candidate
      const feedbackMessage = `📝 **Interview Feedback**\n\n**Rating:** ${feedbackData.rating}/5 ⭐\n\n**Feedback:**\n${feedbackData.feedback}`;

      // First, find the job application for this candidate and job
      const { data: application, error: appError } = await supabase
        .from('job_applications_v2')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', selectedInterview.candidateId)
        .maybeSingle();

      if (appError) throw appError;

      if (!application) {
        toast.error('No application found for this candidate');
        return;
      }

      // Get or create conversation for this application
      const { data: conversation, error: convError } = await supabase
        .from('conversations_v2')
        .select('id')
        .eq('application_id', application.id)
        .maybeSingle();

      if (convError) throw convError;

      if (conversation) {
        // Send message to existing conversation using messages_v3 table
        const { error: messageError } = await supabase
          .rpc('add_message_to_conversation', {
            p_conversation_id: conversation.id,
            p_sender_id: user.id,
            p_content: feedbackMessage,
            p_message_type: 'text'
          });

        if (messageError) throw messageError;

        // Update conversation's last_message_at
        const { error: updateConvError } = await supabase
          .from('conversations_v2')
          .update({
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversation.id);

        if (updateConvError) throw updateConvError;
      } else {
        // Create new conversation if it doesn't exist
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('title, companies(name)')
          .eq('id', jobId)
          .single();

        if (jobError) throw jobError;

        const { data: newConversation, error: createError } = await supabase
          .from('conversations_v2')
          .insert({
            application_id: application.id,
            title: `${jobData.title} - ${jobData.companies.name}`,
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          // If it's a unique constraint violation, use the existing conversation
          if (createError.code === '23505' && createError.constraint === 'conversations_v2_application_id_unique') {
            console.log('Conversation already exists for feedback, using existing one...');
            const { data: existingConversation, error: fetchError } = await supabase
              .from('conversations_v2')
              .select('id')
              .eq('application_id', application.id)
              .single();
            
            if (fetchError) throw fetchError;
            
            // Use the existing conversation for sending feedback
            const conversation = existingConversation;
            
            // Send the feedback message to existing conversation
            const { error: messageError } = await supabase
              .rpc('add_message_to_conversation', {
                p_conversation_id: conversation.id,
                p_sender_id: user.id,
                p_content: feedbackMessage,
                p_message_type: 'text'
              });

            if (messageError) throw messageError;

            // Update conversation timestamp
            const { error: updateConvError } = await supabase
              .from('conversations_v2')
              .update({
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', conversation.id);

            if (updateConvError) throw updateConvError;

            toast.success('Feedback saved and sent to candidate!');
            setShowFeedbackModal(false);
            setSelectedInterview(null);
            setFeedbackData({ feedback: '', rating: null });
            await fetchInterviews();
            return;
          }
          throw createError;
        }

        // Send the feedback message
        const { error: messageError } = await supabase
          .rpc('add_message_to_conversation', {
            p_conversation_id: newConversation.id,
            p_sender_id: user.id,
            p_content: feedbackMessage,
            p_message_type: 'text'
          });

        if (messageError) throw messageError;
      }

      toast.success('Feedback saved and sent to candidate!');
      setShowFeedbackModal(false);
      setSelectedInterview(null);
      setFeedbackData({ feedback: '', rating: null });
      await fetchInterviews(); // Refresh the interviews list
    } catch (err) {
      console.error('Error saving feedback:', err);
      toast.error('Failed to save feedback');
    }
  };

  const handleMarkInterviewCompleted = (interview) => {
    setInterviewToMarkCompleted(interview);
    setShowMarkCompletedModal(true);
  };

  const confirmMarkInterviewCompleted = async () => {
    if (!interviewToMarkCompleted) return;

    try {
      const { error } = await supabase
        .from('interviews_v2')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewToMarkCompleted.id);

      if (error) throw error;

      toast.success('Interview marked as completed!');
      await fetchInterviews(); // Refresh the interviews list
      
      // Close the modal
      setShowMarkCompletedModal(false);
      setInterviewToMarkCompleted(null);
    } catch (err) {
      console.error('Error marking interview as completed:', err);
      toast.error('Failed to mark interview as completed');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <JobDetailsStep jobData={transformedJobData} onEditJob={handleEditJob} applicationCount={totalApplicationsCount} hiredInterviewCount={hiredCandidates.length} />;
      
      case 2:
        return (
          <RecommendedCandidatesStep 
            candidates={recommendedCandidates}
            favoritesCandidates={favoritesCandidates}
            onToggleFavorite={toggleFavorite}
            onInviteCandidate={inviteCandidate}
            onViewProfile={handleViewAppliedProfile}
          />
        );
      
      case 3:
        return (
          <AppliedCandidatesStep 
            candidates={appliedCandidates}
            loading={loadingAppliedCandidates}
            onViewRecommendations={() => setCurrentStep(2)}
            onViewProfile={handleViewAppliedProfile}
            onScheduleInterview={(candidate) => {
              console.log('onScheduleInterview called with candidate:', candidate);
              console.log('Candidate applicationId:', candidate.applicationId);
              console.log('Candidate availability date:', candidate.availabilityDate);
              
              // Pre-fill interview date with candidate's availability date if available
              if (candidate.availabilityDate) {
                const availabilityDate = new Date(candidate.availabilityDate);
                const formattedDate = availabilityDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                setInterviewDetails(prev => ({
                  ...prev,
                  date: formattedDate,
                  time: '10:00' // Default time, employer can change
                }));
              } else {
                // Reset to default if no availability date
                setInterviewDetails(prev => ({
                  ...prev,
                  date: '',
                  time: ''
                }));
              }
              
              setSelectedCandidate(candidate);
              setShowInterviewModal(true);
            }}
            onMessage={handleMessageAppliedCandidate}
            onReject={handleRejectAppliedCandidate}
            onShortlist={handleShortlistCandidate}
            onMoveToInterviewing={handleMoveToInterviewing}
            onOfferPosition={handleOfferPosition}
          />
        );
      
      case 4:
        return (
          <InvitedCandidatesStep 
            candidates={invitedCandidates}
            loading={loadingInvitations}
            onViewRecommendations={() => setCurrentStep(2)}
            onViewApplied={() => setCurrentStep(3)}
            onViewProfile={handleViewInvitedProfile}
            onScheduleInterview={(candidate) => {
              setSelectedCandidate(candidate);
              setShowInterviewModal(true);
            }}
            onMessage={handleMessageInvitedCandidate}
          />
        );
      
      case 5:
        return (
          <InterviewingStep 
            candidates={interviews}
            loading={loadingInterviews}
            onViewInvited={() => setCurrentStep(4)}
            onRescheduleInterview={handleRescheduleInterview}
            onCancelInterview={handleCancelInterview}
            onViewProfile={handleViewProfile}
            onAddFeedback={handleAddFeedback}
            onHireCandidate={handleHireCandidate}
            onRejectCandidate={handleRejectCandidate}
            onMarkCompleted={handleMarkInterviewCompleted}
          />
        );
      
      case 6:
        return (
          <HiringStep 
            candidates={hiredCandidates}
            loading={loadingHiredCandidates}
            onViewInterviews={() => setCurrentStep(5)}
            onStartOnboarding={handleStartOnboarding}
            isMigrationRunning={isMigrationRunning}
          />
        );
      
      case 7:
        return (
          <OnboardingStep 
            candidates={onboardingCandidates}
            loading={loadingOnboardingCandidates}
            onViewHiring={() => setCurrentStep(6)}
            onStartOnboarding={handleStartOnboarding}
            isMigrationRunning={isMigrationRunning}
          />
        );
      
      default:
        return <div>Step not found</div>;
    }
  };

  // Show loading state
  if (isLoading || candidatesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details and candidates...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !transformedJobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load job details</p>
          <button 
            onClick={() => navigate('/dashboard/jobs')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard/jobs')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Hiring Process
                </h1>
                <p className="text-sm text-gray-500">
                  {transformedJobData?.title || 'Loading...'} • {transformedJobData?.company || 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4" aria-label="Tabs">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center font-medium transition-colors focus:outline-none ${
                  currentStep === step.id
                    ? 'text-violet-600 border-b-2 border-violet-600'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                }`}
              >
                <span className="block text-sm font-medium">{step.name}</span>
                <span className="block text-xs text-gray-400 mt-1">{step.description}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 h-full overflow-hidden">
        {/* Left Column - Main Content */}
        <div className={`transition-all duration-300 ${showProfilePanel ? 'w-1/2 mr-[50vw]' : 'w-full'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderStepContent()}
          </div>
        </div>

        {/* Right Column - Candidate Profile Panel */}
        {showProfilePanel && (
          <div className="fixed inset-y-0 right-0 w-1/2 h-full z-50 flex flex-col bg-white shadow-lg">
            <div className="h-full p-6">
              <CandidateDetailPanel
                candidate={selectedCandidateForProfile}
                isOpen={showProfilePanel}
                onClose={handleCloseProfilePanel}
                onShortlist={() => {
                  toast.success('Shortlist functionality coming soon!');
                }}
                onReject={() => {
                  toast.success('Reject functionality coming soon!');
                }}
                onScheduleInterview={() => {
                  toast.success('Schedule interview functionality coming soon!');
                }}
                isShortlisted={false}
              />
            </div>
          </div>
        )}
      </div>



      <InterviewSchedulingModal
        showInterviewModal={showInterviewModal}
        setShowInterviewModal={setShowInterviewModal}
        selectedCandidate={selectedCandidate}
        interviewDetails={interviewDetails}
        setInterviewDetails={setInterviewDetails}
        onScheduleInterview={scheduleInterviewForAcceptedCandidate}
        onSendInvitationWithInterview={sendInvitationWithInterview}
      />
    

      {/* Reschedule Interview Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Reschedule Interview for {selectedInterview?.name}
              </h2>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    value={interviewDetails.date}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Time *
                  </label>
                  <input
                    type="time"
                    value={interviewDetails.time}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              </div>

              {/* Interview Type and Format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Type
                  </label>
                  <select
                    value={interviewDetails.type}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="1st_interview">Initial Interview</option>
                    <option value="technical">Technical Interview</option>
                    <option value="hr_interview">HR Interview</option>
                    <option value="final">Final Interview</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Format
                  </label>
                  <select
                    value={interviewDetails.format}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
              </div>

              {/* Duration and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={interviewDetails.duration}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location / Meeting Link
                  </label>
                  <input
                    type="text"
                    value={interviewDetails.location}
                    onChange={(e) => setInterviewDetails(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={interviewDetails.format === 'video' ? 'Google Meet, Zoom, etc.' : 'Office address'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Agenda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Agenda / Notes
                </label>
                <textarea
                  value={interviewDetails.agenda}
                  onChange={(e) => setInterviewDetails(prev => ({ ...prev, agenda: e.target.value }))}
                  placeholder="What will be discussed in this interview?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
              >
                Reschedule Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedInterview?.feedback ? 'View Feedback' : 'Add Feedback'} for {selectedInterview?.name}
              </h2>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1-5)
                </label>
                <select
                  value={feedbackData.rating || ''}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, rating: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select rating</option>
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2 - Below Average</option>
                  <option value={3}>3 - Average</option>
                  <option value={4}>4 - Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedbackData.feedback}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Share your thoughts about the candidate's performance..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
              >
                {selectedInterview?.feedback ? 'Update Feedback' : 'Save Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hire Confirmation Modal */}
      {showHireConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Hiring Decision
              </h2>
              <button
                onClick={() => {
                  setShowHireConfirmationModal(false);
                  setCandidateToHire(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Hire {candidateToHire?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {candidateToHire?.title}
                  </p>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Are you sure you want to hire this candidate?</strong>
                </p>
                <p className="text-sm text-green-700 mt-2">
                  This action will mark the interview as completed and move the candidate to the hiring stage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowHireConfirmationModal(false);
                  setCandidateToHire(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmHireCandidate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Yes, Hire Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Rejection
              </h2>
              <button
                onClick={() => {
                  setShowRejectConfirmationModal(false);
                  setCandidateToReject(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Reject {candidateToReject?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {candidateToReject?.title}
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Are you sure you want to reject this candidate?</strong>
                </p>
                <p className="text-sm text-red-700 mt-2">
                  This action will mark the interview as rejected and remove the candidate from the hiring process.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectConfirmationModal(false);
                  setCandidateToReject(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectCandidate}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Reject Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Completed Confirmation Modal */}
      {showMarkCompletedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Mark Interview as Completed
              </h2>
              <button
                onClick={() => {
                  setShowMarkCompletedModal(false);
                  setInterviewToMarkCompleted(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {interviewToMarkCompleted?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {interviewToMarkCompleted?.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    Interview Date: {interviewToMarkCompleted?.interviewDate && new Date(interviewToMarkCompleted.interviewDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Mark this interview as completed?</strong>
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  This will change the interview status to "completed" and allow you to add feedback and make hiring decisions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMarkCompletedModal(false);
                  setInterviewToMarkCompleted(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkInterviewCompleted}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Interview Confirmation Modal */}
      {showCancelInterviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Cancel Interview
              </h2>
              <button
                onClick={() => {
                  setShowCancelInterviewModal(false);
                  setInterviewToCancel(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {interviewToCancel?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {interviewToCancel?.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    Interview Date: {interviewToCancel?.interviewDate && new Date(interviewToCancel.interviewDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Are you sure you want to cancel this interview?</strong>
                </p>
                <p className="text-sm text-red-700 mt-2">
                  This action cannot be undone. The interview will be marked as cancelled and the candidate will be notified.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelInterviewModal(false);
                  setInterviewToCancel(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Keep Interview
              </button>
              <button
                onClick={confirmCancelInterview}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Letter Upload Modal */}
      {showOfferLetterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Offer Letter
              </h2>
              <button
                onClick={() => {
                  setShowOfferLetterModal(false);
                  setCandidateToHire(null);
                  setOfferLetterFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Hire {candidateToHire?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {candidateToHire?.title}
                  </p>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Upload the offer letter for this candidate.</strong>
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Supported formats: PDF, DOC, DOCX (Max 10MB)
                </p>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="offer-letter-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleOfferLetterFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="offer-letter-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">
                    {offerLetterFile ? offerLetterFile.name : 'Click to upload offer letter'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                </label>
              </div>

              {offerLetterFile && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{offerLetterFile.name}</p>
                      <p className="text-xs text-blue-700">
                        {(offerLetterFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setOfferLetterFile(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowOfferLetterModal(false);
                  setCandidateToHire(null);
                  setOfferLetterFile(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={uploadingOfferLetter}
              >
                Cancel
              </button>
              <button
                onClick={handleOfferLetterUpload}
                disabled={!offerLetterFile || uploadingOfferLetter}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploadingOfferLetter ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload & Hire'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Process Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Velai Migration Process
              </h2>
              {!isMigrationRunning && (
                <button
                  onClick={() => {
                    setShowMigrationModal(false);
                    setCandidateForMigration(null);
                    setMigrationProgress(0);
                    setMigrationStatus('');
                    setMigrationSourceStep(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {candidateForMigration?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {candidateForMigration?.title}
                  </p>
                </div>
              </div>
              
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-violet-800">
                  <strong>Starting Velai migration process...</strong>
                </p>
                <p className="text-sm text-violet-700 mt-2">
                  This process will set up the candidate's employee profile and prepare them for onboarding.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Migration Progress</span>
                  <span>{migrationProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-violet-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${migrationProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  {isMigrationRunning ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <p className="text-sm text-gray-700">
                    {migrationStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isMigrationRunning && migrationProgress === 100 && (
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMigrationModal(false);
                    setCandidateForMigration(null);
                    setMigrationProgress(0);
                    setMigrationStatus('');
                    setMigrationSourceStep(null);
                  }}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
                >
                  Continue to Onboarding
                </button>
              </div>
            )}

            {isMigrationRunning && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Please wait while Velai processes the migration...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HiringProcessPage;
