import React, { useState, useEffect } from 'react';
import { supabase } from '../../clients/supabaseClient';
import toast from 'react-hot-toast';
import useGlobalStore from '../../stores/globalStore';

const InterviewSchedulingModal = ({
  isOpen,
  onClose,
  onSchedule,
  candidate: selectedCandidate,
  interviewDetails,
  setInterviewDetails,
  isLoading,
}) => {
  const user = useGlobalStore((state) => state.user);

  useEffect(() => {
    if (user?.id && !interviewDetails.interviewer_id) {
      setInterviewDetails(prev => ({ ...prev, interviewer_id: user.id }));
    }
  }, [user?.id, interviewDetails.interviewer_id, setInterviewDetails]);

  const handleSchedule = async () => {
    onSchedule(interviewDetails);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedCandidate?.applicationId 
              ? `Schedule Interview for ${selectedCandidate?.name}`
              : `Send Invitation with Interview for ${selectedCandidate?.name}`
            }
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Date *
              </label>
              <input
                type="date"
                value={interviewDetails.interview_date}
                onChange={(e) => setInterviewDetails(prev => ({ ...prev, interview_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Time *
              </label>
              <input
                type="time"
                value={interviewDetails.interview_time}
                onChange={(e) => setInterviewDetails(prev => ({ ...prev, interview_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
          </div>

          {/* Interview Type and Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Type
              </label>
              <select
                value={interviewDetails.interview_type}
                onChange={(e) => setInterviewDetails(prev => ({ ...prev, interview_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="1st_interview">Initial Interview</option>
                <option value="technical">Technical Interview</option>
                <option value="hr_interview">HR Interview</option>
                <option value="final">Final Interview</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Format
              </label>
              <select
                value={interviewDetails.interview_format}
                onChange={(e) => setInterviewDetails(prev => ({ ...prev, interview_format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="video_call">Video Call</option>
                <option value="phone_call">Phone Call</option>
                <option value="in_person">In Person</option>
              </select>
            </div>
          </div>

          {/* Duration and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                value={interviewDetails.duration_minutes}
                onChange={(e) => setInterviewDetails(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location / Meeting Link
              </label>
              <input
                type="text"
                value={interviewDetails.location}
                onChange={(e) => setInterviewDetails(prev => ({ ...prev, location: e.target.value }))}
                placeholder={interviewDetails.interview_format === 'video_call' ? 'Google Meet, Zoom, etc.' : 'Office address'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Interviewer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interviewer
            </label>
            <select
              value={interviewDetails.interviewer}
              onChange={(e) => setInterviewDetails(prev => ({ ...prev, interviewer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value={user?.id}>You (Current User)</option>
              {/* Add other interviewers here if needed */}
            </select>
          </div>

          {/* Agenda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Agenda / Notes
            </label>
            <textarea
              value={interviewDetails.agenda}
              onChange={(e) => setInterviewDetails(prev => ({ ...prev, agenda: e.target.value }))}
              placeholder="What will be discussed in this interview?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
          >
            {selectedCandidate?.applicationId ? 'Schedule Interview' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSchedulingModal;