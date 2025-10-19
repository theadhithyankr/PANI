import React, { useState } from 'react';
import { Calendar, Send, FileText, Users } from 'lucide-react';
import Button from '../common/Button';
import { useUnifiedInterviewScheduling } from '../../hooks/employer/useUnifiedInterviewScheduling';

const InterviewFlowSelector = ({ candidate, job, onClose }) => {
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [interviewData, setInterviewData] = useState({
    interviewType: '1st_interview',
    interviewFormat: 'video',
    durationMinutes: 60,
    location: '',
    meetingLink: '',
    agenda: '',
    notes: '',
    message: ''
  });

  const {
    scheduleDirectInterview,
    sendInterviewInvitation,
    scheduleInterviewFromApplication,
    loading
  } = useUnifiedInterviewScheduling();

  const handleFlowSelect = (flow) => {
    setSelectedFlow(flow);
  };

  const handleSubmit = async () => {
    try {
      const baseData = {
        jobId: job.id,
        candidateId: candidate.id,
        ...interviewData
      };

      let result;
      switch (selectedFlow) {
        case 'direct':
          result = await scheduleDirectInterview({
            ...baseData,
            interviewDate: new Date().toISOString() // You'd get this from a date picker
          });
          break;
        case 'invitation':
          result = await sendInterviewInvitation({
            ...baseData,
            proposedDate: new Date().toISOString() // You'd get this from a date picker
          });
          break;
        case 'application':
          // This would require an existing application
          result = await scheduleInterviewFromApplication({
            ...baseData,
            applicationId: candidate.applicationId, // You'd need to pass this
            interviewDate: new Date().toISOString()
          });
          break;
        default:
          throw new Error('Please select a flow');
      }

      console.log('Interview scheduled:', result);
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
    }
  };

  if (!selectedFlow) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Interview Flow</h3>
        <div className="space-y-3">
          <Button
            onClick={() => handleFlowSelect('direct')}
            className="w-full justify-start"
            variant="outline"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Direct Interview Scheduling
            <span className="text-xs text-gray-500 ml-2">(Schedule immediately)</span>
          </Button>
          
          <Button
            onClick={() => handleFlowSelect('invitation')}
            className="w-full justify-start"
            variant="outline"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Invitation
            <span className="text-xs text-gray-500 ml-2">(Candidate accepts first)</span>
          </Button>
          
          <Button
            onClick={() => handleFlowSelect('application')}
            className="w-full justify-start"
            variant="outline"
          >
            <FileText className="w-4 h-4 mr-2" />
            Application-based Interview
            <span className="text-xs text-gray-500 ml-2">(From existing application)</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {selectedFlow === 'direct' && 'Direct Interview Scheduling'}
          {selectedFlow === 'invitation' && 'Send Interview Invitation'}
          {selectedFlow === 'application' && 'Application-based Interview'}
        </h3>
        <Button
          onClick={() => setSelectedFlow(null)}
          variant="ghost"
          size="sm"
        >
          Back
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Interview Type</label>
          <select
            value={interviewData.interviewType}
            onChange={(e) => setInterviewData({...interviewData, interviewType: e.target.value})}
            className="w-full p-2 border rounded-lg"
          >
            <option value="1st_interview">First Interview</option>
            <option value="technical">Technical Interview</option>
            <option value="hr_interview">HR Interview</option>
            <option value="final">Final Interview</option>
            <option value="phone_screen">Phone Screen</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Format</label>
          <select
            value={interviewData.interviewFormat}
            onChange={(e) => setInterviewData({...interviewData, interviewFormat: e.target.value})}
            className="w-full p-2 border rounded-lg"
          >
            <option value="video">Video Call</option>
            <option value="in_person">In Person</option>
            <option value="phone">Phone Call</option>
          </select>
        </div>

        {selectedFlow === 'invitation' && (
          <div>
            <label className="block text-sm font-medium mb-2">Message to Candidate</label>
            <textarea
              value={interviewData.message}
              onChange={(e) => setInterviewData({...interviewData, message: e.target.value})}
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Add a personal message to the candidate..."
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            loading={loading}
            className="flex-1"
          >
            {selectedFlow === 'direct' && 'Schedule Interview'}
            {selectedFlow === 'invitation' && 'Send Invitation'}
            {selectedFlow === 'application' && 'Schedule Interview'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewFlowSelector;
