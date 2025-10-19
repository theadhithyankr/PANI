import React from 'react';
import Badge from '../common/Badge';
import { Clock, Video, MapPin, Calendar, User, Briefcase } from 'lucide-react';

const InterviewList = ({ interviews, onSelectInterview }) => {
  const getInterviewTime = (dateString) => {
    if (!dateString) return 'No time set';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const groupedInterviews = interviews.reduce((acc, interview) => {
    const date = new Date(interview.interview_date).toDateString();
    if (date === 'Invalid Date') return acc;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(interview);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedInterviews).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="space-y-6">
      {sortedDates.length > 0 ? sortedDates.map(date => (
        <div key={date} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider px-4">
            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-3">
            {groupedInterviews[date].map(interview => {
              const candidateName = interview.seeker_profile?.full_name || 'N/A';
              const candidateAvatar = interview.seeker_profile?.avatar_url || null;
              const jobTitle = interview.job?.title || 'N/A';
              const interviewFormat = interview.interview_format || 'N/A';
              const status = interview.status || 'unknown';

              return (
                <div
                  key={interview.id}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary-200 cursor-pointer transition-all duration-300"
                  onClick={() => onSelectInterview(interview)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {candidateAvatar ? (
                          <img
                            src={candidateAvatar}
                            alt={candidateName}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(candidateName)} ${
                            candidateAvatar ? 'hidden' : 'flex'
                          }`}
                        >
                          {getInitials(candidateName)}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">{candidateName}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <Briefcase className="w-4 h-4 mr-2" />
                          <span>{jobTitle}</span>
                        </div>
                      </div>
                    </div>
                     <div className="flex flex-col items-end gap-1">
                       <Badge variant={status === 'scheduled' ? 'info' : (status === 'cancelled' ? 'destructive' : 'success')} size="sm">
                         Interview: {status}
                       </Badge>
                       {interview.application_status && (
                         <Badge variant={
                           interview.application_status === 'interviewing' ? 'info' : 
                           interview.application_status === 'offered' || interview.application_status === 'hired' ? 'success' :
                           interview.application_status === 'rejected' ? 'destructive' : 'warning'
                         } size="sm">
                           Candidate: {interview.application_status}
                         </Badge>
                       )}
                     </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100 space-x-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{getInterviewTime(interview.interview_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      {interviewFormat === 'video' ? 
                        <Video className="w-4 h-4 text-gray-400" /> : 
                        <MapPin className="w-4 h-4 text-gray-400" />}
                      <span>{interviewFormat}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )) : (
        <div className="text-center py-16 text-gray-500 h-full flex flex-col justify-center items-center">
            <Calendar className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No interviews scheduled</h3>
            <p className="text-sm text-gray-500 mt-1">Check back later or schedule a new interview.</p>
        </div>
      )}
    </div>
  );
};

export default InterviewList; 