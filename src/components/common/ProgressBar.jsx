import React from 'react';

const ProgressBar = ({ steps, currentStep, variant = 'default' }) => {
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepColors = (status) => {
    switch (variant) {
      case 'success':
        return {
          completed: 'bg-green-500 border-green-500',
          current: 'bg-green-100 border-green-500',
          upcoming: 'bg-gray-100 border-gray-300'
        }[status];
      case 'warning':
        return {
          completed: 'bg-yellow-500 border-yellow-500',
          current: 'bg-yellow-100 border-yellow-500',
          upcoming: 'bg-gray-100 border-gray-300'
        }[status];
      case 'error':
        return {
          completed: 'bg-red-500 border-red-500',
          current: 'bg-red-100 border-red-500',
          upcoming: 'bg-gray-100 border-gray-300'
        }[status];
      default:
        return {
          completed: 'bg-blue-500 border-blue-500',
          current: 'bg-blue-100 border-blue-500',
          upcoming: 'bg-gray-100 border-gray-300'
        }[status];
    }
  };

  const getTextColors = (status) => {
    switch (status) {
      case 'completed':
        return 'text-white';
      case 'current':
        return variant === 'error' ? 'text-red-700' : 
               variant === 'warning' ? 'text-yellow-700' :
               variant === 'success' ? 'text-green-700' : 'text-blue-700';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectorColor = (index) => {
    if (index < currentStep) {
      return variant === 'error' ? 'bg-red-500' :
             variant === 'warning' ? 'bg-yellow-500' :
             variant === 'success' ? 'bg-green-500' : 'bg-blue-500';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id || index} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
                    ${getStepColors(status)} ${getTextColors(status)}
                  `}
                >
                  {status === 'completed' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${
                    status === 'current' ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </div>
                  {step.subtitle && (
                    <div className="text-xs text-gray-500 mt-1">
                      {step.subtitle}
                    </div>
                  )}
                </div>
              </div>
              
              {!isLast && (
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 ${getConnectorColor(index)}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
