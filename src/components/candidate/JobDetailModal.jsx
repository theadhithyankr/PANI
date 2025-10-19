import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Euro, Building, Star, Send, Users, Award, Globe, Calendar as CalendarIcon } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';
import CompanyLogo from '../common/CompanyLogo';
import ApplicationModal from './ApplicationModal';
import { useCompanyData } from '../../hooks/employer/useCompanyData';

const JobDetailModal = ({ job, isOpen, onClose, onApply, hasApplied = false, userSkills = [] }) => {
  // Early return before any hooks
  if (!isOpen || !job) return null;

  const [activeTab, setActiveTab] = useState('overview');
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Fetch company data using the company_id from the job
  const { 
    company: companyData, 
    loading: loadingCompany, 
    error: companyError,
    storeState 
  } = useCompanyData(job?.company_id);

  // Debug logging for Zustand store state
  useEffect(() => {
    if (job?.company_id) {
      console.log('Candidate JobDetailModal - Job company_id:', job.company_id);
      console.log('Candidate JobDetailModal - Company data from store:', companyData);
      console.log('Candidate JobDetailModal - Company loading:', loadingCompany);
      console.log('Candidate JobDetailModal - Company error:', companyError);
      console.log('Candidate JobDetailModal - Store state:', storeState);
      console.log('Candidate JobDetailModal - All cached companies:', storeState.companies);
    }
  }, [job?.company_id, companyData, loadingCompany, companyError, storeState]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'company', label: 'Company' },

  ];

  const getJobTypeColor = (type) => {
    switch (type) {
      case 'Full-time': return 'success';
      case 'Part-time': return 'warning';
      case 'Contract': return 'info';
      case 'Internship': return 'secondary';
      default: return 'default';
    }
  };

  const getRemoteColor = (remote) => {
    switch (remote) {
      case 'Remote': return 'primary';
      case 'Hybrid': return 'secondary';
      case 'On-site': return 'default';
      default: return 'default';
    }
  };

  const handleApply = () => {
    setShowApplicationModal(true);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Match Score Breakdown */}
      {job.matchScore !== undefined && (
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-500" />
            Your Match Score: {job.matchScore}%
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Match Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Skills Match</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, (job.skills_required?.length || 0) > 0 ? ((job.skills_required?.filter(skill => userSkills?.includes(skill))?.length || 0) / job.skills_required.length) * 100 : 0)}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((job.skills_required?.filter(skill => userSkills?.includes(skill))?.length || 0) / (job.skills_required?.length || 1) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Experience Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Language Match</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Location Match</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">60%</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Why This Job Matches You</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Your skills align with {Math.round((job.skills_required?.filter(skill => userSkills?.includes(skill))?.length || 0) / (job.skills_required?.length || 1) * 100)}% of required skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Experience level matches your background</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Language requirements match your proficiency</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Location preferences align with your goals</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Salary Details */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Euro className="w-5 h-5 text-green-500" />
          Compensation & Benefits
        </h3>
        <div className="space-y-6">
          {/* Salary Information */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Salary Information</h4>
              <Badge variant="success" size="sm">
                {(() => {
                  if (!job.salary_range) return 'Not specified';
                  if (typeof job.salary_range === 'string') return job.salary_range;
                  if (job.salary_range.type === 'fixed') return 'Fixed Salary';
                  if (job.salary_range.type === 'range') return 'Salary Range';
                  if (job.salary_range.type === 'negotiable') return 'Negotiable';
                  return 'Competitive';
                })()}
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Compensation Details</h5>
                <div className="space-y-2">
                  {(() => {
                    if (!job.salary_range) {
                      return (
                        <div className="text-gray-600 text-sm">
                          <p>Salary information not specified</p>
                        </div>
                      );
                    }
                    
                    if (typeof job.salary_range === 'string') {
                      return (
                        <div className="text-gray-900">
                          <p className="font-semibold text-lg">{job.salary_range}</p>
                        </div>
                      );
                    }
                    
                    const salaryRange = job.salary_range;
                    const currency = salaryRange.currency || '€';
                    const period = salaryRange.period || 'yearly';
                    
                    if (salaryRange.type === 'fixed' && salaryRange.fixed) {
                      return (
                        <div className="text-gray-900">
                          <p className="font-semibold text-lg">
                            {currency} {salaryRange.fixed.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            {period} salary
                          </p>
                        </div>
                      );
                    }
                    
                    if (salaryRange.type === 'range' && salaryRange.min && salaryRange.max) {
                      return (
                        <div className="text-gray-900">
                          <p className="font-semibold text-lg">
                            {currency} {salaryRange.min.toLocaleString()} - {currency} {salaryRange.max.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            {period} salary range
                          </p>
                        </div>
                      );
                    }
                    
                    if (salaryRange.type === 'negotiable') {
                      return (
                        <div className="text-gray-900">
                          <p className="font-semibold text-lg">Negotiable</p>
                          <p className="text-sm text-gray-600">Salary to be discussed</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="text-gray-600 text-sm">
                        <p>Salary information not specified</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Additional Benefits</h5>
                <div className="space-y-2">
                  {(() => {
                    const benefits = Array.isArray(job.benefits) 
                      ? job.benefits 
                      : typeof job.benefits === 'string' 
                      ? job.benefits.split(/\r?\n|,/)
                      : [];
                    
                    if (benefits.length === 0) {
                      return (
                        <div className="text-gray-600 text-sm">
                          <p>Benefits not specified</p>
                        </div>
                      );
                    }
                    
                    return benefits.slice(0, 3).map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{benefit.trim()}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
            
            {/* Employment Type */}
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Employment Type</span>
                <Badge variant="outline" size="sm">
                  {job.type || job.job_type || 'Full-time'}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Benefits Grid */}
          {(() => {
            const benefits = Array.isArray(job.benefits) 
              ? job.benefits 
              : typeof job.benefits === 'string' 
              ? job.benefits.split(/\r?\n|,/)
              : [];
            
            if (benefits.length === 0) return null;
            
            return (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Benefits & Perks</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Award className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-green-800 font-medium text-sm">{benefit.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </Card>

      {/* Job Description */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">About This Role</h3>
        <p className="text-gray-700 leading-relaxed mb-6">{job.description}</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">What You'll Do</h4>
            <ul className="space-y-2">
              {(() => {
                // Try multiple possible property names for requirements
                const requirements = Array.isArray(job.requirements)
                  ? job.requirements
                  : Array.isArray(job.responsibilities)
                  ? job.responsibilities
                  : typeof job.requirements === 'string' && job.requirements.trim() !== ''
                  ? job.requirements.split(/\r?\n|,/)
                  : typeof job.responsibilities === 'string' && job.responsibilities.trim() !== ''
                  ? job.responsibilities.split(/\r?\n|,/)
                  : [
                      'Develop and maintain web applications using modern technologies',
                      'Collaborate with cross-functional teams to deliver high-quality software',
                      'Write clean, maintainable, and well-documented code'
                    ];
                
                return requirements.slice(0, 3).map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{req.trim()}</span>
                  </li>
                ));
              })()}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">What We Offer</h4>
            <ul className="space-y-2">
              {(() => {
                // Try multiple possible property names for benefits
                const benefits = Array.isArray(job.benefits)
                  ? job.benefits
                  : Array.isArray(job.perks)
                  ? job.perks
                  : typeof job.benefits === 'string' && job.benefits.trim() !== ''
                  ? job.benefits.split(/\r?\n|,/)
                  : typeof job.perks === 'string' && job.perks.trim() !== ''
                  ? job.perks.split(/\r?\n|,/)
                  : [
                      'Health Insurance (100% covered)',
                      'Flexible Working Hours',
                      'Professional Development Budget'
                    ];
                
                return benefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{benefit.trim()}</span>
                  </li>
                ));
              })()}
            </ul>
          </div>
        </div>
      </Card>

      {/* Requirements */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Requirements</h3>
        <div className="space-y-3">
          {(() => {
            // Try multiple possible property names for requirements or use fallback
            const requirements = Array.isArray(job.requirements)
              ? job.requirements
              : Array.isArray(job.responsibilities)
              ? job.responsibilities
              : typeof job.requirements === 'string' && job.requirements.trim() !== ''
              ? job.requirements.split(/\r?\n|,/)
              : typeof job.responsibilities === 'string' && job.responsibilities.trim() !== ''
              ? job.responsibilities.split(/\r?\n|,/)
              : [
                  'Develop and maintain web applications using modern technologies',
                  'Collaborate with cross-functional teams to deliver high-quality software',
                  'Write clean, maintainable, and well-documented code',
                  'Participate in code reviews and technical discussions',
                  'Stay up-to-date with industry best practices and emerging technologies'
                ]; // Fallback requirements
            
            return requirements.map((req, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">{req.trim()}</span>
              </div>
            ));
          })()}
        </div>
      </Card>

      {/* Skills */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Required Skills</h3>
        <div className="flex flex-wrap gap-2">
          {(() => {
            // Try multiple possible property names for skills
            const skills = Array.isArray(job.skills_required)
              ? job.skills_required
              : Array.isArray(job.skills)
              ? job.skills
              : Array.isArray(job.requiredSkills)
              ? job.requiredSkills
              : typeof job.skills_required === 'string' && job.skills_required.trim() !== ''
              ? job.skills_required.split(/,|\r?\n/)
              : typeof job.skills === 'string' && job.skills.trim() !== ''
              ? job.skills.split(/,|\r?\n/)
              : typeof job.requiredSkills === 'string' && job.requiredSkills.trim() !== ''
              ? job.requiredSkills.split(/,|\r?\n/)
              : ['JavaScript', 'React', 'Node.js', 'TypeScript']; // Fallback skills
            
            return skills.map((skill, index) => (
              <Badge key={index} variant="primary" size="sm">
                {skill.trim()}
              </Badge>
            ));
          })()}
        </div>
      </Card>

      {/* Benefits */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Benefits & Perks</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {(() => {
            // Try multiple possible property names for benefits or use fallback
            const benefits = Array.isArray(job.benefits)
              ? job.benefits
              : Array.isArray(job.perks)
              ? job.perks
              : typeof job.benefits === 'string' && job.benefits.trim() !== ''
              ? job.benefits.split(/\r?\n|,/)
              : typeof job.perks === 'string' && job.perks.trim() !== ''
              ? job.perks.split(/\r?\n|,/)
              : [
                  'Health Insurance (100% covered)',
                  'Dental & Vision Coverage',
                  'Flexible Working Hours',
                  'Remote Work Options',
                  'Professional Development Budget',
                  '25 Days Vacation',
                  'Performance Bonuses',
                  'Stock Options'
                ]; // Fallback benefits
            
            return benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-green-800 font-medium">{benefit.trim()}</span>
              </div>
            ));
          })()}
        </div>
      </Card>
    </div>
  );

  const renderCompany = () => (
    <div className="space-y-6">
      <Card>
        {loadingCompany ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading company information...</span>
          </div>
        ) : companyError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Error loading company information: {companyError}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Company Header */}
            <div className="flex items-center gap-4">
              <CompanyLogo company={companyData} size="xl" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {companyData?.name || job.company || 'Company not specified'}
                </h3>
                <p className="text-gray-600">
                  {companyData?.industry || 'Technology'} • {companyData?.size || '50-200 employees'}
                </p>
                {companyData?.headquarters_location && (
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{companyData.headquarters_location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Description */}
            {companyData?.description && (
              <p className="text-gray-700 leading-relaxed">
                {companyData.description}
              </p>
            )}

            {/* Company Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              {companyData?.size && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{companyData.size}</div>
                  <div className="text-sm text-blue-800">Company Size</div>
                </div>
              )}
              {companyData?.founded_year && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {new Date().getFullYear() - companyData.founded_year}+
                  </div>
                  <div className="text-sm text-green-800">Years in Business</div>
                </div>
              )}
              {companyData?.average_salary && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    €{companyData.average_salary.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-800">Average Salary</div>
                </div>
              )}
            </div>

            {/* Company Details */}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {companyData?.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Website</p>
                    <a 
                      href={companyData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {companyData.website}
                    </a>
                  </div>
                </div>
              )}

              {companyData?.founded_year && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Founded</p>
                    <p className="text-sm text-gray-600">{companyData.founded_year}</p>
                  </div>
                </div>
              )}

              {companyData?.headquarters_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Headquarters</p>
                    <p className="text-sm text-gray-600">{companyData.headquarters_location}</p>
                  </div>
                </div>
              )}

              {companyData?.industry && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Industry</p>
                    <p className="text-sm text-gray-600">{companyData.industry}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Company Mission & Values - Show only if we have company data */}
      {companyData && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">About {companyData.name}</h3>
          <div className="space-y-4">
            {companyData.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Company Overview</h4>
                <p className="text-gray-700">
                  {companyData.description}
                </p>
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Information</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {companyData.industry && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-700">Industry: {companyData.industry}</span>
                  </div>
                )}
                {companyData.size && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Size: {companyData.size}</span>
                  </div>
                )}
                {companyData.founded_year && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-700">Founded: {companyData.founded_year}</span>
                  </div>
                )}
                {companyData.average_salary && (
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-700">Avg Salary: €{companyData.average_salary.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );





  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'company': return renderCompany();
      default: return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <Button variant="ghost" onClick={onClose} className="absolute top-4 right-4">
              <X className="w-6 h-6" />
            </Button>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  {/* Comprehensive Match Score */}
                  {job.matchScore !== undefined && (
                    <div className="flex flex-col items-end">
                      <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        job.matchScore >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
                        job.matchScore >= 60 ? 'text-blue-600 bg-blue-50 border-blue-200' :
                        job.matchScore >= 40 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                        'text-red-600 bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span className="font-bold text-lg">{job.matchScore}%</span>
                        </div>
                        <div className="text-xs opacity-75">
                          {job.matchScore >= 80 ? 'Excellent Match' :
                           job.matchScore >= 60 ? 'Good Match' :
                           job.matchScore >= 40 ? 'Fair Match' : 'Poor Match'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {job.companies?.name || job.company || 'Company not specified'}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                 
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getJobTypeColor(job.type)} size="sm">
                    {job.type}
                  </Badge>
                  <Badge variant={getRemoteColor(job.remote)} size="sm">
                    {job.remote}
                  </Badge>
                 
                  <div className="flex items-center gap-1 text-lg font-semibold text-gray-900">
                    {job.salary}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {hasApplied ? (
                <Badge variant="success" className="px-4 py-2">
                  Applied
                </Badge>
              ) : (
                <Button variant="primary" onClick={handleApply}>
                  <Send className="w-4 h-4 mr-2" />
                  Apply Now
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationModal
        job={job}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onSubmit={(application) => {
          // Handle successful application submission
          console.log('Application submitted:', application);
          setShowApplicationModal(false);
          // You can add additional logic here, like updating the hasApplied state
        }}
      />
    </div>
  );
};

export default JobDetailModal;
