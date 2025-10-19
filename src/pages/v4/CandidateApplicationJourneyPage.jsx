import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/common/useAuth';
import { useApplicationsStoreData } from '../../hooks/candidate/useApplicationsStore';
import { useDocuments } from '../../hooks/candidate/useDocuments';
import { supabase } from '../../clients/supabaseClient';
import toast from 'react-hot-toast';

// Import step components
import JobDetailStep from '../../components/candidate-journey/JobDetailStep';
import InterviewingStep from '../../components/candidate-journey/InterviewingStep';
import OfferLetterStep from '../../components/candidate-journey/OfferLetterStep';
import HiredStep from '../../components/candidate-journey/HiredStep';
import VisaProcessingStep from '../../components/candidate-journey/VisaProcessingStep';
import OnboardingStep from '../../components/candidate-journey/OnboardingStep';

const CandidateApplicationJourneyPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [application, setApplication] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [interviewData, setInterviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingInterviews, setLoadingInterviews] = useState(false);


  // Use Zustand store for applications data
  const {
    applications,
    invitations,
    fetchData,
    acceptInvitation,
    declineInvitation
  } = useApplicationsStoreData(user?.id);

  // Use documents hook for dynamic document loading
  const {
    documents,
    filteredDocuments,
    documentStats,
    documentsByType,
    isLoading: documentsLoading,
    uploadDocument: uploadDocumentToStore,
    getDocumentUrl
  } = useDocuments(user?.id);

  // Handle URL step parameter
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const stepNumber = parseInt(stepParam, 10);
      if (stepNumber >= 1 && stepNumber <= 6) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams]);

  // Helper to set current step and persist to URL
  const setStep = (step) => {
    setCurrentStep(step);
    const next = new URLSearchParams(searchParams);
    next.set('step', String(step));
    setSearchParams(next, { replace: true });
  };

  // Fetch data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, fetchData]);

  // Set up real-time updates for application status changes
  useEffect(() => {
    if (!user?.id || !application?.id) return;

    const channel = supabase
      .channel(`application-${application.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_applications',
          filter: `id=eq.${application.id}`
        },
        (payload) => {
          // Refresh the applications data
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, application?.id, fetchData]);

  // Set up real-time updates for document changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`documents-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `owner_id=eq.${user.id}`
        },
        (payload) => {
          // The useDocuments hook will automatically handle the update
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Set up real-time updates for interview changes
  useEffect(() => {
    if (!user?.id || !application?.jobId) return;

    const channel = supabase
      .channel(`interviews-${user.id}-${application.jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interviews_v2',
          filter: application.isInvitation 
            ? `seeker_id=eq.${user.id},job_id=eq.${application.jobId}`
            : `application_id=eq.${application.id}`
        },
        async (payload) => {
          // Refresh interview data when changes occur
          console.log('Real-time interview update received:', payload);
          const updatedInterviews = await fetchInterviewData(application);
          setInterviewData(updatedInterviews);
          console.log('Updated interviews after real-time change:', updatedInterviews);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, application?.jobId, application?.id, application?.isInvitation]);

  // Fetch interview data for the application
  const fetchInterviewData = async (application) => {
    console.log('=== FETCH INTERVIEW DATA DEBUG ===');
    console.log('User ID:', user?.id);
    console.log('Application object:', application);
    console.log('Application ID:', application?.id);
    console.log('Application Job ID:', application?.jobId);
    console.log('Application isInvitation:', application?.isInvitation);

    if (!application?.jobId || !user?.id) {
      console.log('❌ Missing required data - returning empty array');
      console.log('Missing jobId:', !application?.jobId);
      console.log('Missing user.id:', !user?.id);
      return [];
    }

    setLoadingInterviews(true);
    try {

      // Determine if this is an invitation flow or regular application flow
      // Invitation flow detection: 
      // 1. Check if application.isInvitation is explicitly true
      // 2. Check if this application came from invitations array (not applications array)
      // 3. Check if status indicates invitation flow
      const isFromInvitations = invitations.some(inv => inv.id === application.id);
      const isInvitationFlow = application.isInvitation === true || 
                              isFromInvitations ||
                              application.status === 'invited';
      
      console.log('Flow Detection:');
      console.log('- application.id:', application.id);
      console.log('- application.isInvitation:', application.isInvitation);
      console.log('- application.status:', application.status);
      console.log('- isFromInvitations:', isFromInvitations);
      console.log('- isInvitationFlow:', isInvitationFlow);
      
      let query;
      
      if (isInvitationFlow) {
        // For invitations, look for interviews with seeker_id and job_id
        console.log('🔍 Using INVITATION FLOW query');
        console.log('Query parameters: seeker_id =', user.id, ', job_id =', application.jobId);
        
        query = supabase
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
            job_id,
            interviewer:interviewer_id (
              id,
              full_name,
              avatar_url
            ),
            jobs:job_id (
              id,
              title,
              companies:company_id (
                id,
                name,
                logo_url
              )
            )
          `)
          .eq('seeker_id', user.id)
          .eq('job_id', application.jobId)
          .order('interview_date', { ascending: true });
      } else {
        // For regular applications, look for interviews with application_id
        console.log('🔍 Using REGULAR APPLICATION FLOW query');
        console.log('Query parameters: application_id =', application.id);
        query = supabase
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
            application_id,
            interviewer:interviewer_id (
              id,
              full_name,
              avatar_url
            ),
            job_applications_v2:application_id (
              id,
              jobs:job_id (
                id,
                title,
                companies:company_id (
                  id,
                  name,
                  logo_url
                )
              )
            )
          `)
          .eq('application_id', application.id)
          .order('interview_date', { ascending: true });
      }

      const { data: interviews, error: interviewError } = await query;

      console.log('📊 Query Results:');
      console.log('- Error:', interviewError);
      console.log('- Raw interviews data:', interviews);
      console.log('- Number of interviews found:', interviews?.length || 0);

      if (interviewError) {
        console.error('❌ Error fetching interviews:', interviewError);
        return [];
      }

      console.log('🔄 Transforming interview data...');

      // Transform interview data to match the expected format
      const transformedInterviews = (interviews || []).map((interview, index) => {
        const interviewDate = new Date(interview.interview_date);
        
        return {
          id: interview.id,
          type: interview.interview_type === '1st_interview' ? 'Initial' :
                interview.interview_type === 'technical' ? 'Technical' :
                interview.interview_type === 'hr_interview' ? 'HR' :
                interview.interview_type === 'final' ? 'Final' : 'Interview',
          round: index + 1,
          dateTime: interviewDate.toISOString(),
          interviewer: interview.interviewer?.full_name || 'Interviewer',
          status: interview.status,
          mode: interview.interview_format === 'video' ? 'video' :
                interview.interview_format === 'phone' ? 'phone' : 'in-person',
          location: interview.location || (interview.interview_format === 'video' ? 'Video Call' : 'TBD'),
          duration: `${interview.duration_minutes || 60} minutes`,
          description: interview.agenda || interview.notes || 'Interview to discuss the role and your background',
          feedback: interview.feedback || null,
          meetingLink: interview.meeting_link || null,
          tips: [
            'Review the job description and company information',
            'Prepare examples of your relevant experience',
            'Have questions ready about the role and company',
            'Test your technology setup if it\'s a video interview'
          ]
        };
      });

      console.log('✅ Transformed interviews:', transformedInterviews);
      console.log('Final interview count:', transformedInterviews.length);
      console.log('=== END FETCH INTERVIEW DATA DEBUG ===');

      return transformedInterviews;
    } catch (error) {
      console.error('Error fetching interview data:', error);
      return [];
    } finally {
      setLoadingInterviews(false);
    }
  };

  // Find the specific application and fetch job details
  useEffect(() => {
    const fetchApplicationAndJobDetails = async () => {
      if ((applications.length > 0 || invitations.length > 0) && applicationId) {
        // Look in both applications and invitations
        const allItems = [...applications, ...invitations];
        const foundApplication = allItems.find(app => app.id === applicationId);
        setApplication(foundApplication);

        if (foundApplication?.jobId) {
          try {
            // Fetch complete job details from database
            const { data: jobData, error: jobError } = await supabase
              .from('jobs')
              .select(`
                *,
                companies (
                  id,
                  name,
                  logo_url,
                  description,
                  website,
                  industry
                )
              `)
              .eq('id', foundApplication.jobId)
              .single();

            if (jobError) {
              console.error('Error fetching job details:', jobError);
            } else {
              setJobDetails(jobData);
            }

            // Fetch interview data
            const interviews = await fetchInterviewData(foundApplication);
            setInterviewData(interviews);
          } catch (error) {
            console.error('Error fetching job details:', error);
          }
        }

        setLoading(false);
      }
    };

    fetchApplicationAndJobDetails();
  }, [applications, invitations, applicationId, user?.id]);

  const steps = [
    { id: 1, name: 'Job Details', description: 'Application overview' },
    { id: 2, name: 'Interviewing', description: 'Interview schedule' },
    { id: 3, name: 'Hired', description: 'Congratulations!' },
    { id: 4, name: 'Offer Letter', description: 'Review & sign offer' },
    { id: 5, name: 'Visa Processing', description: 'Document submission' },
    { id: 6, name: 'Onboarding', description: 'Cultural integration' },
  ];

  // Helper function to get last update message based on status
  const getLastUpdateMessage = (status) => {
    switch (status) {
      case 'applied':
        return 'Application submitted successfully!';
      case 'under_review':
      case 'reviewing':
        return 'Your application is being reviewed by the hiring team.';
      case 'interviewing':
        return 'Interview scheduled! Check your calendar for details.';
      case 'offer_received':
      case 'offered':
        return 'Congratulations! You have received an offer.';
      case 'accepted':
        return 'Offer accepted! Welcome to the team.';
      case 'hired':
        return 'Congratulations! You have been hired.';
      case 'rejected':
        return 'Application status updated.';
      case 'declined':
        return 'Application declined.';
      default:
        return 'Application status updated.';
    }
  };

  // Helper function to get real documents for the application
  const getApplicationDocuments = (app, docsByType) => {
    const appDocuments = [];
    
    // Add resume if available
    if (app.documents?.resumeId && docsByType.resume) {
      const resumeDoc = docsByType.resume.find(doc => doc.id === app.documents.resumeId);
      if (resumeDoc) {
        appDocuments.push({
          id: resumeDoc.id,
          name: resumeDoc.file_name,
          type: 'resume',
          size: resumeDoc.file_size,
          uploadedAt: resumeDoc.created_at,
          isVerified: resumeDoc.is_verified
        });
      }
    }
    
    // Add cover letter if available
    if (app.documents?.coverLetterId && docsByType.cover_letter) {
      const coverLetterDoc = docsByType.cover_letter.find(doc => doc.id === app.documents.coverLetterId);
      if (coverLetterDoc) {
        appDocuments.push({
          id: coverLetterDoc.id,
          name: coverLetterDoc.file_name,
          type: 'cover_letter',
          size: coverLetterDoc.file_size,
          uploadedAt: coverLetterDoc.created_at,
          isVerified: coverLetterDoc.is_verified
        });
      }
    }
    
    // Add additional documents if available
    if (app.documents?.additionalDocumentIds && app.documents.additionalDocumentIds.length > 0) {
      app.documents.additionalDocumentIds.forEach(docId => {
        const additionalDoc = documents.find(doc => doc.id === docId);
        if (additionalDoc) {
          appDocuments.push({
            id: additionalDoc.id,
            name: additionalDoc.file_name,
            type: additionalDoc.document_type,
            size: additionalDoc.file_size,
            uploadedAt: additionalDoc.created_at,
            isVerified: additionalDoc.is_verified
          });
        }
      });
    }
    
    // If no documents found, show placeholder
    if (appDocuments.length === 0) {
      appDocuments.push({
        id: 'placeholder',
        name: 'No documents uploaded',
        type: 'placeholder',
        size: 0,
        uploadedAt: null,
        isVerified: false
      });
    }
    
    return appDocuments;
  };

  // Parse interview details from invitation response if available
  let invitationInterviewDetails = null;
  const responseData = application?.response || application?.invitationResponse;
  
  if (responseData) {
    try {
      const parsedData = JSON.parse(responseData);
      if (parsedData.interview_date) {
        invitationInterviewDetails = {
          date: new Date(parsedData.interview_date).toLocaleDateString(),
          time: new Date(parsedData.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: parsedData.interview_type === '1st_interview' ? 'Initial' :
                parsedData.interview_type === 'technical' ? 'Technical' :
                parsedData.interview_type === 'hr_interview' ? 'HR' :
                parsedData.interview_type === 'final' ? 'Final' : 'Interview',
          format: parsedData.interview_format === 'video' ? 'Video Call' :
                  parsedData.interview_format === 'phone' ? 'Phone Call' : 'In Person',
          duration: parsedData.duration_minutes || 60,
          location: parsedData.location || 'TBD',
          agenda: parsedData.agenda || ''
        };
      }
    } catch (error) {
      console.warn('Could not parse invitation response:', error);
    }
  }

  // Transform application data to match the expected format using real data
  const applicationData = application ? {
    appliedDate: application.appliedDate || application.application_date || application.created_at,
    status: application.status,
    matchScore: application.matchScore || application.ai_match_score || 85,
    lastUpdate: getLastUpdateMessage(application.status),
    lastUpdateDate: application.updatedAt || application.updated_at || application.created_at,
    coverLetter: application.coverNote || application.cover_note || application.coverLetter || 'Cover letter submitted with application.',
    documents: getApplicationDocuments(application, documentsByType)
  } : null;

  const jobData = jobDetails ? {
    title: jobDetails.title || 'Job Title',
    company: jobDetails.companies?.name || 'Company Name',
    location: jobDetails.location || 'Location',
    type: jobDetails.job_type === 'full_time' ? 'Full-time' : 
          jobDetails.job_type === 'part_time' ? 'Part-time' : 
          jobDetails.job_type === 'internship' ? 'Internship' : 'Full-time',
    salary: jobDetails.salary_range && jobDetails.salary_range.min !== undefined && jobDetails.salary_range.max !== undefined ? 
      `€${jobDetails.salary_range.min.toLocaleString()} - €${jobDetails.salary_range.max.toLocaleString()}` :
      (() => {
        // Handle different salary data formats
        const salaryData = application?.salary;
        if (typeof salaryData === 'string') {
          return salaryData;
        } else if (typeof salaryData === 'object' && salaryData) {
          // If it's an object with min/max values
          if (salaryData.min && salaryData.max) {
            return `€${salaryData.min.toLocaleString()} - €${salaryData.max.toLocaleString()}`;
          }
          // If it's an object with type, period, currency (fallback)
          if (salaryData.type && salaryData.period && salaryData.currency) {
            return `${salaryData.currency} ${salaryData.type}/${salaryData.period}`;
          }
        }
        return '€30k - €50k';
      })(),
    totalApplicants: jobDetails.total_applicants || 47,
    deadline: jobDetails.application_deadline || '2024-02-15',
    description: jobDetails.description || 'We are looking for a skilled developer to join our growing team.',
    requirements: Array.isArray(jobDetails.requirements) ? jobDetails.requirements : 
                 typeof jobDetails.requirements === 'string' ? 
                   jobDetails.requirements.split('\n').filter(req => req.trim()) : [
                     '5+ years experience',
                     'Proficiency in modern frameworks',
                     'Experience with state management',
                     'Knowledge of testing frameworks'
                   ],
    benefits: Array.isArray(jobDetails.benefits) ? jobDetails.benefits : 
              typeof jobDetails.benefits === 'string' ? 
                jobDetails.benefits.split('\n').filter(benefit => benefit.trim()) : [
                  'Health insurance',
                  'Remote work flexibility',
                  '401k matching',
                  'Professional development budget',
                  'Flexible PTO'
                ]
  } : application ? {
    // Fallback to application data if job details not available
    title: application.jobTitle || 'Job Title',
    company: application.company || 'Company Name',
    location: application.location || 'Location',
    type: application.jobType === 'full_time' ? 'Full-time' : 
          application.jobType === 'part_time' ? 'Part-time' : 
          application.jobType === 'internship' ? 'Internship' : 'Full-time',
    salary: application.salary || '€30k - €50k',
    totalApplicants: 47,
    deadline: '2024-02-15',
    description: 'We are looking for a skilled developer to join our growing team.',
    requirements: [
      '5+ years experience',
      'Proficiency in modern frameworks',
      'Experience with state management',
      'Knowledge of testing frameworks'
    ],
    benefits: [
      'Health insurance',
      'Remote work flexibility',
      '401k matching',
      'Professional development budget',
      'Flexible PTO'
    ]
  } : null;



  // Dynamic offer data based on application status and job details
  const offerData = applicationData?.status === 'offered' || applicationData?.status === 'offer_received' ? {
    status: 'pending',
    jobTitle: jobData?.title || 'Job Title',
    company: jobData?.company || 'Company Name',
    salary: jobData?.salary || '€50,000 - €70,000',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    location: jobData?.location || 'Location',
    employmentType: jobData?.type || 'Full-time',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    benefits: Array.isArray(jobDetails?.benefits) ? jobDetails.benefits : [
      'Health, Dental, and Vision Insurance',
      'Remote work flexibility',
      '401(k) with company matching',
      'Professional development budget',
      'Flexible PTO policy'
    ],
    additionalTerms: 'This offer is contingent upon successful completion of background check and visa processing.',
    requiredDocuments: [
      {
        name: 'Educational Transcripts',
        description: 'Official transcripts from your university',
        type: 'transcripts',
        required: true,
        acceptedFormats: '.pdf,.jpg,.png'
      },
      {
        name: 'Reference Letters',
        description: 'Letters of recommendation from previous employers',
        type: 'references',
        required: false,
        acceptedFormats: '.pdf,.doc,.docx'
      }
    ]
  } : null;

  const onboardingInfo = {
    manager: {
      name: 'Sarah Johnson',
      title: 'Engineering Manager',
      email: 'sarah.johnson@techcorp.com'
    },
    visaSpecialist: {
      name: 'Priya Nair',
      email: 'priya.nair@velai.com',
      phone: '+1-555-0123'
    },
    culturalMentor: {
      name: 'Arjun Gupta',
      email: 'arjun.gupta@velai.com',
      phone: '+1-555-0124'
    }
  };

  const visaData = {
    status: 'documents_pending',
    specialist: {
      name: 'Priya Nair',
      email: 'priya.nair@velai.com',
      phone: '+1-555-0123'
    },
    uploadedDocuments: documents.filter(doc => 
      ['passport', 'visa', 'transcripts', 'references', 'certificates'].includes(doc.document_type)
    ).map(doc => ({
      id: doc.id,
      name: doc.file_name,
      type: doc.document_type,
      size: doc.file_size,
      uploadedAt: doc.created_at,
      isVerified: doc.is_verified,
      status: doc.is_verified ? 'verified' : 'pending'
    }))
  };

  const onboardingData = {
    country: 'United States',
    completedModules: ['workplace_culture'],
    sessionsAttended: 1,
    mentorMeetings: 2,
    culturalMentor: {
      name: 'Arjun Gupta',
      background: 'Former software engineer from Mumbai, now settled in SF for 8 years'
    },
    embassy: {
      phone: '+1-202-939-7000'
    },
    emergency: {
      number: '911'
    }
  };

  // Event handlers
  const handleUploadDocument = async (file, documentType, metadata = {}) => {
    try {
      const uploadedDoc = await uploadDocumentToStore(file, documentType, metadata);
      return uploadedDoc;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleAcceptOffer = () => {
    setStep(5); // Move to visa processing step
  };

  const handleDeclineOffer = () => {
    // Handle offer decline
  };

  const handleAcceptInvitation = async () => {
    console.log('Accept invitation - application:', application);
    console.log('Accept invitation - user:', user);
    
    if (!application?.id || !user?.id) {
      console.error('Missing application ID or user ID');
      return;
    }
    
    try {
      const result = await acceptInvitation(application.id, user.id);
      if (result && result.success) {
        // Update the application status to 'accepted' first
        const updatedApplication = { ...application, status: 'accepted' };
        setApplication(updatedApplication);
        
        // Refresh data to get the updated status
        await fetchData();
        
        // Stay on job details step to show acceptance confirmation
        setStep(1);
        
        // Refresh interview data using the updated application
        const updatedInterviews = await fetchInterviewData(updatedApplication);
        setInterviewData(updatedInterviews);
        
        console.log('Interview data after acceptance:', updatedInterviews);
        
        // If interviews exist, the candidate can now access the interviewing step
        if (updatedInterviews.length > 0) {
          console.log('Interviews found! Candidate can access interviewing step.');
        } else {
          console.log('No interviews found yet. Interview will be created by employer.');
          // Show a message to the candidate that they need to wait
          toast.success('Invitation accepted! We will contact you soon to schedule your interview.');
        }
      } else {
        console.error('Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!application?.id || !user?.id) {
      console.error('Missing application ID or user ID');
      return;
    }
    
    try {
      const result = await declineInvitation(application.id, user.id);
      if (result && result.success) {
        // Navigate back to applications page
        navigate('/dashboard/applications');
      } else {
        console.error('Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  const handleProceedToVisa = () => {
    setStep(6); // Move to onboarding step
  };

  const handleContactSupport = () => {
    // Handle contact support
  };

  const handleCompleteModule = (moduleId) => {
    // Handle module completion
  };

  const handleScheduleSession = (sessionId) => {
    // Handle session scheduling
  };

  // Interview management handlers
  const handleRescheduleInterview = (interview) => {
    // For candidates, this might open a modal to request reschedule
    // or redirect to a reschedule request page
    console.log('Reschedule interview requested:', interview);
    toast.info('Reschedule request will be sent to the employer');
    // TODO: Implement reschedule request functionality
  };

  const handleJoinInterview = (interview) => {
    // Handle joining an interview (open meeting link, etc.)
    console.log('Joining interview:', interview);
    if (interview.meetingLink) {
      window.open(interview.meetingLink, '_blank');
    } else {
      toast.error('Meeting link not available');
    }
  };

  const handleCancelInterview = (interview) => {
    // For candidates, this might be a request to cancel
    console.log('Cancel interview requested:', interview);
    toast.info('Cancel request will be sent to the employer');
    // TODO: Implement cancel request functionality
  };

  const handleBack = () => {
    navigate('/dashboard/applications');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      // Force re-fetch of job details if application exists
      if (application?.jobId) {
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select(`
            *,
            companies (
              id,
              name,
              logo_url,
              description,
              website,
              industry
            )
          `)
          .eq('id', application.jobId)
          .single();

        if (!jobError && jobData) {
          setJobDetails(jobData);
        }

        // Refresh interview data
        const updatedInterviews = await fetchInterviewData(application);
        setInterviewData(updatedInterviews);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderStepContent = () => {
    if (!applicationData || !jobData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading application details...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        // Determine if this is an invitation based on status or isInvitation property
        const isInvitation = application?.isInvitation || applicationData?.status === 'invited';
        
        return (
          <JobDetailStep 
            jobData={jobData}
            applicationData={applicationData}
            isInvitation={isInvitation}
            onAcceptInvitation={handleAcceptInvitation}
            onDeclineInvitation={handleDeclineInvitation}
            interviewDetails={invitationInterviewDetails}
          />
        );
      
      case 2:
        return (
          <InterviewingStep
            interviews={interviewData.length > 0 ? interviewData : []}
            onReschedule={handleRescheduleInterview}
            onJoinInterview={handleJoinInterview}
            onCancelInterview={handleCancelInterview}
            loading={loadingInterviews}
          />
        );
      
      case 3:
        return (
          <HiredStep 
            jobData={jobData}
            applicationData={applicationData}
          />
        );
      
      case 4:
        return (
          <OfferLetterStep 
            offerData={offerData}
            onUploadDocument={handleUploadDocument}
            onAcceptOffer={handleAcceptOffer}
            onDeclineOffer={handleDeclineOffer}
          />
        );
      
      case 5:
        return (
          <VisaProcessingStep 
            visaData={visaData}
            onUploadDocument={handleUploadDocument}
            onContactSupport={handleContactSupport}
          />
        );
      
      case 6:
        return (
          <OnboardingStep 
            onboardingData={onboardingData}
            onCompleteModule={handleCompleteModule}
            onScheduleSession={handleScheduleSession}
          />
        );
      
      default:
        return <div>Step not found</div>;
    }
  };

  // Determine which steps should be accessible based on current status
  const getStepAccessibility = (stepId) => {
    if (!applicationData) return stepId <= 1;
    
    // Handle invitations specially - MUST accept/decline before proceeding
    const isInvitation = application?.isInvitation || applicationData?.status === 'invited';
    if (isInvitation) {
      switch (applicationData.status) {
        case 'invited':
          // CRITICAL: Only job details step accessible - candidate MUST accept/decline
          return stepId <= 1;
        case 'accepted':
          // After accepting invitation, allow interviewing step only if interviews exist
          const hasInterviewsForAccepted = interviewData.length > 0;
          if (hasInterviewsForAccepted && stepId === 2) {
            return true; // Allow access to interviewing step if interviews exist
          }
          return stepId <= 1; // Otherwise only job details step
        case 'interviewing':
          return stepId <= 2; // Job details and interviewing steps
        case 'hired':
          return stepId <= 3;
        case 'offer_received':
        case 'offered':
          return stepId <= 4;
        case 'visa_processing':
          return stepId <= 5;
        case 'onboarding':
          return stepId <= 6;
        case 'declined':
          // If invitation was declined, only show job details with decline message
          return stepId <= 1;
        default:
          // Default for invitations - only job details accessible
          return stepId <= 1;
      }
    }
    
    // Check if interviews are scheduled (even if status is not 'interviewing')
    const hasInterviews = interviewData.length > 0;
    if (hasInterviews && stepId === 2) {
      return true; // Allow access to interviewing step if interviews exist
    }
    
    // Regular application flow
    switch (applicationData.status) {
      case 'applied':
      case 'under_review':
      case 'reviewing':
        return stepId <= 1;
      case 'interviewing':
      case 'interview_scheduled':
        return stepId <= 2;
      case 'hired':
        return stepId <= 3;
      case 'offer_received':
      case 'offered':
        return stepId <= 4;
      case 'visa_processing':
        return stepId <= 5;
      case 'onboarding':
        return stepId <= 6;
      default:
        return stepId <= 1;
    }
  };

  if (loading || documentsLoading || loadingInterviews) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading application journey...</p>
          {documentsLoading && <p className="text-sm text-gray-500 mt-2">Loading documents...</p>}
          {loadingInterviews && <p className="text-sm text-gray-500 mt-2">Loading interview data...</p>}
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Application not found</p>
          <button 
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Applications
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
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Application Journey
                </h1>
                <p className="text-sm text-gray-500">
                  {jobData?.title} • {jobData?.company}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm font-medium">
                V4 Preview
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4" aria-label="Tabs">
            {steps.map((step) => {
              const isAccessible = getStepAccessibility(step.id);
              const isCurrent = currentStep === step.id;
              const isInvitation = application?.isInvitation || applicationData?.status === 'invited';
              const isInvitationBlocked = isInvitation && applicationData?.status === 'invited' && step.id > 1;
              const isAcceptedWaitingForInterview = isInvitation && applicationData?.status === 'accepted' && step.id === 2 && interviewData.length === 0;
              const isAcceptedWithInterviews = isInvitation && applicationData?.status === 'accepted' && step.id === 2 && interviewData.length > 0;
              
              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && setStep(step.id)}
                  disabled={!isAccessible}
                  className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center font-medium transition-colors focus:outline-none ${
                    isCurrent
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : isAccessible
                      ? 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                      : 'text-gray-300 border-b-2 border-transparent cursor-not-allowed'
                  }`}
                >
                  <span className="block text-sm font-medium flex items-center justify-center">
                    {step.name}
                    {isInvitationBlocked && (
                      <span className="ml-1 text-xs text-red-500" title="Accept invitation to unlock">
                        🔒
                      </span>
                    )}
                    {isAcceptedWaitingForInterview && (
                      <span className="ml-1 text-xs text-yellow-500" title="Waiting for employer to schedule interview">
                        ⏳
                      </span>
                    )}
                    {isAcceptedWithInterviews && (
                      <span className="ml-1 text-xs text-green-500" title="Interview scheduled! Click to view details">
                        ✅
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-gray-400 mt-1">
                    {isInvitationBlocked ? 'Accept invitation to unlock' : 
                     isAcceptedWaitingForInterview ? 'Waiting for interview schedule' : 
                     isAcceptedWithInterviews ? 'Interview scheduled - click to view' :
                     step.description}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default CandidateApplicationJourneyPage;
