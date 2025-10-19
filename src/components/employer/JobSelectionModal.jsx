import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Briefcase, MapPin, Calendar, Users } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { useJobPost } from '../../hooks/employer';

const JobSelectionModal = ({ isOpen, onClose, candidate, onSelectJob }) => {
  const { t } = useTranslation('employer');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { jobs, listJobs, loading: jobsLoading } = useJobPost();

  useEffect(() => {
    if (isOpen) {
      listJobs().catch(err => {
        console.error('Error fetching jobs:', err);
      });
    }
  }, [isOpen, listJobs]);

  if (!isOpen) return null;

  // Filter active jobs only
  const activeJobs = jobs.filter(job => job.status === 'active');

  // Filter jobs based on search term
  const filteredJobs = activeJobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectJob = async () => {
    if (!selectedJobId) return;
    
    setLoading(true);
    const selectedJob = jobs.find(job => job.id === selectedJobId);
    
    try {
      await onSelectJob(candidate, selectedJob);
      onClose();
    } catch (error) {
      console.error('Error shortlisting candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (salaryRange) => {
    if (!salaryRange) return 'Not specified';
    
    if (typeof salaryRange === 'object') {
      if (salaryRange.type === 'fixed' && salaryRange.fixed) {
        return `${salaryRange.currency || '€'}${salaryRange.fixed}`;
      }
      if (salaryRange.type === 'range' && salaryRange.min && salaryRange.max) {
        return `${salaryRange.currency || '€'}${salaryRange.min} - ${salaryRange.max}`;
      }
    }
    
    return 'Not specified';
  };

  const formatWorkModel = (job) => {
    if (job.is_remote) return 'Remote';
    if (job.is_hybrid) return 'Hybrid';
    return 'On-site';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('jobSelectionModal.title')}
            </h2>
            <p className="text-gray-600 mt-1">
              {Array.isArray(candidate)
                ? t('jobSelectionModal.subtitleMultiple', { count: candidate.length })
                : t('jobSelectionModal.subtitle', { candidateName: candidate?.name })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-100">
          <Input
            placeholder={t('jobSelectionModal.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Jobs List */}
        <div className="flex-1 overflow-y-auto p-6">
          {jobsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? t('jobSelectionModal.noJobsFound') : t('jobSelectionModal.noActiveJobs')}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? t('jobSelectionModal.tryDifferentSearch')
                  : t('jobSelectionModal.createJobFirst')
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedJobId === job.id
                      ? 'border-primary ring-2 ring-primary-100 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {job.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {formatWorkModel(job)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.applications_count || 0} applicants
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="success" size="sm">
                          {job.job_type}
                        </Badge>
                        <Badge variant="info" size="sm">
                          {job.experience_level}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Salary:</span> {formatSalary(job.salary_range)}
                      </div>

                      {job.skills_required && job.skills_required.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {job.skills_required.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" size="sm">
                                {skill}
                              </Badge>
                            ))}
                            {job.skills_required.length > 3 && (
                              <Badge variant="outline" size="sm">
                                +{job.skills_required.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <input
                        type="radio"
                        name="selectedJob"
                        checked={selectedJobId === job.id}
                        onChange={() => setSelectedJobId(job.id)}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {filteredJobs.length > 0 && (
              <span>
                {t('jobSelectionModal.jobsAvailable', { count: filteredJobs.length })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              {t('jobSelectionModal.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSelectJob}
              disabled={!selectedJobId || loading}
              loading={loading}
            >
              {t('jobSelectionModal.addToShortlist')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSelectionModal; 