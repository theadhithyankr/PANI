import React, { useEffect } from 'react';
import { Plus, Search, Filter, Loader } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import JobCard from '../../components/employer/JobCard';

import CreateJobModal from '../../components/employer/CreateJobModal';
import { formatDistanceToNow } from 'date-fns';
import { useJobPost } from '../../hooks/employer';
import { useJobsStore } from '../../stores/jobsStore';
import toast from 'react-hot-toast';

const EmptyState = ({ searchTerm, statusFilter, onClearFilters, onCreateJob }) => {
  const { t } = useTranslation('employer');
  const isFiltering = searchTerm || statusFilter !== 'all';

  return (
    <div className="relative w-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-lg border border-gray-100 bg-white/50">
      <div className="w-16 h-16 mb-6 text-gray-300">
        <Search className="w-full h-full" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {t('jobsPage.noJobsFound')}
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        {isFiltering 
          ? t('jobsPage.adjustFilters')
          : t('jobsPage.createFirstJobPrompt')}
      </p>
      {isFiltering ? (
        <Button 
          variant="outline" 
          onClick={onClearFilters}
          className="bg-white hover:bg-gray-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          {t('jobsPage.clearFilters')}
        </Button>
      ) : (
        <Button 
          variant="primary"
          onClick={onCreateJob}
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('jobsPage.createYourFirstJob')}
        </Button>
      )}
    </div>
  );
};

