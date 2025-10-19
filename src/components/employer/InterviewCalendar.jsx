import React from 'react';
import { Clock } from 'lucide-react';

const InterviewCalendar = ({ interviews = [], currentDate, onInterviewClick }) => {
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

  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    // Set to Monday of the current week
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getInterviewsForSlot = (date, hour) => {
    return interviews.filter(interview => {
      if (!interview.interview_date) return false;
      const interviewDate = new Date(interview.interview_date);
      if (interviewDate.toDateString() !== date.toDateString()) return false;
      const interviewHour = interviewDate.getHours();
      return interviewHour === hour;
    });
  };

  const weekDays = getWeekDays(currentDate);
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const InterviewCard = ({ interview }) => {
    const interviewDate = new Date(interview.interview_date);
    const interviewMinute = interviewDate.getMinutes();
    const topOffset = (interviewMinute / 60) * 80; // 80px per hour slot
    const durationInMinutes = 60; // Assume 60 mins as not in data
    const height = (durationInMinutes / 60) * 80;

    const candidateName = interview.job_applications?.applicant?.full_name || 'N/A';
    const candidateAvatar = interview.job_applications?.applicant?.avatar_url;
    const jobTitle = interview.jobs?.title || 'N/A';
    const scheduledTime = interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div 
        style={{ top: `${topOffset}px`, height: `${height}px` }}
        className="absolute w-[calc(100%-8px)] left-[4px] bg-primary-100 border-l-4 border-primary-500 rounded-r-md p-2 hover:bg-primary-200 transition-colors cursor-pointer text-xs z-10 flex flex-col justify-center"
        onClick={() => onInterviewClick(interview)}
        >
        <div className="flex items-center gap-2 mb-1">
          <div className="relative flex-shrink-0">
            {candidateAvatar ? (
              <img
                src={candidateAvatar}
                alt={candidateName}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${getAvatarColor(candidateName)} ${
                candidateAvatar ? 'hidden' : 'flex'
              }`}
            >
              {getInitials(candidateName)}
            </div>
          </div>
          <p className="font-semibold text-primary-900 truncate flex-1">{candidateName}</p>
        </div>
        <p className="text-primary-800 truncate">{jobTitle}</p>
        <div className="flex items-center text-primary-700 gap-1 mt-1">
            <Clock className="w-3 h-3" />
            <span>{scheduledTime}</span>
        </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex sticky top-0 bg-white z-10 shadow-sm">
        <div className="w-14 shrink-0"></div>
        <div className="grid grid-cols-7 flex-grow">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-3 bg-gray-50 border-b border-l border-gray-200">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-2xl font-semibold mt-1 ${
                  day.toDateString() === new Date().toDateString()
                    ? 'text-primary-600'
                    : 'text-gray-800'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Calendar Body (scrollable) */}
      <div className="flex-grow min-h-0">
        <div className="flex h-full">
          {/* Time Gutter */}
          <div className="w-14 shrink-0">
            {timeSlots.map((hour) => (
              <div key={hour} className="h-20 text-right pr-2 -mt-2.5 pt-2.5 border-r border-gray-200">
                <span className="text-xs text-gray-400 font-medium">{hour > 12 ? `${hour-12} PM` : `${hour} AM`}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 flex-grow">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="border-l border-gray-200 relative">
                {timeSlots.map((hour) => {
                  const dayInterviews = getInterviewsForSlot(day, hour);
                  return (
                    <div key={hour} className="h-20 border-b border-gray-100 relative">
                      {dayInterviews.map((interview) => (
                        <InterviewCard key={interview.id} interview={interview} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCalendar;
