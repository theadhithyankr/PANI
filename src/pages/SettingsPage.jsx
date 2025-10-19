import React from 'react';
import { useAuth } from '../hooks/common';
import EmployerSettingsPage from './employer/EmployerSettingsPage';
import CandidateSettingsPage from './candidate/CandidateSettingsPage';

const SettingsPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  // Route based on user type
  switch (user.user_type) {
    case 'employer':
    case 'hr_manager':
    case 'tech_admin':
      return <EmployerSettingsPage />;
    case 'job_seeker':
      return <CandidateSettingsPage />;
    default:
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unknown User Type</h2>
            <p className="text-gray-600">Unable to determine the appropriate settings page.</p>
          </div>
        </div>
      );
  }
};

export default SettingsPage; 