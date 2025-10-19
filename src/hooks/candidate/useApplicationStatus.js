import { useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';
import { useToast } from '../common/useToast';

export const useApplicationStatus = () => {
  const { success: showSuccess, error: showError } = useToast();

  // Update application status (for candidate actions)
  const updateApplicationStatus = useCallback(async (applicationId, status, notes = '') => {
    try {
      const { data, error } = await supabase
        .from('job_applications_v2')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(notes && { employer_notes: notes })
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error updating application status:', err);
      throw err;
    }
  }, []);

  // Accept direct interview invitation
  const acceptDirectInterview = useCallback(async (applicationId, interviewId) => {
    try {
      // For direct interviews, we need to extract the real interview ID and handle application creation
      let realApplicationId = applicationId;
      let realInterviewId = interviewId;

      // Check if this is a prefixed direct interview ID
      if (applicationId.startsWith('direct-interview-')) {
        realInterviewId = applicationId.replace('direct-interview-', '');
        
        // For direct interviews, we need to create an application record first
        // or find an existing one if the candidate previously interacted with it
        const { data: existingApp, error: checkError } = await supabase
          .from('job_applications_v2')
          .select('id')
          .eq('applicant_id', (await supabase.auth.getUser()).data.user.id)
          .eq('job_id', (await supabase
            .from('interviews_v2')
            .select('job_id')
            .eq('id', realInterviewId)
            .single()).data?.job_id)
          .single();

        if (!existingApp && !checkError) {
          // Create an application record for the accepted direct interview
          const interviewData = await supabase
            .from('interviews_v2')
            .select('job_id, seeker_id')
            .eq('id', realInterviewId)
            .single();

          if (interviewData.data) {
            const { data: newApp, error: createError } = await supabase
              .from('job_applications_v2')
              .insert({
                job_id: interviewData.data.job_id,
                applicant_id: (await supabase.auth.getUser()).data.user.id,
                status: 'interviewing',
                cover_note: 'Direct interview invitation accepted',
                application_date: new Date().toISOString()
              })
              .select('id')
              .single();

            if (createError) throw createError;
            realApplicationId = newApp.id;
          }
        } else if (existingApp) {
          realApplicationId = existingApp.id;
          // Update existing application status to 'interviewing'
          await updateApplicationStatus(realApplicationId, 'interviewing');
        }
      } else {
        // Regular application, update normally
        await updateApplicationStatus(applicationId, 'interviewing');
      }
      
      // Update interview status to 'scheduled' (if it was pending)
      if (realInterviewId) {
        const { error: interviewError } = await supabase
          .from('interviews_v2')
          .update({ status: 'scheduled' })
          .eq('id', realInterviewId);

        if (interviewError) throw interviewError;
      }

      showSuccess('Interview invitation accepted successfully!');
      return true;
    } catch (err) {
      console.error('Error accepting direct interview:', err);
      showError('Failed to accept interview invitation. Please try again.');
      return false;
    }
  }, [updateApplicationStatus, showSuccess, showError]);

  // Accept regular application
  const acceptApplication = useCallback(async (applicationId) => {
    try {
      // Update application status to 'accepted'
      await updateApplicationStatus(applicationId, 'accepted');
      
      showSuccess('Application accepted successfully!');
      return true;
    } catch (err) {
      console.error('Error accepting application:', err);
      showError('Failed to accept application. Please try again.');
      return false;
    }
  }, [updateApplicationStatus, showSuccess, showError]);

  // Reject direct interview invitation
  const rejectDirectInterview = useCallback(async (applicationId, interviewId, reason = '') => {
    try {
      // For direct interviews, we need to extract the real interview ID from the prefixed applicationId
      // and create a dummy application record if it doesn't exist
      let realApplicationId = applicationId;
      let realInterviewId = interviewId;

      // Check if this is a prefixed direct interview ID
      if (applicationId.startsWith('direct-interview-')) {
        realInterviewId = applicationId.replace('direct-interview-', '');
        
        // For direct interviews, we need to create a dummy application record first
        // or find an existing one if the candidate accepted then rejected
        const { data: existingApp, error: checkError } = await supabase
          .from('job_applications_v2')
          .select('id')
          .eq('applicant_id', (await supabase.auth.getUser()).data.user.id)
          .eq('job_id', (await supabase
            .from('interviews_v2')
            .select('job_id')
            .eq('id', realInterviewId)
            .single()).data?.job_id)
          .single();

        if (!existingApp && !checkError) {
          // Create a dummy application record for tracking the rejection
          const interviewData = await supabase
            .from('interviews_v2')
            .select('job_id, seeker_id')
            .eq('id', realInterviewId)
            .single();

          if (interviewData.data) {
            const { data: newApp, error: createError } = await supabase
              .from('job_applications_v2')
              .insert({
                job_id: interviewData.data.job_id,
                applicant_id: (await supabase.auth.getUser()).data.user.id,
                status: 'declined',
                cover_note: 'Direct interview invitation rejected',
                application_date: new Date().toISOString()
              })
              .select('id')
              .single();

            if (createError) throw createError;
            realApplicationId = newApp.id;
          }
        } else if (existingApp) {
          realApplicationId = existingApp.id;
          // Update existing application status to 'declined'
          await updateApplicationStatus(realApplicationId, 'declined', reason);
        }
      } else {
        // Regular application, update normally
        await updateApplicationStatus(applicationId, 'declined', reason);
      }
      
      // Update interview status to 'cancelled'
      if (realInterviewId) {
        const { error: interviewError } = await supabase
          .from('interviews_v2')
          .update({ status: 'cancelled' })
          .eq('id', realInterviewId);

        if (interviewError) throw interviewError;
      }

      showSuccess('Interview invitation rejected successfully.');
      return true;
    } catch (err) {
      console.error('Error rejecting direct interview:', err);
      showError('Failed to reject interview invitation. Please try again.');
      return false;
    }
  }, [updateApplicationStatus, showSuccess, showError]);

  // Reject regular application
  const rejectApplication = useCallback(async (applicationId, reason = '') => {
    try {
      // Update application status to 'declined'
      await updateApplicationStatus(applicationId, 'declined', reason);
      
      showSuccess('Application rejected successfully.');
      return true;
    } catch (err) {
      console.error('Error rejecting application:', err);
      showError('Failed to reject application. Please try again.');
      return false;
    }
  }, [updateApplicationStatus, showSuccess, showError]);

  // Request reschedule for direct interview
  const requestReschedule = useCallback(async (applicationId, interviewId, reason = '') => {
    try {
      // Update interview status to 'rescheduled'
      if (interviewId) {
        const { error: interviewError } = await supabase
          .from('interviews_v2')
          .update({ 
            status: 'rescheduled',
            notes: reason ? `Reschedule request: ${reason}` : 'Reschedule requested by candidate'
          })
          .eq('id', interviewId);

        if (interviewError) throw interviewError;
      }

      showSuccess('Reschedule request sent successfully! The employer will contact you with new details.');
      return true;
    } catch (err) {
      console.error('Error requesting reschedule:', err);
      showError('Failed to send reschedule request. Please try again.');
      return false;
    }
  }, [showSuccess, showError]);

  // Request reschedule for regular application
  const requestApplicationReschedule = useCallback(async (applicationId, reason = '') => {
    try {
      // Update application status to 'reviewing' (to indicate reschedule request)
      await updateApplicationStatus(applicationId, 'reviewing', `Reschedule request: ${reason || 'No reason provided'}`);
      
      showSuccess('Reschedule request sent successfully! The employer will contact you with new details.');
      return true;
    } catch (err) {
      console.error('Error requesting application reschedule:', err);
      showError('Failed to send reschedule request. Please try again.');
      return false;
    }
  }, [updateApplicationStatus, showSuccess, showError]);

  // Cancel reschedule request (revert interview back to scheduled)
  const cancelRescheduleRequest = useCallback(async (applicationId, interviewId, reason = '') => {
    try {
      // For direct interviews, extract real IDs if needed
      let realInterviewId = interviewId;
      if (applicationId.startsWith('direct-interview-')) {
        realInterviewId = applicationId.replace('direct-interview-', '');
      }
      
      // Update interview status back to 'scheduled'
      if (realInterviewId) {
        const { error: interviewError } = await supabase
          .from('interviews_v2')
          .update({ 
            status: 'scheduled',
            notes: reason || 'Reschedule request cancelled by candidate'
          })
          .eq('id', realInterviewId);

        if (interviewError) throw interviewError;
      }

      showSuccess('Reschedule request cancelled successfully.');
      return true;
    } catch (err) {
      console.error('Error cancelling reschedule request:', err);
      showError('Failed to cancel reschedule request. Please try again.');
      return false;
    }
  }, [showSuccess, showError]);

  return {
    updateApplicationStatus,
    acceptDirectInterview,
    acceptApplication,
    rejectDirectInterview,
    rejectApplication,
    requestReschedule,
    requestApplicationReschedule,
    cancelRescheduleRequest
  };
};
