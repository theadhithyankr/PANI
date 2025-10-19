import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/common';
import ToastProvider from './components/common/ToastProvider';
import useGlobalStore from './stores/globalStore';

// Import pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import OnboardingRouter from './components/onboarding/OnboardingRouter';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CreateJobPage from './pages/employer/CreateJobPage';
import AwaitingConfirmationPage from './pages/auth/AwaitingConfirmationPage';
import EmailVerifiedPage from './pages/auth/EmailVerifiedPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CompanyNotVerifiedPage from './pages/auth/CompanyNotVerifiedPage';
// V4 Pages
import HiringProcessPage from './pages/v4/HiringProcessPage';
import CandidateApplicationJourneyPage from './pages/v4/CandidateApplicationJourneyPage';
import JobApplicationPage from './pages/v4/JobApplicationPage';
// Agent Pages
import JobMatchingAgentPage from './pages/agent/JobMatchingAgentPage';
import CandidateAIAgentPage from './pages/agent/CandidateAIAgentPage';
import EmployerAIAgentPage from './pages/agent/EmployerAIAgentPage';

// Protected Route Component
const ProtectedRoute = ({ children, checkEmailVerification = false, adminOnly = false }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (checkEmailVerification && !user.is_email_verified) {
    return <Navigate to="/awaiting-confirmation" state={{ email: user.email }} />;
  }

  if (adminOnly && user.user_type !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

// Dashboard Router Component (with onboarding and verification check)
const DashboardRouter = () => {
  const { user } = useAuth();
  const { company } = useGlobalStore();
  
  if (!user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.user_type === 'employer' && company && company.is_approved === false) {
    return <Navigate to="/company-not-verified" replace />;
  }
  
  if (user.user_type === 'employer') {
    return <EmployerDashboard />;
  }
  
  if (user.user_type === 'job_seeker') {
    return <CandidateDashboard />;
  }
  
  if (user.user_type === 'admin') {
    return <AdminDashboard />;
  }

  return <div>Unknown user type</div>;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/landing" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
      <Route path="/awaiting-confirmation" element={<AwaitingConfirmationPage />} />
      <Route path="/email-verified" element={<EmailVerifiedPage />} />
      
      {/* Company Not Verified Route */}
      <Route 
        path="/company-not-verified"
        element={
          <ProtectedRoute>
            <CompanyNotVerifiedPage />
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/admin/login" 
        element={
          user ? (
            user.user_type === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />
          ) : (
            <AdminLoginPage />
          )
        } 
      />
      {/* Onboarding Route */}
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute checkEmailVerification={true}>
            <OnboardingRouter />
          </ProtectedRoute>
        } 
      />
      {/* Protected Dashboard Route with onboarding logic */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } 
      />
      {/* Employer Create Job Route */}
      <Route path="/dashboard/employer/jobs/create" element={<CreateJobPage />} />
      {/* Admin Dashboard Route */}
      <Route 
        path="/admin/dashboard/*" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* V4 Routes */}
      <Route 
        path="/v4/employer/hiring-process/:jobId" 
        element={
          <ProtectedRoute>
            <HiringProcessPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/v4/candidate/application-journey/:applicationId" 
        element={
          <ProtectedRoute>
            <CandidateApplicationJourneyPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/v4/candidate/applications" 
        element={
          <ProtectedRoute>
            <JobApplicationPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Agent Routes - HIDDEN */}
      {/* <Route 
        path="/agent" 
        element={
          <ProtectedRoute>
            <JobMatchingAgentPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/agent/candidate" 
        element={
          <ProtectedRoute>
            <CandidateAIAgentPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/agent/employer" 
        element={
          <ProtectedRoute>
            <EmployerAIAgentPage />
          </ProtectedRoute>
        } 
      /> */}
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
