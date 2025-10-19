import React from 'react';
import { Check, MapPin, Clock, Calendar, Briefcase, Euro } from 'lucide-react';

const ReviewForm = ({ data, onSubmit, isEditing }) => {
  const formatSalary = () => {
    if (data.salary_type === 'fixed') {
      return `${data.salary_currency} ${data.salary_fixed} ${data.salary_period}`;
    } else if (data.salary_type === 'range') {
      return `${data.salary_currency} ${data.salary_min} - ${data.salary_max} ${data.salary_period}`;
    }
    return 'Negotiable';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Review Job Posting</h3>
        <p className="text-sm text-gray-500 mb-4">Review all the information before {isEditing ? 'saving changes' : 'posting the job'}</p>

        <div className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Job Title</label>
                <p className="mt-1 text-gray-900">{data.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Job Type</label>
                <p className="mt-1 text-gray-900">{data.job_type}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{data.description}</p>
              </div>
            </div>
          </div>

          {/* Location & Schedule */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-4">Location & Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="mt-1 text-gray-900">
                    {data.location || 'Not specified'}
                    {data.is_remote && ' (Remote)'}
                    {data.is_hybrid && ' (Hybrid)'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="mt-1 text-gray-900">{formatDate(data.start_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Application Deadline</label>
                  <p className="mt-1 text-gray-900">{formatDate(data.application_deadline)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-4">Requirements</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Experience Level</label>
                <p className="mt-1 text-gray-900">{data.experience_level}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Requirements</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{data.requirements}</p>
              </div>
              {data.skills_required?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Required Skills</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.skills_required.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compensation */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-4">Compensation & Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Employment Type</label>
                  <p className="mt-1 text-gray-900">{data.employment_type}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Euro className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Salary</label>
                  <p className="mt-1 text-gray-900">{formatSalary()}</p>
                </div>
              </div>
            </div>

            {data.benefits?.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">Benefits</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.equity_offered && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">Equity Details</label>
                <p className="mt-1 text-gray-900">{data.equity_details}</p>
              </div>
            )}
          </div>

          {/* Additional Questions */}
          {data.additional_questions?.length > 0 && (
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Additional Questions</h4>
              <ul className="list-disc pl-5 space-y-2">
                {data.additional_questions.map((question, index) => (
                  <li key={index} className="text-gray-900">{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewForm; 