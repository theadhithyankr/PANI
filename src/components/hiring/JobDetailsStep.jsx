import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit3,
  Building,
  MapPin,
  Clock,
  Euro,
  Users,
  Eye,
  CheckCircle,
  Star,
  BriefcaseBusiness
} from 'lucide-react';

const JobDetailsStep = ({ jobData, onEditJob, applicationCount, hiredInterviewCount }) => {
  const { t } = useTranslation('employer');

  return (
    <div className="space-y-8">
      {/* Job Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{jobData.title}</h2>
            <div className="flex items-center space-x-4 text-gray-600">
              <span className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                {jobData.company}
              </span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {jobData.location}
              </span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {jobData.type}
              </span>
            </div>
          </div>
          <button onClick={() => onEditJob && onEditJob()} className="flex items-center px-4 py-2 text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors">
            <Edit3 className="h-4 w-4 mr-2" />
            {t('hiringProcess.jobDetails.editJob')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-violet-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-violet-700">{t('hiringProcess.jobDetails.salaryRange')}</span>
              <Euro className="h-4 w-4 text-violet-600" />
            </div>
            <p className="text-lg font-semibold text-violet-900">{jobData.salary}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">{t('hiringProcess.jobDetails.applications')}</span>
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-900">{applicationCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700"> hired interviews found</span>
              <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-blue-900">{hiredInterviewCount}</p>
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('hiringProcess.jobDetails.jobDescription')}</h3>
        <p className="text-gray-600 mb-6">{jobData.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{t('hiringProcess.jobDetails.requirements')}</h4>
            <ul className="space-y-2">
              {jobData.requirements.map((req, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
          {Array.isArray(jobData.benefits) && jobData.benefits.filter(b => String(b).trim().length > 0).length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('hiringProcess.jobDetails.benefits')}</h4>
              <ul className="space-y-2">
                {jobData.benefits
                  .filter(b => String(b).trim().length > 0)
                  .map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <Star className="h-4 w-4 text-violet-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailsStep;
