import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/common';
import EmployerOnboarding from './EmployerOnboarding';
import CandidateOnboarding from './CandidateOnboarding';
import { useNavigate } from 'react-router-dom';

const OnboardingRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if onboarding is complete
  useEffect(() => {
    if (!loading && user?.onboarding_complete) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

  // If onboarding is complete, redirect to dashboard
  if (user.onboarding_complete) {
    navigate('/dashboard');
    return null;
  }

  // Route based on user type
  if (user.user_type === 'employer') {
    return <EmployerOnboarding />;
  }

  if (user.user_type === 'job_seeker') {
    return <CandidateOnboarding />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Velai v3!
        </h2>
        <p className="text-gray-600 mb-6">
          Something went wrong. Please try logging in again.
        </p>
      </div>
    </div>
  );
};

export default OnboardingRouter;
