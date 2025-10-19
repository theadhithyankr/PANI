import React, { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Euro, Briefcase, Heart, Grid, List, Star, Languages, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import JobCard from '../../components/candidate/JobCard';
import JobDetailModal from '../../components/candidate/JobDetailModal';
import ApplicationModal from '../../components/candidate/ApplicationModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth, useToast } from '../../hooks/common';
import useJobsStore from '../../store/jobsStore';

const JobSearchPage = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  
  // Get state and actions from the store
  const {
    jobs,
    filteredJobs,
    savedJobs,
    appliedJobs,
    loading,
    error,
    userSkills,
    userProfile,
    filterOptions,
    filterOptionsLoading,
    filters,
    sortBy,
    viewMode,
    selectedJob,
    showJobDetail,
    showApplicationModal,
    applicationJob,
    setViewMode,
    setSelectedJob,
    setShowJobDetail,
    setShowApplicationModal,
    setApplicationJob,
    setFilters,
    setSortBy,
    fetchJobs,
    fetchFilterOptions,
    toggleSaveJob,
    addAppliedJob,
    clearFilters,
    getJobStats
  } = useJobsStore();

  // Fetch jobs and filter options on component mount
  useEffect(() => {
    if (user?.id) {
      fetchJobs({}, user.id);
      fetchFilterOptions();
    }
  }, [user?.id]);

  const handleSaveJob = (job) => {
    toggleSaveJob(job.id);
  };

  const handleApplyJob = (job) => {
    setApplicationJob(job);
    setShowApplicationModal(true);
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  const handleApplicationSubmit = (applicationData) => {
    try {
      // Add the job to applied jobs list in the store
      addAppliedJob(applicationData.jobId || applicationData.job_id);
      showSuccess('🎉 Application submitted successfully!');
      
      // Navigate to job search page after a short delay to show the toast
      setTimeout(() => {
        navigate('/dashboard/jobs');
      }, 1500);
    } catch (error) {
      showError('Failed to submit application. Please try again.');
    }
  };

  const handleSortChange = (value) => {
    setSortBy(value);
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMatchScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  const stats = getJobStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-4xl">!</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading jobs</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button variant="outline" onClick={() => fetchJobs()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Search</h1>
          <p className="text-gray-600 mt-1">Discover opportunities that match your skills and aspirations</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search jobs, companies, or skills..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ searchTerm: e.target.value })}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            options={filterOptions.locations.length > 0 ? filterOptions.locations : [{ value: 'all', label: 'All Locations' }]}
            value={filters.location}
            onChange={(value) => setFilters({ location: value })}
            placeholder={filterOptionsLoading ? "Loading..." : "Location"}
            disabled={filterOptionsLoading}
          />
          <Select
            options={filterOptions.jobTypes.length > 0 ? filterOptions.jobTypes : [{ value: 'all', label: 'All Types' }]}
            value={filters.jobType}
            onChange={(value) => setFilters({ jobType: value })}
            placeholder={filterOptionsLoading ? "Loading..." : "Job Type"}
            disabled={filterOptionsLoading}
          />
          <Select
            options={filterOptions.experienceLevels}
            value={filters.experience}
            onChange={(value) => setFilters({ experience: value })}
            placeholder="Experience Level"
          />
          <Select
            options={filterOptions.languages}
            value={filters.language}
            onChange={(value) => setFilters({ language: value })}
            placeholder="Language"
          />
        </div>
        
        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <Select
            options={filterOptions.salaryRanges}
            value={filters.salary}
            onChange={(value) => setFilters({ salary: value })}
            placeholder="Salary Range"
          />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="flex-1"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredJobs.length} Jobs Found
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Sort by:</span>
            <select 
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="match-score">Best Match</option>
              <option value="relevance">Most Relevant</option>
              <option value="newest">Newest First</option>
              <option value="salary-high">Salary: High to Low</option>
              <option value="salary-low">Salary: Low to High</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center border border-gray-300 rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none border-r-0"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remote Jobs</p>
              <p className="text-xl font-bold text-green-600">{stats.remoteJobs}</p>
            </div>
            <MapPin className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
              <p className="text-xl font-bold text-pink-600">{stats.savedJobs}</p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-xl font-bold text-purple-600">{stats.appliedJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Match</p>
              <p className="text-xl font-bold text-orange-600">
                {filteredJobs.length > 0 
                  ? Math.round(filteredJobs.reduce((sum, job) => sum + (job.matchScore || 0), 0) / filteredJobs.length)
                  : 0}%
              </p>
            </div>
            <Star className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Match Score Legend */}
      {userProfile && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Match Score Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>80-100%: Excellent Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>60-79%: Good Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>40-59%: Fair Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>0-39%: Poor Match</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Match scores are calculated based on your skills, experience, language proficiency, location preferences, and salary expectations.
          </p>
        </div>
      )}

      {/* Jobs Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onSave={handleSaveJob}
            onApply={handleApplyJob}
            onView={handleViewJob}
            isSaved={savedJobs.includes(job.id)}
            hasApplied={appliedJobs.includes(job.id)}
            userSkills={userSkills}
          />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching jobs found</h3>
          <p className="text-gray-600 mb-6">
            No jobs found matching your search criteria. Try adjusting your filters or check back later for new opportunities.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={showJobDetail}
        onClose={() => {
          setShowJobDetail(false);
          setSelectedJob(null);
        }}
        onApply={(job) => {
          setShowJobDetail(false);
          handleApplyJob(job);
        }}
        onSave={handleSaveJob}
        isSaved={selectedJob && savedJobs.includes(selectedJob.id)}
        hasApplied={selectedJob && appliedJobs.includes(selectedJob.id)}
        userSkills={userSkills}
      />

      {/* Application Modal */}
      <ApplicationModal
        job={applicationJob}
        isOpen={showApplicationModal}
        onClose={() => {
          setShowApplicationModal(false);
          setApplicationJob(null);
        }}
        onSubmit={handleApplicationSubmit}
      />
    </div>
  );
};

export default JobSearchPage;
