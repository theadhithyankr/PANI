import React from 'react';
import { MapPin, Clock, Building, Bookmark, ExternalLink, Heart, Target, Star, Languages, User } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useTheme } from '../../contexts/ThemeContext';

const JobCard = ({ job, onSave, onApply, onView, isSaved = false, hasApplied = false, userSkills = [] }) => {
  const { theme } = useTheme();

  // Calculate skill match percentage
  const calculateSkillMatch = () => {
    if (!userSkills.length || !job.skills_required?.length) return 0;
    
    const matchedSkills = job.skills_required.filter(skill => 
      userSkills.includes(skill)
    );
    
    return Math.round((matchedSkills.length / job.skills_required.length) * 100);
  };

  const skillMatchPercentage = calculateSkillMatch();

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMatchScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  const getSkillMatchColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatSalary = (salaryRange) => {
    if (!salaryRange) return 'Salary not specified';
    try {
      const { min, max, currency } = salaryRange;
      if (!min && !max) return 'Salary not specified';
      if (!min) return `Up to ${currency}${max.toLocaleString()}`;
      if (!max) return `From ${currency}${min.toLocaleString()}`;
      return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
    } catch (error) {
      return 'Salary not specified';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group border-l-4 border-l-blue-500 relative">
      {/* Comprehensive Match Score Badge */}
      {job.matchScore !== undefined && (
        <div className="absolute top-4 right-4 z-10">
          <div className={`px-3 py-2 rounded-lg text-sm font-medium border ${getMatchScoreColor(job.matchScore)}`}>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span className="font-bold">{job.matchScore}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2">
              {userSkills.length > 0 && job.matchScore === undefined && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSkillMatchColor(skillMatchPercentage)}`}>
                  <Target className="w-3 h-3" />
                  {skillMatchPercentage}% skill match
                </div>
              )}
              <button
                onClick={() => onSave(job)}
                className={`p-2 rounded-full transition-colors ${
                  isSaved 
                    ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center text-gray-600">
              <Building className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {job.companies?.name || job.company || 'Company not specified'}
              </span>
              {job.companies?.industry && (
                <span className="text-sm text-gray-500 ml-2">
                  • {job.companies.industry}
                </span>
              )}
              {job.companies?.size && (
                <span className="text-sm text-gray-500 ml-2">
                  • {job.companies.size}
                </span>
              )}
            </div>
            <span className="text-gray-400">•</span>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              {job.location}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant={getJobTypeColor(job.job_type)} size="sm">
              {job.job_type || 'Not specified'}
            </Badge>
            <Badge variant={getRemoteColor(job.is_remote ? 'Remote' : job.is_hybrid ? 'Hybrid' : 'On-site')} size="sm">
              {job.is_remote ? 'Remote' : job.is_hybrid ? 'Hybrid' : 'On-site'}
            </Badge>
            {job.experience_level && (
              <Badge variant="outline" size="sm">
                <User className="w-3 h-3 mr-1" />
                {job.experience_level}
              </Badge>
            )}
            {job.preferred_language && (
              <Badge variant="outline" size="sm">
                <Languages className="w-3 h-3 mr-1" />
                {job.preferred_language}
              </Badge>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              Posted {formatDate(job.created_at)}
            </div>
          </div>

          <p className="text-gray-700 text-sm line-clamp-2 mb-4">
            {job.description}
          </p>

          <div className="flex flex-wrap gap-1 mb-4">
            {job.skills_required?.slice(0, 4).map((skill, index) => (
              <Badge 
                key={index} 
                variant={userSkills.includes(skill) ? "success" : "default"} 
                size="sm"
                className={userSkills.includes(skill) ? "border-green-300" : ""}
              >
                {skill}
              </Badge>
            ))}
            {job.skills_required?.length > 4 && (
              <Badge variant="default" size="sm">
                +{job.skills_required.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-lg font-semibold text-gray-900">
          {formatSalary(job.salary_range)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(job)}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </Button>
          {hasApplied ? (
            <Badge variant="success" size="sm" className="px-4 py-2">
              Applied
            </Badge>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onApply(job)}>
              Apply Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default JobCard;
