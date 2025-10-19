import React from 'react';

const PercentageBar = ({ percentage, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const getProgressColor = (value) => {
    if (value < 40) return 'bg-red-500';
    if (value < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
      <div
        className={`rounded-full ${sizeClasses[size]} ${getProgressColor(percentage)}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default PercentageBar; 