const JobsPage = () => {
  const { t } = useTranslation('employer');
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    loading: jobsLoading, 
    error: jobsError,
    jobs,
    listJobs,
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob
  } = useJobPost();

  // Get store loading separately to avoid full page spinner on individual actions
  const storeLoading = useJobsStore((state) => state.isLoading);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [loadingStates, setLoadingStates] = React.useState({
    create: false,
    update: false,
    delete: false,
    statusUpdate: {}  // Track status updates by job ID
  });

  // Fetch jobs on component mount only
  useEffect(() => {
    // Only fetch jobs on initial mount, not on every navigation
    listJobs().catch(err => {
      console.error('Error fetching jobs:', err);
      toast.error(t('jobsPage.failedToLoadJobs'));
    });
  }, [listJobs, t]);

  // Refresh jobs when coming from create job page
  useEffect(() => {
    const fromCreateJob = location.state?.fromCreateJob;
    if (fromCreateJob) {
      // Force refresh only when coming from create job page
      listJobs(true).catch(err => {
        console.error('Error refreshing jobs:', err);
        toast.error(t('jobsPage.failedToLoadJobs'));
      });
      // Clear the state to prevent repeated refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, listJobs, navigate, location.pathname, t]);

  const statusOptions = [
    { value: 'all', label: t('jobsPage.allJobs') },
    { value: 'active', label: t('jobsPage.active') },
    { value: 'draft', label: t('jobsPage.draft') },
    { value: 'paused', label: t('jobsPage.paused') },
    { value: 'closed', label: t('jobsPage.closed') },
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pinnedJobs = filteredJobs.filter(job => job.is_pinned);
  const regularJobs = filteredJobs.filter(job => !job.is_pinned);

  const handleViewJob = (job) => {
    navigate(`/v4/employer/hiring-process/${job.id}`);
  };

  const handleEditJob = (job) => {
    console.log('handleEditJob called with job:', job);
    // Find the original job data from the jobs array
    const originalJob = jobs.find(j => j.id === job.id);
    console.log('Found original job:', originalJob);
    if (originalJob) {
      console.log('Navigating to create page with original job data');
      navigate('/dashboard/employer/jobs/create', { state: { editJob: originalJob } });
    } else {
      // Fallback to the formatted job data if original not found
      console.log('Navigating to create page with formatted job data');
      navigate('/dashboard/employer/jobs/create', { state: { editJob: job } });
    }
  };



  const handleAction = async (action, jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    try {
      switch (action) {
        case 'view':
          handleViewJob(job);
          break;
        case 'edit':
          handleEditJob(job);
          break;
        case 'delete':
          if (window.confirm(t('jobsPage.deleteJobConfirmation'))) {
            setLoadingStates(prev => ({ ...prev, delete: true }));
            await deleteJob(jobId);
            toast.success(t('jobsPage.jobDeletedSuccess'));
            setLoadingStates(prev => ({ ...prev, delete: false }));
          }
          break;
        case 'pause':
          setLoadingStates(prev => ({ 
            ...prev, 
            statusUpdate: { ...prev.statusUpdate, [jobId]: true } 
          }));
          await updateJobStatus(jobId, 'draft');
          toast.success(t('jobsPage.jobPausedSuccess'));
          setLoadingStates(prev => ({ 
            ...prev, 
            statusUpdate: { ...prev.statusUpdate, [jobId]: false } 
          }));
          break;
        case 'activate':
          setLoadingStates(prev => ({ 
            ...prev, 
            statusUpdate: { ...prev.statusUpdate, [jobId]: true } 
          }));
          await updateJobStatus(jobId, 'active');
          toast.success(t('jobsPage.jobActivatedSuccess'));
          setLoadingStates(prev => ({ 
            ...prev, 
            statusUpdate: { ...prev.statusUpdate, [jobId]: false } 
          }));
          break;
        default:
          console.log(`Action: ${action}, Job ID: ${jobId}`);
      }
    } catch (err) {
      console.error('Error performing action:', err);
      toast.error(t(action === 'delete' ? 'jobsPage.failedToDeleteJob' : action === 'pause' ? 'jobsPage.failedToPauseJob' : 'jobsPage.failedToUpdateJob'));
      if (action === 'delete') {
        setLoadingStates(prev => ({ ...prev, delete: false }));
      } else if (action === 'pause' || action === 'activate') {
        setLoadingStates(prev => ({ 
          ...prev, 
          statusUpdate: { ...prev.statusUpdate, [jobId]: false } 
        }));
      }
    }
  };

  const handleCreateJob = async (jobData) => {
    setLoadingStates(prev => ({ ...prev, create: true }));
    try {
      await createJob(jobData);
      setShowCreateModal(false);
      toast.success(t('jobsPage.jobCreatedSuccess'));
    } catch (err) {
      console.error('Error creating job:', err);
      toast.error(t('jobsPage.failedToCreateJob'));
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false }));
    }
  };

  const handleCreateWithAI = () => {
    // TODO: Implement AI job creation
    console.log('Create job with AI');
  };

  const formatJobData = (job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    status: job.status,
    location: job.location,
    workModel: job.is_remote ? t('jobsPage.remote') : job.is_hybrid ? t('jobsPage.hybrid') : t('jobsPage.onSite'),
    salary: job.salary_range ? `${job.salary_range.min} - ${job.salary_range.max}` : t('jobsPage.notSpecified'),
    time: job.created_at ? `${formatDistanceToNow(new Date(job.created_at))} ${t('jobsPage.ago')}` : '',
    applicants: job.applications_count || 0,
    newApplicants: job.new_applications_count || 0,
    views: job.views_count || 0,
    matches: job.matches_count || 0,
    isPinned: job.is_pinned || false,
    isLoading: loadingStates.statusUpdate[job.id] || loadingStates.delete,
    // Add missing fields for the modal
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    skills_required: job.skills_required,
    benefits: job.benefits,
    salary_range: job.salary_range,
    is_remote: job.is_remote,
    is_hybrid: job.is_hybrid,
    job_type: job.job_type,
    experience_level: job.experience_level,
    application_deadline: job.application_deadline,
    start_date: job.start_date,
    drivers_license: job.drivers_license,
    additional_questions: job.additional_questions,
    preferred_language: job.preferred_language,
    priority: job.priority,
    visa_sponsorship: job.visa_sponsorship,
    relocation: job.relocation,
    equity: job.equity,
    company_id: job.company_id,
    companies: job.companies,
    created_at: job.created_at,
    updated_at: job.updated_at
  });

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (jobsError) {
    return (
      <div className="text-center text-red-600 py-8">
        {t('jobsPage.errorLoadingJobs')}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('jobsPage.jobManagement')}</h1>
          <p className="text-gray-600 mt-1">{t('jobsPage.manageJobsPrompt')}</p>
        </div>
        <Button onClick={() => navigate('/dashboard/employer/jobs/create')} className="bg-primary hover:bg-primary-600">
          <Plus className="w-4 h-4 mr-2" />
          {t('jobsPage.createJob')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            type="text"
            placeholder={t('jobsPage.searchJobsPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            className="w-full"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            aria-label={t('jobsPage.filterByStatus')}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState 
          searchTerm={searchTerm} 
          statusFilter={statusFilter}
          onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}
          onCreateJob={() => navigate('/dashboard/employer/jobs/create')}
        />
      ) : (
        <div className="space-y-6">
          {pinnedJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('jobsPage.pinnedJobs')}</h2>
              <div className="space-y-4">
                {pinnedJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={formatJobData(job)} 
                    onAction={handleAction} 
                  />
                ))}
              </div>
            </div>
          )}
          
          {regularJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('jobsPage.allOpenJobs')}</h2>
              <div className="space-y-4">
                {regularJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={formatJobData(job)} 
                    onAction={handleAction} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateJobModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateJob}
        onGenerateWithAI={handleCreateWithAI}
        loading={loadingStates.create}
      />
    </div>
  );
};

export default JobsPage;
