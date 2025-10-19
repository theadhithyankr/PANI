import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, MessageCircle, Download, Calendar, FileText, Building, MapPin, Euro, Clock, User, Briefcase, RefreshCw, Star } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Timeline from '../../components/common/Timeline';
import ProgressBar from '../../components/common/ProgressBar';
import CountdownTimer from '../../components/common/CountdownTimer';
import { supabase } from '../../clients/supabaseClient';
import { useAuth } from '../../hooks/common/useAuth';
import { useToast } from '../../hooks/common/useToast';
import { useConversations } from '../../hooks/common/useConversations';
import useDocumentsStore from '../../store/documentsStore';
import useJobsStore from '../../store/jobsStore';

// Import status-specific components
import AppliedState from '../../components/candidate/application-states/AppliedState';
import ReviewingState from '../../components/candidate/application-states/ReviewingState';
import InterviewScheduledState from '../../components/candidate/application-states/InterviewScheduledState';
import OfferReceivedState from '../../components/candidate/application-states/OfferReceivedState';
import RejectedState from '../../components/candidate/application-states/RejectedState';
import HiredState from '../../components/candidate/application-states/HiredState';
import MessageThread from '../../components/candidate/MessageThread';

const ApplicationDetailsPage = () => {
  const { applicationId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  console.log('ApplicationDetailsPage - applicationId from params:', applicationId);
  console.log('ApplicationDetailsPage - user:', user);
  
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Use the real messaging system
  const {
    sendMessage: sendRealMessage,
    getOrCreateConversation,
    loading: messagesLoading
  } = useConversations();
  
  // Use documents store
  const { 
    documents, 
    fetchDocuments, 
    getDocumentUrl, 
    isLoading: documentsLoading 
  } = useDocumentsStore();

  // Use jobs store for match score calculation
  const { 
    calculateMatchScore: jobsStoreCalculateMatchScore,
    fetchUserSkills: jobsStoreFetchUserSkills,
    fetchUserProfile: jobsStoreFetchUserProfile,
    getJobById
  } = useJobsStore();





  // Match score display functions - same as JobCard
  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMatchScoreLabel = (score) => {
    if (score >= 80) return t('applicationDetails.matchScore.excellent', 'Excellent Match');
    if (score >= 60) return t('applicationDetails.matchScore.good', 'Good Match');
    if (score >= 40) return t('applicationDetails.matchScore.fair', 'Fair Match');
    return t('applicationDetails.matchScore.poor', 'Poor Match');
  };



  // Helper functions for generating timeline and messages
  const generateTimeline = (app) => {
    // Ensure we have a valid applied date
    let appliedDate;
    try {
      appliedDate = new Date(app.appliedDate);
      // Check if the date is valid
      if (isNaN(appliedDate.getTime())) {
        // If invalid, use current date as fallback
        appliedDate = new Date();
      }
    } catch (error) {
      console.warn('Invalid applied date, using current date as fallback:', app.appliedDate);
      appliedDate = new Date();
    }

    // For direct interviews, just show the interview date
    if (app.isDirectInterview) {
      return [
        {
          id: 1,
          title: t('applicationDetails.timeline.interviewScheduled.title'),
          description: t('applicationDetails.timeline.interviewScheduled.desc'),
          date: appliedDate,
          status: 'completed',
          icon: 'calendar'
        }
      ];
    }

    // For regular applications, use the original timeline
    const timelineItems = [
      {
        id: 1,
        title: t('applicationDetails.timeline.applicationSubmitted.title'),
        description: t('applicationDetails.timeline.applicationSubmitted.desc'),
        date: appliedDate,
        status: 'completed',
        icon: 'check'
      }
    ];

    if (app.status === 'reviewing' || app.status === 'interviewing' || app.status === 'offer_received') {
      timelineItems.push({
        id: 2,
        title: t('applicationDetails.timeline.underReview.title'),
        description: t('applicationDetails.timeline.underReview.desc'),
        date: new Date(appliedDate.getTime() + 24 * 60 * 60 * 1000), // 1 day later
        status: 'completed',
        icon: 'eye'
      });
    }

    if (app.status === 'interviewing' || app.status === 'offer_received') {
      timelineItems.push({
        id: 3,
        title: t('applicationDetails.timeline.interviewScheduled.title'),
        description: t('applicationDetails.timeline.interviewScheduled.desc'),
        date: new Date(appliedDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
        status: 'completed',
        icon: 'calendar'
      });
    }

    if (app.status === 'offer_received') {
      timelineItems.push({
        id: 4,
        title: t('applicationDetails.timeline.offerReceived.title'),
        description: t('applicationDetails.timeline.offerReceived.desc'),
        date: new Date(appliedDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days later
        status: 'completed',
        icon: 'gift'
      });
    }

    return timelineItems;
  };

  const generateMessages = (app) => {
    // Ensure we have a valid timestamp
    let timestamp;
    try {
      timestamp = new Date(app.appliedDate);
      if (isNaN(timestamp.getTime())) {
        timestamp = new Date();
      }
    } catch (error) {
      console.warn('Invalid applied date for messages, using current date:', app.appliedDate);
      timestamp = new Date();
    }

    const messages = [
      {
        id: 1,
        sender: 'system',
        content: app.isDirectInterview ? 
          t('applicationDetails.directInterview.timeline') + ' ' + t('applicationDetails.directInterview.instructions') :
          t('applicationDetails.timeline.applicationSubmitted.desc'),
        timestamp: timestamp,
        type: 'system'
      }
    ];

    if (app.status === 'reviewing') {
      messages.push({
        id: 2,
        sender: 'recruiter',
        content: t('applicationDetails.timeline.underReview.desc'),
        timestamp: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000),
        type: 'received'
      });
    }

    if (app.status === 'interviewing' && app.interview) {
      messages.push({
        id: 3,
        sender: 'recruiter',
        content: t('applicationDetails.timeline.interviewScheduled.desc'),
        timestamp: new Date(timestamp.getTime() + 2 * 24 * 60 * 60 * 1000),
        type: 'received'
      });
    }

    return messages;
  };

  useEffect(() => {
    const loadApplicationData = async () => {
      if (!applicationId || !user?.id) {
        setError(t('applicationDetails.errors.loadingTitle'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Loading application data for ID:', applicationId, 'User ID:', user.id);

        // Check if this is a direct interview (URL contains 'direct-interview-')
        const isDirectInterview = applicationId.startsWith('direct-interview-');
        
        if (isDirectInterview) {
          // Handle direct interview - extract the actual interview ID
          const actualInterviewId = applicationId.replace('direct-interview-', '');
          
          console.log('Fetching direct interview with ID:', actualInterviewId);
          
          // Fetch direct interview data
          const { data: interviewData, error: interviewError } = await supabase
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
              job:jobs!job_applications_v2_job_id_fkey (
                id,
                title,
                description,
                location,
                job_type,
                salary_range,
                is_remote,
                experience_level,
                skills_required,
                requirements,
                responsibilities,
                companies:company_id (
                  id,
                  name,
                  logo_url,
                  industry,
                  size,
                  website
                )
              )
            `)
            .eq('id', actualInterviewId)
            .is('application_id', null) // Ensure it's a direct interview
            .single();
            
          console.log('Direct interview data:', interviewData);
          console.log('Direct interview error:', interviewError);
          console.log('Direct interview created_at:', interviewData?.created_at);
          console.log('Direct interview interview_date:', interviewData?.interview_date);

          if (interviewError) {
            console.error('Error fetching direct interview:', interviewError);
            throw interviewError;
          }

          if (!interviewData) {
            throw new Error(t('applicationDetails.errors.notFoundTitle'));
          }

          // Create a mock application structure for direct interviews
          const mappedApplication = {
            id: applicationId, // Use the original applicationId from URL params
            isDirectInterview: true,
            status: 'interviewing',
            appliedDate: interviewData.interview_date || new Date().toISOString(),
            updatedAt: interviewData.interview_date || new Date().toISOString(),
            matchScore: 90, // High score for direct interviews since they were invited
            applicationId: applicationId, // Use the original applicationId from URL params
            lastUpdated: interviewData.interview_date || new Date().toISOString(),
            appliedVia: 'Direct Invitation',
            estimatedTimeline: 'Interview scheduled',
            documents: {
              resumeId: null,
              coverLetterId: null,
              additionalDocumentIds: []
            },
            personalInfo: {},
            jobSpecific: {},
            customQuestions: {}
          };

          // Map interview data
          const interviewDate = new Date(interviewData.interview_date);
          mappedApplication.interview = {
            id: interviewData.id,
            date: interviewDate.toISOString().split('T')[0],
            time: interviewDate.toTimeString().split(' ')[0].substring(0, 5),
            duration: interviewData.duration_minutes || 60,
            type: interviewData.interview_type,
            format: interviewData.interview_format,
            platform: interviewData.interview_format === 'video' ? t('applicationDetails.directInterview.platform.video') : 
                     interviewData.interview_format === 'phone' ? t('applicationDetails.directInterview.platform.phone') : t('applicationDetails.directInterview.platform.inPerson'),
            location: interviewData.location,
            meetingLink: interviewData.meeting_link,
            agenda: interviewData.agenda,
            notes: interviewData.notes,
            status: interviewData.status,
            round: 1,
            totalRounds: 1,
            canReschedule: interviewData.status === 'scheduled',
            instructions: interviewData.agenda || 'Please prepare for the interview and have your portfolio ready.',
            interviewer: interviewData.interviewer ? {
              id: interviewData.interviewer.id,
              name: interviewData.interviewer.full_name || 'Interviewer',
              title: t('applicationDetails.directInterview.interviewerTitle'),
              avatar: interviewData.interviewer.avatar_url || null,
              bio: t('applicationDetails.directInterview.interviewerBio'),
              linkedin: `https://linkedin.com/in/${interviewData.interviewer.full_name?.toLowerCase().replace(/\s+/g, '-')}`
            } : null
          };

          // Map job data
          const jobData = interviewData.jobs;
          const mappedJob = {
            id: jobData.id,
            title: jobData.title,
            description: jobData.description,
            location: jobData.location,
            jobType: jobData.job_type,
            salary: jobData.salary_range ?
              (typeof jobData.salary_range === 'object' && jobData.salary_range.min && jobData.salary_range.max ?
                `€${jobData.salary_range.min} - €${jobData.salary_range.max}` :
                jobData.salary_range) : '',
            isRemote: jobData.is_remote,
            experienceLevel: jobData.experience_level,
            requiredSkills: jobData.skills_required || [],
            requirements: jobData.requirements,
            responsibilities: jobData.responsibilities,
            company: jobData.companies?.name || '',
            companyLogo: jobData.companies?.logo_url || '/default-company-logo.png',
            companyIndustry: jobData.companies?.industry || '',
            companySize: jobData.companies?.size || '',
            companyWebsite: jobData.companies?.website || ''
          };

          setApplication(mappedApplication);
          setJob(mappedJob);
          setLastUpdate(new Date());
          
          // Generate timeline and messages for direct interview
          console.log('Generating timeline for direct interview with appliedDate:', mappedApplication.appliedDate);
          const timeline = generateTimeline(mappedApplication);
          console.log('Generated timeline:', timeline);
          setTimeline(timeline);
          
          const messages = generateMessages(mappedApplication);
          setMessages(messages);
          
          setLoading(false);
          return;
        }

        // Fetch user skills first using jobsStore
        const skills = await jobsStoreFetchUserSkills(user.id);
        setUserSkills(skills);

        // Fetch regular application with job, company, and interview details
        const { data: applicationData, error: applicationError } = await supabase
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
            applicant:profiles!job_applications_v2_applicant_id_fkey(*),
            job:jobs!job_applications_v2_job_id_fkey (
              id,
              title,
              description,
              location,
              job_type,
              salary_range,
              is_remote,
              experience_level,
              skills_required,
              requirements,
              responsibilities,
              companies:company_id (
                id,
                name,
                logo_url,
                industry,
                size,
                website
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
          .eq('id', applicationId)
          .eq('applicant_id', user.id) // Security: ensure user owns this application
          .single();

        if (applicationError && applicationError.code !== 'PGRST116') {
          console.error('Error fetching application:', applicationError);
          throw applicationError;
        }

        if (!applicationData) {
          throw new Error(t('applicationDetails.errors.notFoundTitle'));
        }

        console.log('Application data loaded:', applicationData);

        // Map application data to the expected format
        const mappedApplication = {
          id: applicationData.id,
          jobId: applicationData.job_id,
          applicantId: applicationData.applicant_id,
          status: applicationData.status,
          appliedDate: applicationData.application_date,
          updatedAt: applicationData.updated_at,
          coverNote: applicationData.cover_note,
          matchScore: applicationData.ai_match_score || 0, // Will be updated after mappedJob is created
          applicationId: applicationData.id, // For display purposes
          lastUpdated: applicationData.updated_at,
          appliedVia: 'Velai Platform',
          estimatedTimeline: 'ASAP',
          // New fields from updated schema
          documents: {
            resumeId: applicationData.resume_id,
            coverLetterId: applicationData.cover_letter_id,
            additionalDocumentIds: applicationData.additional_document_ids || []
          },
          personalInfo: applicationData.applicant || {},
          jobSpecific: {
            availabilityDate: applicationData.availability_date,
            salaryExpectation: applicationData.salary_expectation,
            visaStatus: applicationData.visa_status,
            motivation: applicationData.motivation
          },
          customQuestions: applicationData.custom_questions || {}
        };

        // Map interview data from database if available
        if (applicationData.interviews && applicationData.interviews.length > 0) {
          // Get the most recent scheduled interview
          const latestInterview = applicationData.interviews
            .filter(interview => interview.status === 'scheduled')
            .sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date))[0];
          
          if (latestInterview) {
            const interviewDate = new Date(latestInterview.interview_date);
            
            mappedApplication.interview = {
              id: latestInterview.id,
              date: interviewDate.toISOString().split('T')[0], // YYYY-MM-DD format
              time: interviewDate.toTimeString().split(' ')[0].substring(0, 5), // HH:MM format
              duration: latestInterview.duration_minutes || 60,
              type: latestInterview.interview_type,
              format: latestInterview.interview_format,
              platform: latestInterview.interview_format === 'video' ? t('applicationDetails.directInterview.platform.video') : 
                       latestInterview.interview_format === 'phone' ? t('applicationDetails.directInterview.platform.phone') : t('applicationDetails.directInterview.platform.inPerson'),
              location: latestInterview.location,
              meetingLink: latestInterview.meeting_link,
              agenda: latestInterview.agenda,
              notes: latestInterview.notes,
              status: latestInterview.status,
              round: latestInterview.interview_type === '1st_interview' ? 1 : 
                     latestInterview.interview_type === 'technical' ? 2 :
                     latestInterview.interview_type === 'hr_interview' ? 3 :
                     latestInterview.interview_type === 'final' ? 4 : 1,
              totalRounds: 4, // This could be dynamic based on job requirements
              canReschedule: latestInterview.status === 'scheduled',
              instructions: latestInterview.agenda || 'Please prepare for the interview and have your portfolio ready.',
                          interviewer: latestInterview.interviewer ? {
              id: latestInterview.interviewer.id,
              name: latestInterview.interviewer.full_name || 'Interviewer',
              title: t('applicationDetails.directInterview.interviewerTitle'),
              avatar: latestInterview.interviewer.avatar_url || null,
              bio: t('applicationDetails.directInterview.interviewerBio'),
              linkedin: `https://linkedin.com/in/${latestInterview.interviewer.full_name?.toLowerCase().replace(/\s+/g, '-')}`
            } : null
            };
          }
        }

        // Map job data to the expected format
        const jobData = applicationData.jobs;
        const mappedJob = {
          id: jobData.id,
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          jobType: jobData.job_type,
          salary: jobData.salary_range ?
            (typeof jobData.salary_range === 'object' && jobData.salary_range.min && jobData.salary_range.max ?
              `€${jobData.salary_range.min} - €${jobData.salary_range.max}` :
              jobData.salary_range) : '',
          isRemote: jobData.is_remote,
          experienceLevel: jobData.experience_level,
          requiredSkills: jobData.skills_required || [],
          requirements: jobData.requirements,
          responsibilities: jobData.responsibilities,
          company: jobData.companies?.name || '',
          companyLogo: jobData.companies?.logo_url || '/default-company-logo.png',
          companyIndustry: jobData.companies?.industry || '',
          companySize: jobData.companies?.size || '',
          companyWebsite: jobData.companies?.website || ''
        };

        // Get match score from jobsStore (same as JobCard)
        const jobFromStore = getJobById(jobData.id);
        if (jobFromStore && jobFromStore.matchScore !== undefined) {
          mappedApplication.matchScore = jobFromStore.matchScore;
          console.log('Using match score from jobsStore:', jobFromStore.matchScore);
        } else {
          // Fallback: calculate match score using jobsStore's comprehensive calculation
          const userSkills = await jobsStoreFetchUserSkills(user.id);
          const userProfile = await jobsStoreFetchUserProfile(user.id);
          
          const calculatedScore = jobsStoreCalculateMatchScore(jobData, userProfile, userSkills);
          console.log('Calculated match score (fallback):', {
            userSkills,
            userProfile: userProfile ? 'available' : 'not available',
            jobSkills: jobData.skills_required,
            calculatedScore
          });
          mappedApplication.matchScore = calculatedScore;
        }

        // Generate dynamic timeline and messages using the helper functions defined above

        // Generate job match details
        const generateJobMatchDetails = (app, jobData) => {
          const jobSkills = jobData.skills_required || [];
          
          const matchedSkills = jobSkills.filter(jobSkill => 
            skills.includes(jobSkill)
          );
          
          const missingSkills = jobSkills.filter(jobSkill => 
            !skills.includes(jobSkill)
          );

          return {
            matchedSkills,
            missingSkills: missingSkills.slice(0, 3) // Limit to 3 missing skills
          };
        };



        // Generate company insights
        const generateCompanyInsights = (jobData) => {
          return {
            yourRanking: `Top ${Math.floor(Math.random() * 20) + 10}%`,
            totalApplicants: Math.floor(Math.random() * 50) + 10,
            averageResponseTime: `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 3) + 3} days`
          };
        };

        setApplication({
          ...mappedApplication,
          jobMatchDetails: generateJobMatchDetails(mappedApplication, jobData),
          companyInsights: generateCompanyInsights(jobData)
        });
        setJob(mappedJob);
        setTimeline(generateTimeline(mappedApplication));
        setMessages(generateMessages(mappedApplication));

      } catch (err) {
        console.error('Error loading application data:', err);
        setError(err.message || 'Failed to load application data');
      } finally {
        setLoading(false);
      }
    };

    loadApplicationData();
  }, [applicationId, user?.id]);

  // Fetch documents when user is available
  useEffect(() => {
    if (user?.id) {
      fetchDocuments(user.id);
    }
  }, [user?.id, fetchDocuments]);

  // Initialize conversation when application is loaded
  useEffect(() => {
    if (application?.id && user?.id) {
      initializeConversation();
    }
  }, [application?.id, user?.id]);

  // Initialize conversation for messaging
  const initializeConversation = async () => {
    if (!application?.id || !user?.id) return;

    try {
      console.log('Initializing conversation for application:', application.id);
      
      // Get or create conversation for this application
      const conversationData = await getOrCreateConversation(
        application.id,
        `Application for ${job?.title || 'Job Position'}`
      );

      if (conversationData) {
        setConversation(conversationData);
        console.log('Conversation initialized:', conversationData);
        
        // Load existing messages
        if (conversationData.messages) {
          setMessages(conversationData.messages);
        }
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      showError(t('applicationDetails.errors.failedToInitializeMessaging'));
    }
  };

  const showUpdateNotification = () => {
    // This would show a toast notification in a real app
    console.log('Application updated!');
  };

  const handleWithdrawApplication = async () => {
    if (!application || application.isDirectInterview || !user?.id) {
      console.error('Cannot withdraw: Invalid application or direct interview');
      return;
    }

    setLoading(true);
    try {
      // Update the application status to 'withdrawn' in the database
      const { error } = await supabase
        .from('job_applications_v2')
        .update({ 
          status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id)
        .eq('applicant_id', user.id); // Security check

      if (error) {
        throw error;
      }

      // Update local state
      setApplication(prev => ({
        ...prev,
        status: 'withdrawn',
        updatedAt: new Date().toISOString()
      }));

      // Show success message
      console.log('Application withdrawn successfully');
      showSuccess(t('applicationDetails.errors.applicationWithdrawn'));
      
      // Navigate back to applications page after a short delay
      setTimeout(() => {
        navigate('/dashboard/applications');
      }, 1500);

    } catch (error) {
      console.error('Error withdrawing application:', error);
      setError(t('applicationDetails.errors.tryAgain'));
      showError(t('applicationDetails.errors.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || !conversation?.id || !user?.id) {
      console.error('Cannot send message: missing conversation or user');
      return;
    }

    setIsSendingMessage(true);

    try {
      console.log('Sending real message to conversation:', conversation.id);
      
      // Use the real messaging system
      const success = await sendRealMessage(conversation.id, message.trim());
      
      if (success) {
        console.log('Message sent successfully');
        showSuccess('Message sent successfully');
        
        // Refresh the conversation to get updated messages
        const updatedConversation = await getOrCreateConversation(
          application.id,
          `Application for ${job?.title || 'Job Position'}`
        );
        
        if (updatedConversation?.messages) {
          setMessages(updatedConversation.messages);
        }
      } else {
        showError('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      console.log('Downloading document:', doc);
      
      if (doc.type === 'cover_note') {
        // For cover notes, create a text file
        const blob = new Blob([doc.content || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${doc.name}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        let downloadUrl;
        
        // Check if document has a direct signedURL (from API response)
        if (doc.signedURL) {
          downloadUrl = doc.signedURL;
        } else {
          // Use the store's getDocumentUrl function as fallback
          downloadUrl = await getDocumentUrl(doc.id);
        }
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = doc.file_name || doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'info';
      case 'reviewing': return 'warning';
      case 'interview_scheduled': return 'secondary';
      case 'offer_received': return 'success';
      case 'rejected': return 'error';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'applied': return 'Application Submitted';
      case 'reviewing': return 'Under Review';
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'offer_received': return 'Offer Received';
      case 'rejected': return 'Not Selected';
      case 'withdrawn': return 'Withdrawn';
      default: return status;
    }
  };

  const getPipelineSteps = () => {
    const baseSteps = [
      { id: 'applied', title: 'Applied', subtitle: 'Submitted' },
      { id: 'reviewing', title: 'Review', subtitle: 'In Progress' },
      { id: 'interviewing', title: 'Interview', subtitle: 'Scheduled' },
      { id: 'offer', title: 'Offer', subtitle: 'Decision' },
      { id: 'hired', title: 'Hired', subtitle: 'Success' }
    ];

    let currentStepIndex = 0;
    switch (application?.status) {
      case 'applied': currentStepIndex = 0; break;
      case 'reviewing': currentStepIndex = 1; break;
      case 'interviewing': currentStepIndex = 2; break;
      case 'offer_received': currentStepIndex = 3; break;
      case 'offer_accepted': currentStepIndex = 4; break;
      case 'hired': currentStepIndex = 4; break;
      case 'rejected': currentStepIndex = -1; break;
      default: currentStepIndex = 0;
    }

    return { steps: baseSteps, currentStep: currentStepIndex };
  };

  const renderStatusSpecificContent = () => {
    if (!application) return null;

    // Only show withdraw button for regular applications (not direct interviews) and certain statuses
    const canWithdraw = !application.isDirectInterview && 
      ['applied', 'reviewing'].includes(application.status);

    switch (application.status) {
      case 'applied':
        return <AppliedState application={application} job={job} onWithdraw={canWithdraw ? handleWithdrawApplication : undefined} />;
      case 'reviewing':
        return <ReviewingState application={application} job={job} onWithdraw={canWithdraw ? handleWithdrawApplication : undefined} />;
      case 'interviewing':
        return <InterviewScheduledState application={{...application, onRefresh: handleRefresh}} job={job} />;
      case 'offer_received':
        return <OfferReceivedState application={application} job={job} />;
      case 'hired':
        return <HiredState application={application} job={job} />;
      case 'rejected':
        return <RejectedState application={application} job={job} />;
      default:
        return <AppliedState application={application} job={job} onWithdraw={canWithdraw ? handleWithdrawApplication : undefined} />;
    }
  };

  const handleRefresh = async () => {
    if (!applicationId || !user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Check if this is a direct interview
      const isDirectInterview = applicationId.startsWith('direct-interview-');
      
      if (isDirectInterview) {
        // Handle direct interview refresh
        const actualInterviewId = applicationId.replace('direct-interview-', '');
        
        const { data: interviewData, error: interviewError } = await supabase
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
            job:jobs!job_applications_v2_job_id_fkey (
              id,
              title,
              description,
              location,
              job_type,
              salary_range,
              is_remote,
              experience_level,
              skills_required,
              requirements,
              responsibilities,
              companies:company_id (
                id,
                name,
                logo_url,
                industry,
                size,
                website
              )
            )
          `)
          .eq('id', actualInterviewId)
          .is('application_id', null)
          .single();

        if (interviewError) throw interviewError;
        if (!interviewData) throw new Error('Direct interview not found');

        // Create mapped application for direct interview
        const mappedApplication = {
          id: applicationId,
          isDirectInterview: true,
          status: 'interviewing',
          appliedDate: interviewData.interview_date || new Date().toISOString(),
          updatedAt: interviewData.interview_date || new Date().toISOString(),
          matchScore: 90, // High score for direct interviews since they were invited
          applicationId: applicationId,
          lastUpdated: interviewData.interview_date || new Date().toISOString(),
          appliedVia: 'Direct Invitation',
          estimatedTimeline: 'Interview scheduled',
          documents: {
            resumeId: null,
            coverLetterId: null,
            additionalDocumentIds: []
          },
          personalInfo: {},
          jobSpecific: {},
          customQuestions: {}
        };

        // Map interview data
        const interviewDate = new Date(interviewData.interview_date);
        mappedApplication.interview = {
          id: interviewData.id,
          date: interviewDate.toISOString().split('T')[0],
          time: interviewDate.toTimeString().split(' ')[0].substring(0, 5),
          duration: interviewData.duration_minutes || 60,
          type: interviewData.interview_type,
          format: interviewData.interview_format,
          platform: interviewData.interview_format === 'video' ? 'Video Call' : 
                   interviewData.interview_format === 'phone' ? 'Phone Call' : 'In Person',
          location: interviewData.location,
          meetingLink: interviewData.meeting_link,
          agenda: interviewData.agenda,
          notes: interviewData.notes,
          status: interviewData.status,
          round: 1,
          totalRounds: 1,
          canReschedule: interviewData.status === 'scheduled',
            instructions: interviewData.agenda || t('applicationDetails.directInterview.instructions'),
          interviewer: interviewData.interviewer ? {
            id: interviewData.interviewer.id,
            name: interviewData.interviewer.full_name || 'Interviewer',
            title: 'Hiring Manager',
            avatar: interviewData.interviewer.avatar_url || null,
            bio: 'Experienced hiring professional.',
            linkedin: `https://linkedin.com/in/${interviewData.interviewer.full_name?.toLowerCase().replace(/\s+/g, '-')}`
          } : null
        };

        // Map job data
        const jobData = interviewData.jobs;
        const mappedJob = {
          id: jobData.id,
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          jobType: jobData.job_type,
          salary: jobData.salary_range ?
            (typeof jobData.salary_range === 'object' && jobData.salary_range.min && jobData.salary_range.max ?
              `€${jobData.salary_range.min} - €${jobData.salary_range.max}` :
              jobData.salary_range) : '',
          isRemote: jobData.is_remote,
          experienceLevel: jobData.experience_level,
          requiredSkills: jobData.skills_required || [],
          requirements: jobData.requirements,
          responsibilities: jobData.responsibilities,
          company: jobData.companies?.name || '',
          companyLogo: jobData.companies?.logo_url || '/default-company-logo.png',
          companyIndustry: jobData.companies?.industry || '',
          companySize: jobData.companies?.size || '',
          companyWebsite: jobData.companies?.website || ''
        };

        console.log('Generating timeline for direct interview refresh with appliedDate:', mappedApplication.appliedDate);
        setApplication(mappedApplication);
        setJob(mappedJob);
        const timeline = generateTimeline(mappedApplication);
        console.log('Generated timeline for refresh:', timeline);
        setTimeline(timeline);
        setMessages(generateMessages(mappedApplication));
        setLoading(false);
        return;
      }

      // Handle regular application refresh
      // Fetch user skills first using jobsStore
      const skills = await jobsStoreFetchUserSkills(user.id);
      setUserSkills(skills);

      const { data: applicationData, error: applicationError } = await supabase
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
          applicant:profiles!job_applications_v2_applicant_id_fkey(*),
          job:jobs!job_applications_v2_job_id_fkey (
            id,
            title,
            description,
            location,
            job_type,
            salary_range,
            is_remote,
            experience_level,
            skills_required,
            requirements,
            responsibilities,
            companies:company_id (
              id,
              name,
              logo_url,
              industry,
              size,
              website
            )
          ),
          interviews:interviews!job_application_id (
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
            interviewer:interviewer_id (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', applicationId)
        .eq('applicant_id', user.id)
        .single();

      if (applicationError && applicationError.code !== 'PGRST116') throw applicationError;

      if (!applicationData) {
        throw new Error('Application not found');
      }

      // Map the data (same as in loadApplicationData)
      const mappedApplication = {
        id: applicationData.id,
        jobId: applicationData.job_id,
        applicantId: applicationData.applicant_id,
        status: applicationData.status,
        appliedDate: applicationData.application_date,
        updatedAt: applicationData.updated_at,
        coverNote: applicationData.cover_note,
        matchScore: applicationData.ai_match_score || 0, // Will be updated after mappedJob is created
        applicationId: applicationData.id,
        lastUpdated: applicationData.updated_at,
        appliedVia: 'Velai Platform',
        estimatedTimeline: 'ASAP',
        // New fields from updated schema
        documents: {
          resumeId: applicationData.resume_id,
          coverLetterId: applicationData.cover_letter_id,
          additionalDocumentIds: applicationData.additional_document_ids || []
        },
        personalInfo: applicationData.applicant || {},
        jobSpecific: {
          availabilityDate: applicationData.availability_date,
          salaryExpectation: applicationData.salary_expectation,
          visaStatus: applicationData.visa_status,
          motivation: applicationData.motivation
        },
        customQuestions: applicationData.custom_questions || {}
      };

      // Map interview data from database if available
      if (applicationData.interviews && applicationData.interviews.length > 0) {
        // Get the most recent scheduled interview
        const latestInterview = applicationData.interviews
          .filter(interview => interview.status === 'scheduled')
          .sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date))[0];
        
        if (latestInterview) {
          const interviewDate = new Date(latestInterview.interview_date);
          
          mappedApplication.interview = {
            id: latestInterview.id,
            date: interviewDate.toISOString().split('T')[0], // YYYY-MM-DD format
            time: interviewDate.toTimeString().split(' ')[0].substring(0, 5), // HH:MM format
            duration: latestInterview.duration_minutes || 60,
            type: latestInterview.interview_type,
            format: latestInterview.interview_format,
            platform: latestInterview.interview_format === 'video' ? 'Video Call' : 
                     latestInterview.interview_format === 'phone' ? 'Phone Call' : 'In Person',
            location: latestInterview.location,
            meetingLink: latestInterview.meeting_link,
            agenda: latestInterview.agenda,
            notes: latestInterview.notes,
            status: latestInterview.status,
            round: latestInterview.interview_type === '1st_interview' ? 1 : 
                   latestInterview.interview_type === 'technical' ? 2 :
                   latestInterview.interview_type === 'hr_interview' ? 3 :
                   latestInterview.interview_type === 'final' ? 4 : 1,
            totalRounds: 4, // This could be dynamic based on job requirements
            canReschedule: latestInterview.status === 'scheduled',
            instructions: latestInterview.agenda || t('applicationDetails.directInterview.instructions'),
            interviewer: latestInterview.interviewer ? {
              id: latestInterview.interviewer.id,
              name: latestInterview.interviewer.full_name || 'Interviewer',
              title: 'Hiring Manager',
              avatar: latestInterview.interviewer.avatar_url || null,
              bio: 'Experienced hiring professional.',
              linkedin: `https://linkedin.com/in/${latestInterview.interviewer.full_name?.toLowerCase().replace(/\s+/g, '-')}`
            } : null
          };
        }
      }

      const jobData = applicationData.jobs;
      const mappedJob = {
        id: jobData.id,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        jobType: jobData.job_type,
        salary: jobData.salary_range ?
          (typeof jobData.salary_range === 'object' && jobData.salary_range.min && jobData.salary_range.max ?
            `€${jobData.salary_range.min} - €${jobData.salary_range.max}` :
            jobData.salary_range) : '',
        isRemote: jobData.is_remote,
        experienceLevel: jobData.experience_level,
        requiredSkills: jobData.skills_required || [],
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities,
        company: jobData.companies?.name || '',
        companyLogo: jobData.companies?.logo_url || '/default-company-logo.png',
        companyIndustry: jobData.companies?.industry || '',
        companySize: jobData.companies?.size || '',
        companyWebsite: jobData.companies?.website || ''
      };

      // Get match score from jobsStore (same as JobCard)
      const jobFromStore = getJobById(jobData.id);
      if (jobFromStore && jobFromStore.matchScore !== undefined) {
        mappedApplication.matchScore = jobFromStore.matchScore;
        console.log('Using match score from jobsStore (refresh):', jobFromStore.matchScore);
      } else {
        // Fallback: calculate match score using jobsStore's comprehensive calculation
        const userSkills = await jobsStoreFetchUserSkills(user.id);
        const userProfile = await jobsStoreFetchUserProfile(user.id);
        
        const calculatedScore = jobsStoreCalculateMatchScore(jobData, userProfile, userSkills);
        console.log('Calculated match score (refresh - fallback):', {
          userSkills,
          userProfile: userProfile ? 'available' : 'not available',
          jobSkills: jobData.skills_required,
          calculatedScore
        });
        mappedApplication.matchScore = calculatedScore;
      }

      // Use the helper functions defined above

      setApplication({
        ...mappedApplication,
        jobMatchDetails: generateJobMatchDetails(mappedApplication, jobData),
        companyInsights: generateCompanyInsights(jobData)
      });
      setJob(mappedJob);
      setTimeline(generateTimeline(mappedApplication));
      setMessages(generateMessages(mappedApplication));
      showUpdateNotification();

    } catch (err) {
      console.error('Error refreshing application:', err);
      setError(err.message || 'Failed to refresh application data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-lg p-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">{t('applicationDetails.errors.loadingTitle')}</h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <div className="mt-4 space-x-4">
              <Button variant="primary" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('applicationDetails.errors.tryAgain')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/applications')}>
                {t('applicationDetails.errors.backToApplications')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">{t('applicationDetails.errors.notFoundTitle')}</h2>
            <p className="text-gray-600 mt-2">{t('applicationDetails.errors.notFoundMessage')}</p>
            <div className="mt-4 space-x-4">
              <Button variant="primary" onClick={() => navigate('/dashboard/applications')}>
                {t('applicationDetails.errors.backToApplications')}
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('applicationDetails.errors.refresh')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { steps, currentStep } = getPipelineSteps();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      {application.status !== 'rejected' && application.status !== 'withdrawn' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Badge variant={getStatusColor(application.status)}>
                  {getStatusText(application.status)}
                </Badge>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{job.company}</span>
                  </div>
                  <span>•</span>
                  <span>Applied {new Date(application.appliedDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>ID: {application.applicationId}</span>
                </div>
              </div>
              

            </div>
            <ProgressBar 
              steps={steps} 
              currentStep={currentStep}
              variant={application.status === 'offer_received' ? 'success' : 'default'}
            />

          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: t('applicationDetails.tabs.overview'), icon: Eye },
                  { id: 'timeline', name: t('applicationDetails.tabs.timeline'), icon: Calendar },
                  { id: 'documents', name: t('applicationDetails.tabs.documents'), icon: FileText },
                  { id: 'details', name: t('applicationDetails.tabs.details'), icon: User },
                  { id: 'messages', name: t('applicationDetails.tabs.messages'), icon: MessageCircle }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                        ${activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                      {tab.id === 'messages' && application.messages?.some(m => !m.read) && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-2 h-2"></span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && renderStatusSpecificContent()}
            
            {activeTab === 'timeline' && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('applicationDetails.tabs.timeline')}</h3>
                <Timeline items={timeline} />
              </Card>
            )}
            
            {activeTab === 'documents' && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('applicationDetails.tabs.documents')}</h3>
                <div className="space-y-4">
                  {documentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">{t('applicationDetails.documents.loading')}</p>
                    </div>
                  ) : (
                    <>
                      {/* Filter documents to only show those submitted with this application */}
                      {(() => {
                        const submittedDocumentIds = [
                          application?.documents?.resumeId,
                          application?.documents?.coverLetterId,
                          ...(application?.documents?.additionalDocumentIds || [])
                        ].filter(Boolean);

                        const submittedDocuments = documents.filter(doc => 
                          submittedDocumentIds.includes(doc.id)
                        );

                        if (submittedDocuments.length === 0 && !application?.coverNote) {
                          return (
                            <div className="text-center py-8">
                              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">{t('applicationDetails.documents.none')}</p>
                            </div>
                          );
                        }

                        return (
                          <>
                            {/* Submitted Documents */}
                            {submittedDocuments.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-8 h-8 text-gray-400" />
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-gray-900">{doc.file_name}</h4>
                                      {doc.is_verified && (
                                        <Badge variant="success" size="sm">
                                          {t('applicationDetails.documents.verified')}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {Math.round(doc.file_size / 1024)} KB • {doc.file_type} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                                    </p>
                                    {doc.verify_notes && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        {doc.verify_notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="success">
                                    {t('applicationDetails.documents.submitted')}
                                  </Badge>
                                  <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(doc)}>
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Cover Note if available */}
                            {application?.coverNote && (
                              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-8 h-8 text-gray-400" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{t('applicationDetails.documents.coverNote')}</h4>
                                    <p className="text-sm text-gray-600">
                                      12 KB • {t('applicationDetails.documents.text')} • {t('applicationDetails.documents.addedOn', { date: new Date(application.appliedDate).toLocaleDateString() })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="success">
                                    Submitted
                                  </Badge>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDownloadDocument({
                                      type: 'cover_note',
                                      name: 'Cover Note',
                                      content: application.coverNote
                                    })}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Job Information */}
                {job && (
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('applicationDetails.jobInfo.title')}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.jobTitle')}</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{job.title}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.company')}</label>
                        <p className="text-sm text-gray-900 mt-1">{job.company}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.location')}</label>
                        <p className="text-sm text-gray-900 mt-1 flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {job.location}
                          {job.isRemote && (
                            <Badge variant="info" size="sm" className="ml-2">{t('applicationDetails.jobInfo.remote')}</Badge>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.jobType')}</label>
                        <p className="text-sm text-gray-900 mt-1 capitalize">{job.jobType?.replace('_', ' ')}</p>
                      </div>

                      {job.salary && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.salaryRange')}</label>
                          <p className="text-sm text-gray-900 mt-1 flex items-center">
                            <Euro className="w-4 h-4 mr-1 text-gray-400" />
                            {job.salary}
                          </p>
                        </div>
                      )}

                      {job.experienceLevel && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.experienceLevel')}</label>
                          <p className="text-sm text-gray-900 mt-1 capitalize">{job.experienceLevel}</p>
                        </div>
                      )}

                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.requiredSkills')}</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {job.requiredSkills.map((skill, index) => (
                              <Badge key={index} variant="secondary" size="sm">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {job.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.jobDescription')}</label>
                          <p className="text-sm text-gray-900 mt-1 leading-relaxed">{job.description}</p>
                        </div>
                      )}

                      {job.requirements && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.requirements')}</label>
                          <p className="text-sm text-gray-900 mt-1 leading-relaxed">{job.requirements}</p>
                        </div>
                      )}

                      {job.responsibilities && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">{t('applicationDetails.jobInfo.responsibilities')}</label>
                          <p className="text-sm text-gray-900 mt-1 leading-relaxed">{job.responsibilities}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Custom Questions - Only show for regular applications */}
                {!application.isDirectInterview && application.customQuestions && Object.keys(application.customQuestions).length > 0 && (
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('applicationDetails.jobInfo.additionalQuestions')}</h3>
                    <div className="space-y-4">
                      {Object.entries(application.customQuestions).map(([questionId, answer]) => (
                        <div key={questionId}>
                          <label className="text-sm font-medium text-gray-600">
                            {questionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          <p className="text-sm text-gray-900 mt-1">{answer}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
            
            {activeTab === 'messages' && (
              <MessageThread 
                messages={messages} 
                onSendMessage={handleSendMessage}
                isLoading={isSendingMessage || messagesLoading}
                disabled={!conversation?.id}
                currentUserId={user?.id}
              />
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsPage;
