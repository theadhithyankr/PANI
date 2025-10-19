import React from 'react';
import { MapPin, Star, Heart, X, Briefcase, Eye, EyeOff } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getContactDisplayText } from '../../utils/contactMasking';

const CandidateCard = ({ candidate, onShortlist, onReject, onViewProfile, onScheduleInterview, isSelected = false, isShortlisted = false, isRejected = false }) => {
  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'interviewing': return 'warning';
      case 'hired': return 'info';
      default: return 'default';
    }
  };

  // Format salary range
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

  // Format experience
  const formatExperience = (years) => {
    if (!years) return 'Not specified';
    return `${years} year${years !== 1 ? 's' : ''}`;
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate avatar background color based on name
  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get masked contact information
  const contactInfo = getContactDisplayText(candidate);

  return (
    <Card className={`bg-white rounded-xl border p-6 transition-all duration-300 group hover:border-blue-200 hover:shadow-lg ${
      isSelected 
        ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg' 
        : isRejected
        ? 'border-red-200 bg-red-50/30'
        : 'border-gray-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className="relative">
          {candidate.avatar ? (
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-white shadow-md ${getAvatarColor(candidate.name)} ${
              candidate.avatar ? 'hidden' : 'flex'
            }`}
          >
            {getInitials(candidate.name)}
          </div>
          {/* Online status indicator */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {candidate.name}
            </h3>
            <div className="flex items-center gap-2">
              {isRejected && (
                <Badge variant="default" size="sm" className="bg-red-100 text-red-700 border-red-200">
                  Rejected
                </Badge>
              )}
              {candidate.bestJobMatch && (
                <Badge variant="info" size="sm" className="bg-blue-100 text-blue-700 border-blue-200">
                  {candidate.bestJobMatch.title}
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{candidate.headline || 'No headline available'}</p>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{contactInfo.location}</span>
            {candidate.willing_to_relocate && (
              <Badge variant="info" size="sm" className="ml-2 bg-green-100 text-green-700 border-green-200">
                Relocatable
              </Badge>
            )}
            {contactInfo.message && (
              <Badge variant="warning" size="sm" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
                <EyeOff className="w-3 h-3 mr-1" />
                Contact Hidden
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {candidate.skills?.slice(0, 4).map((skill, index) => (
              <Badge key={index} variant="default" size="sm" className="bg-gray-100 text-gray-700">
                {skill}
              </Badge>
            ))}
            {candidate.skills?.length > 4 && (
              <Badge variant="default" size="sm" className="bg-gray-100 text-gray-700">
                +{candidate.skills.length - 4} more
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{formatExperience(candidate.experience_years)}</span> experience
              <span className="mx-2">•</span>
              <span>{formatSalary(candidate.target_salary_range)}</span>
            </div>
            
            <div className={`flex items-center gap-1 transition-all duration-200 ${isRejected ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'}`}>
              {!isRejected && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onReject(candidate)}
                  className="hover:bg-red-50 hover:text-red-600 p-2"
                  title="Reject candidate"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onShortlist(candidate)}
                className={`p-2 ${isShortlisted ? 'bg-pink-50 hover:bg-pink-100 text-pink-600' : 'hover:bg-pink-50 hover:text-pink-600'}`}
                title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                disabled={isRejected}
              >
                <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
              </Button>
              {/* Invite/Schedule removed as per requirements */}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onViewProfile(candidate)}
          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
        >
          <Briefcase className="w-4 h-4 mr-2" />
          View Profile
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm text-gray-500">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="font-medium">{candidate.matchScore}% match</span>
            {candidate.bestJobMatch && (
              <span className="ml-2 text-xs text-gray-400">
                • {candidate.bestJobMatch.matchScore}% for {candidate.bestJobMatch.title}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CandidateCard;
