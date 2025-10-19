import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Loader,
  Search,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import InterviewCalendar from '../../components/employer/InterviewCalendar';
import InterviewList from '../../components/employer/InterviewList';
import InterviewSchedulingModal from '../../components/hiring/InterviewSchedulingModal';
import InterviewDetailModal from '../../components/employer/InterviewDetailModal';
import { useInterviews } from '../../hooks/employer';
import toast from 'react-hot-toast';

const EmptyState = ({ onSchedule }) => {
  const { t } = useTranslation('employer');
  return (
    <div className="text-center py-16 px-4 bg-gray-50 rounded-lg">
      <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-700">{t('interviewsPage.emptyState.title')}</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">{t('interviewsPage.emptyState.message')}</p>
      <Button onClick={onSchedule}>
        <Plus className="w-4 h-4 mr-2" />
        {t('interviewsPage.controls.scheduleInterview')}
      </Button>
    </div>
  );
};

const InterviewsPage = () => {
  const { t } = useTranslation('employer');
  const navigate = useNavigate();
  const { 
    interviews, 
    loading: interviewsLoading, 
    error: interviewsError,
    fetchInterviews,
    createInterview,
    updateInterview,
    deleteInterview,
    getInterviewsByDateRange
  } = useInterviews();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [interviewDetails, setInterviewDetails] = useState({
    interview_date: '',
    interview_time: '',
    interview_type: 'online',
    interview_format: 'video_call',
    duration_minutes: 60,
    location: '',
    interviewer_id: '',
    agenda: '',
  });
  const [loadingStates, setLoadingStates] = useState({
    create: false,
    update: false,
    delete: false
  });
  const [view, setView] = useState('list'); // 'list' or 'calendar'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeJobTab, setActiveJobTab] = useState('all');

  // Helper function to get interviews for a specific week
  const getInterviewsForWeek = (date) => {
    if (!interviews || !Array.isArray(interviews)) {
      return [];
    }

    // Get the start of the week (Sunday)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get the end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return interviews.filter(interview => {
      if (!interview.interview_date) return false;
      const interviewDate = new Date(interview.interview_date);
      return interviewDate >= startOfWeek && interviewDate <= endOfWeek;
    });
  };

  // Fetch interviews on component mount
  useEffect(() => {
    const loadInterviews = async () => {
      try {
        await fetchInterviews();
      } catch (err) {
        console.error('Error fetching interviews:', err);
        toast.error(t('interviewsPage.toasts.loadError'));
      }
    };

    loadInterviews();
  }, [fetchInterviews, t]); // Now safe to include since fetchInterviews is memoized

  const handleScheduleInterview = (candidate) => {
    if (candidate) {
      setSelectedCandidate(candidate);
      setInterviewDetails({
        interview_date: '',
        interview_time: '',
        interview_type: 'online',
        interview_format: 'video_call',
        duration_minutes: 60,
        location: '',
        interviewer_id: '',
        agenda: '',
      });
      setShowScheduleModal(true);
      setSelectedInterview(null);
    } else {
      navigate('/dashboard/jobs');
    }
  };
  
  const handleViewInterview = (interview) => {
    setSelectedInterview(interview);
    setShowDetailModal(true);
  };

  const handleInterviewStatusUpdated = () => {
    // Refresh interviews data when status is updated
    console.log('Interview status updated, refreshing data...');
    fetchInterviews();
  };

  const handleReschedule = (interview) => {
    setSelectedInterview(interview);
    const candidate = {
      id: interview.seeker_id,
      name: interview.seeker_profile?.full_name,
      avatar: interview.seeker_profile?.avatar_url,
      job: interview.job?.title,
      company: interview.job?.companies?.name
    };
    setSelectedCandidate(candidate);
    setInterviewDetails({
        interview_date: interview.interview_date ? new Date(interview.interview_date).toISOString().split('T')[0] : '',
        interview_time: interview.interview_date ? new Date(interview.interview_date).toISOString().split('T')[1].substring(0, 5) : '',
        interview_type: interview.interview_type || 'online',
        interview_format: interview.interview_format || 'video_call',
        duration_minutes: interview.duration_minutes || 60,
        location: interview.location || '',
        interviewer_id: interview.interviewer_id || '',
        agenda: interview.agenda || '',
      });
    setShowDetailModal(false);
    setShowScheduleModal(true);
  };

  const handleDeleteInterview = async (interview) => {
    if (!window.confirm(t('interviewsPage.toasts.cancelConfirm'))) {
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, delete: true }));
      await deleteInterview(interview.id);
      toast.success(t('interviewsPage.toasts.cancelSuccess'));
      setShowDetailModal(false);
    } catch (err) {
      console.error('Error cancelling interview:', err);
      toast.error(t('interviewsPage.toasts.cancelError'));
    } finally {
      setLoadingStates(prev => ({ ...prev, delete: false }));
    }
  };

  const handleSelectInterview = (interview) => {
    handleViewInterview(interview);
  };

  const handleScheduleSubmit = async (details) => {
    try {
      const combinedDateTime = new Date(`${details.interview_date}T${details.interview_time}:00`);
      const interviewData = {
        ...details,
        interview_date: combinedDateTime.toISOString(),
      };
      delete interviewData.interview_time;

      if (selectedInterview) {
        // Update existing interview
        setLoadingStates(prev => ({ ...prev, update: true }));
        await updateInterview(selectedInterview.id, interviewData);
        toast.success(t('interviewsPage.toasts.updateSuccess'));
      } else {
        // Create new interview
        setLoadingStates(prev => ({ ...prev, create: true }));
        await createInterview(interviewData);
        toast.success(t('interviewsPage.toasts.scheduleSuccess'));
      }
      setShowScheduleModal(false);
      setSelectedInterview(null);
      setSelectedCandidate(null);
    } catch (err) {
      console.error('Error scheduling interview:', err);
      toast.error(t('interviewsPage.toasts.scheduleError'));
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false, update: false }));
    }
  };
  
  const navigateWeek = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction * 7));
      return newDate;
    });
  };

  const statusOptions = [
    { value: 'all', label: t('interviewsPage.controls.all') },
    { value: 'scheduled', label: t('interviewsPage.controls.scheduled') },
    { value: 'completed', label: t('interviewsPage.controls.completed') },
    { value: 'cancelled', label: t('interviewsPage.controls.cancelled') },
    { value: 'hired', label: 'Hired' },
    { value: 'offered', label: 'Offered' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const filteredInterviews = useMemo(() => {
    return interviews
      .filter(interview => {
        // Handle status filtering - check both interview status and application status
        if (statusFilter !== 'all') {
          // For interview statuses (scheduled, completed, cancelled, rescheduled)
          if (['scheduled', 'completed', 'cancelled', 'rescheduled'].includes(statusFilter)) {
            if (interview.status !== statusFilter) {
              return false;
            }
          }
          // For application statuses (hired, offered, rejected, interviewing)
          else if (['hired', 'offered', 'rejected', 'interviewing'].includes(statusFilter)) {
            if (interview.application_status !== statusFilter) {
              return false;
            }
          }
        }
        
        if (activeJobTab !== 'all' && interview.job?.id !== activeJobTab) {
          return false;
        }
        if (searchTerm) {
          const candidateName = interview.seeker_profile?.full_name || '';
          const jobTitle = interview.job?.title || '';
          const lowerSearchTerm = searchTerm.toLowerCase();
          return (
            candidateName.toLowerCase().includes(lowerSearchTerm) ||
            jobTitle.toLowerCase().includes(lowerSearchTerm)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date));
  }, [interviews, searchTerm, statusFilter, activeJobTab]);

  const jobTabs = useMemo(() => {
    const jobs = interviews.reduce((acc, interview) => {
        if (interview.job && !acc.some(j => j.id === interview.job.id)) {
            acc.push(interview.job);
        }
        return acc;
    }, []);
    return [{ id: 'all', title: t('jobsPage.allJobs') }, ...jobs];
  }, [interviews, t]);

  // Loading state
  if (interviewsLoading && !interviews.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Error state
  if (interviewsError) {
    return (
      <div className="text-center text-red-600 py-8">
        <p className="text-lg font-medium mb-2">{t('interviewsPage.error.title')}</p>
        <p className="text-sm text-gray-500 mb-4">{interviewsError}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          {t('interviewsPage.error.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('interviewsPage.header.title')}</h1>
          <p className="text-gray-600 mt-1">{t('interviewsPage.header.subtitle')}</p>
        </div>
        <Button onClick={() => handleScheduleInterview()} className="bg-primary hover:bg-primary-600">
          <Plus className="w-4 h-4 mr-2" />
          {t('interviewsPage.controls.scheduleInterview')}
        </Button>
      </div>

      {/* Search, Filters, and View Switcher */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/2 lg:w-1/3">
          <Input
            placeholder={t('interviewsPage.controls.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <Button
              variant={view === 'list' ? 'solid' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className={view === 'list' ? 'bg-white shadow' : ''}
            >
              <List className="w-4 h-4 mr-2" /> {t('interviewsPage.controls.listView')}
            </Button>
            <Button
              variant={view === 'calendar' ? 'solid' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
              className={view === 'calendar' ? 'bg-white shadow' : ''}
            >
              <CalendarDays className="w-4 h-4 mr-2" /> {t('interviewsPage.controls.calendarView')}
            </Button>
          </div>
        </div>
      </div>

      {/* Job Tabs */}
      <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {jobTabs.map((tab) => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveJobTab(tab.id)}
                      className={`${
                          tab.id === activeJobTab
                              ? 'border-primary text-primary'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}
                      aria-current={tab.id === activeJobTab ? 'page' : undefined}
                  >
                      {tab.title}
                  </button>
              ))}
          </nav>
      </div>

      {/* Content */}
      {interviewsLoading && <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>}
      
      {!interviewsLoading && (
        <div>
          {view === 'list' ? (
            filteredInterviews.length > 0 ? (
              <InterviewList interviews={filteredInterviews} onSelectInterview={handleSelectInterview} />
            ) : (
              <EmptyState onSchedule={() => handleScheduleInterview()} />
            )
          ) : (
            <div>
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)}>
                              <ChevronLeft className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)}>
                              <ChevronRight className="w-5 h-5" />
                          </Button>
                      </div>
                      <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                          {t('interviewsPage.controls.today')}
                      </Button>
                </div>
              </div>
              <div className="w-full rounded-lg border border-gray-200 bg-white">
                  <InterviewCalendar
                      interviews={filteredInterviews}
                      currentDate={currentDate}
                      onInterviewClick={handleViewInterview}
                  />
              </div>
            </div>
          )}
        </div>
      )}

      {showScheduleModal && (
        <InterviewSchedulingModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedInterview(null);
            setSelectedCandidate(null);
            setInterviewDetails({
              interview_date: '',
              interview_time: '',
              interview_type: 'online',
              interview_format: 'video_call',
              duration: 30,
              location: '',
              interviewer: '',
              agenda: '',
            });
          }}
          onSchedule={handleScheduleSubmit}
          candidate={selectedCandidate}
          interviewDetails={interviewDetails}
          setInterviewDetails={setInterviewDetails}
          isLoading={loadingStates.create || loadingStates.update}
        />
      )}

      {showDetailModal && (
        <InterviewDetailModal
          interview={selectedInterview}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInterview(null);
          }}
          onReschedule={handleReschedule}
          onDelete={handleDeleteInterview}
          onStatusUpdated={handleInterviewStatusUpdated}
        />
      )}
    </div>
  );
};

export default InterviewsPage;
