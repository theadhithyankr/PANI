import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const CountdownTimer = ({ 
  targetDate, 
  variant = 'default', 
  size = 'md',
  showIcon = true,
  onExpire 
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  
  function calculateTimeLeft() {
    const difference = +new Date(targetDate) - +new Date();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference
      };
    }
    
    return { total: 0 };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.total <= 0 && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const getVariantStyles = () => {
    const isUrgent = timeLeft.total <= 24 * 60 * 60 * 1000; // Less than 24 hours
    
    switch (variant) {
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return isUrgent 
          ? 'text-red-600 bg-red-50 border-red-200'
          : 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-2 py-1';
      case 'lg':
        return 'text-lg px-4 py-3';
      default:
        return 'text-base px-3 py-2';
    }
  };

  const formatTimeLeft = () => {
    if (timeLeft.total <= 0) {
      return 'Expired';
    }

    const parts = [];
    
    if (timeLeft.days > 0) {
      parts.push(`${timeLeft.days}d`);
    }
    if (timeLeft.hours > 0 || timeLeft.days > 0) {
      parts.push(`${timeLeft.hours}h`);
    }
    if ((timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) && timeLeft.days === 0) {
      parts.push(`${timeLeft.minutes}m`);
    }
    if (timeLeft.days === 0 && timeLeft.hours === 0) {
      parts.push(`${timeLeft.seconds}s`);
    }

    return parts.join(' ');
  };

  const isExpired = timeLeft.total <= 0;
  const isUrgent = timeLeft.total <= 24 * 60 * 60 * 1000 && timeLeft.total > 0;

  return (
    <div className={`
      inline-flex items-center gap-2 rounded-lg border font-medium
      ${getVariantStyles()} ${getSizeStyles()}
    `}>
      {showIcon && (
        <>
          {isExpired ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
        </>
      )}
      
      <span>
        {isExpired ? 'Expired' : formatTimeLeft()}
      </span>
      
      {isUrgent && !isExpired && (
        <span className="animate-pulse">⚠️</span>
      )}
    </div>
  );
};

export default CountdownTimer;
