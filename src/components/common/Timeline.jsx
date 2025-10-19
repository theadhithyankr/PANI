import React from 'react';
import { CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react';

const Timeline = ({ items, orientation = 'vertical', size = 'md' }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500 fill-current" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Date not available';
    }
  };

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center space-x-4 overflow-x-auto pb-4">
        {items.map((item, index) => (
          <div key={item.id || index} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="mb-2">
                {getStatusIcon(item.status)}
              </div>
              <div className="text-xs font-medium text-gray-900 truncate max-w-24">
                {item.title}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(item.date)}
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="w-8 h-px bg-gray-300 mx-2 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id || index} className="flex items-start space-x-3">
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0">
              {getStatusIcon(item.status)}
            </div>
            {index < items.length - 1 && (
              <div className="w-px h-8 bg-gray-300 mt-2" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                {item.title}
              </h4>
              <time className="text-xs text-gray-500 flex-shrink-0">
                {formatDate(item.date)}
              </time>
            </div>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
