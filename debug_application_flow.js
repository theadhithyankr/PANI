// Debug Application Flow Script
// Add this temporarily to your CandidateApplicationJourneyPage.jsx to debug the data flow

// Add this function to help debug the application data
const debugApplicationFlow = (application, user) => {
  console.log('=== DEBUG APPLICATION FLOW ===');
  console.log('User ID:', user?.id);
  console.log('Application ID from URL:', applicationId);
  console.log('Application Object:', application);
  
  if (application) {
    console.log('Application Details:');
    console.log('- application.id:', application.id);
    console.log('- application.jobId:', application.jobId);
    console.log('- application.isInvitation:', application.isInvitation);
    console.log('- application.status:', application.status);
    
    // Check flow detection logic
    const isInvitationFlow = !application.id || application.isInvitation;
    console.log('Flow Detection:');
    console.log('- !application.id:', !application.id);
    console.log('- application.isInvitation:', application.isInvitation);
    console.log('- isInvitationFlow:', isInvitationFlow);
    
    if (isInvitationFlow) {
      console.log('USING INVITATION FLOW QUERY:');
      console.log('- Query will use seeker_id:', user?.id);
      console.log('- Query will use job_id:', application.jobId);
    } else {
      console.log('USING REGULAR APPLICATION FLOW QUERY:');
      console.log('- Query will use application_id:', application.id);
    }
  } else {
    console.log('❌ No application object found!');
  }
  console.log('=== END DEBUG ===');
};

// Add this to your fetchInterviewData function (before the query)
const debugQuery = (isInvitationFlow, application, user) => {
  console.log('=== QUERY DEBUG ===');
  console.log('Flow type:', isInvitationFlow ? 'INVITATION' : 'REGULAR');
  
  if (isInvitationFlow) {
    console.log('Invitation Query Parameters:');
    console.log('- seeker_id:', user?.id);
    console.log('- job_id:', application?.jobId);
    
    // Manual query to test
    console.log('Manual test query:');
    console.log(`
      SELECT COUNT(*) FROM interviews_v2 
      WHERE seeker_id = '${user?.id}' 
      AND job_id = '${application?.jobId}';
    `);
  } else {
    console.log('Regular Query Parameters:');
    console.log('- application_id:', application?.id);
    
    // Manual query to test
    console.log('Manual test query:');
    console.log(`
      SELECT COUNT(*) FROM interviews_v2 
      WHERE application_id = '${application?.id}';
    `);
  }
  console.log('=== END QUERY DEBUG ===');
};

// Add this after your query execution to debug the results
const debugQueryResults = (interviews, error) => {
  console.log('=== QUERY RESULTS DEBUG ===');
  if (error) {
    console.error('❌ Query Error:', error);
  } else {
    console.log('✅ Query Success');
    console.log('Raw interviews data:', interviews);
    console.log('Number of interviews found:', interviews?.length || 0);
    
    if (interviews && interviews.length > 0) {
      console.log('First interview sample:', interviews[0]);
    } else {
      console.log('❌ No interviews found in database');
    }
  }
  console.log('=== END RESULTS DEBUG ===');
};

// Quick database check function (add this to your component)
const quickDatabaseCheck = async (user, application) => {
  console.log('=== QUICK DATABASE CHECK ===');
  
  try {
    // Check total interviews in database
    const { data: totalCount, error: totalError } = await supabase
      .from('interviews_v2')
      .select('id', { count: 'exact' });
    
    console.log('Total interviews in database:', totalCount?.length || 0);
    
    if (application?.jobId && user?.id) {
      // Check specific seeker + job combination
      const { data: specificData, error: specificError } = await supabase
        .from('interviews_v2')
        .select('*')
        .eq('seeker_id', user.id)
        .eq('job_id', application.jobId);
      
      console.log(`Interviews for seeker ${user.id} + job ${application.jobId}:`, specificData?.length || 0);
      if (specificData && specificData.length > 0) {
        console.log('Sample interview:', specificData[0]);
      }
    }
    
    if (application?.id) {
      // Check application-based interviews
      const { data: appData, error: appError } = await supabase
        .from('interviews_v2')
        .select('*')
        .eq('application_id', application.id);
      
      console.log(`Interviews for application ${application.id}:`, appData?.length || 0);
      if (appData && appData.length > 0) {
        console.log('Sample application interview:', appData[0]);
      }
    }
    
  } catch (error) {
    console.error('Database check error:', error);
  }
  
  console.log('=== END DATABASE CHECK ===');
};

// Export for use in your component
export { debugApplicationFlow, debugQuery, debugQueryResults, quickDatabaseCheck };

/* 
USAGE INSTRUCTIONS:

1. Import these functions in your CandidateApplicationJourneyPage.jsx:
   import { debugApplicationFlow, debugQuery, debugQueryResults, quickDatabaseCheck } from './debug_application_flow.js';

2. Add debugging calls in your component:

   // In the useEffect where you set the application:
   useEffect(() => {
     // ... existing code ...
     if (foundApplication) {
       debugApplicationFlow(foundApplication, user);
       quickDatabaseCheck(user, foundApplication);
       setApplication(foundApplication);
     }
   }, [applications, invitations, applicationId, user?.id]);

   // In your fetchInterviewData function:
   const fetchInterviewData = async (application) => {
     // ... existing code ...
     const isInvitationFlow = !application.id || application.isInvitation;
     
     debugQuery(isInvitationFlow, application, user);
     
     // ... your query code ...
     
     const { data: interviews, error: interviewError } = await query;
     
     debugQueryResults(interviews, interviewError);
     
     // ... rest of function ...
   };

3. Open browser console to see the debug output
4. Remove these debug calls once you identify the issue
*/