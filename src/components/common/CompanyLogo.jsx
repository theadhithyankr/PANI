import React from 'react';
import { Building2 } from 'lucide-react';

const CompanyLogo = ({ 
  company, 
  size = 'md', 
  className = '',
  showFallbackIcon = true 
}) => {
  // Generate initials from company name
  const getInitials = (companyName) => {
    if (!companyName) return '?';
    return companyName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSizeClass = iconSizeClasses[size] || iconSizeClasses.md;

  if (company?.logo_url) {
    return (
      <img 
        className={`rounded-lg object-cover ${sizeClass} ${className}`}
        src={company.logo_url} 
        alt={`${company.name} logo`}
        onError={(e) => {
          // If image fails to load, hide it and show fallback
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  if (company?.name) {
    return (
      <div className={`rounded-lg bg-gray-100 flex items-center justify-center font-semibold text-gray-600 ${sizeClass} ${className}`}>
        {getInitials(company.name)}
      </div>
    );
  }

  if (showFallbackIcon) {
    return (
      <div className={`rounded-lg bg-gray-100 flex items-center justify-center ${sizeClass} ${className}`}>
        <Building2 className={`text-gray-400 ${iconSizeClass}`} />
      </div>
    );
  }

  return null;
};

export default CompanyLogo; 