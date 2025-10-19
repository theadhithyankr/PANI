import React from 'react';
import { User } from 'lucide-react';

const InitialsAvatar = ({ 
  user, 
  size = 'md', 
  className = '',
  showFallbackIcon = true 
}) => {
  // Generate initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    return fullName
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

  if (user?.avatar_url) {
    return (
      <img 
        className={`rounded-full object-cover ${sizeClass} ${className}`}
        src={user.avatar_url} 
        alt={`${user.full_name}'s avatar`}
      />
    );
  }

  if (user?.full_name) {
    return (
      <div className={`rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 ${sizeClass} ${className}`}>
        {getInitials(user.full_name)}
      </div>
    );
  }

  if (showFallbackIcon) {
    return (
      <div className={`rounded-full bg-gray-200 flex items-center justify-center ${sizeClass} ${className}`}>
        <User className={`text-gray-400 ${iconSizeClass}`} />
      </div>
    );
  }

  return null;
};

export default InitialsAvatar; 