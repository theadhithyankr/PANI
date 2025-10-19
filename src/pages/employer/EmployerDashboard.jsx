import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Calendar, 
  Settings, 
  X,
  MessageSquare,
  MessageCircle,
  Bot
} from 'lucide-react';
import { useAuth } from '../../hooks/common';
import { useEmployerProfile } from '../../hooks/employer';
import { getJobById } from '../../data/dummyData';
import ChatInterface from '../../components/dashboard/ChatInterface';
import ChatHistoryPage from '../ai/ChatHistoryPage';
import ChatWidget from '../../components/employer/ChatWidget';
import JobsPage from './JobsPage';
import CandidatesPage from './CandidatesPage';
import InterviewsPage from './InterviewsPage';
import JobApplicantsPage from './JobApplicantsPage';
import EmployerSettingsPage from './EmployerSettingsPage';
import EmployerMessagesPage from './MessagesPage';
import JobForm from '../../components/employer/JobForm';
import iconmarkLogo from '../../assets/logos/iconmark.svg';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';

const EmployerDashboard = () => {
  const { t } = useTranslation('employer');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Get employer profile data
  const { basicProfile, isLoading: profileLoading } = useEmployerProfile(user?.id);

  // Helper function to get page info
  const getPageInfo = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (path === '/dashboard' || path === '/dashboard/') {
      // Always show chat breadcrumbs on the main dashboard (ChatInterface)
      const chatTitle = location.state?.chatTitle || t('dashboard.newChat');
      return {
        pageName: '',
        breadcrumbs: [
          { name: t('dashboard.allChats'), href: '/dashboard/chat-history' },
          { name: chatTitle }
        ]
      };
    }
    
    // Handle AI Agent pages
    if (segments[0] === 'agent') {
      if (segments[1] === 'employer') {
        return {
          pageName: 'AI Hiring Assistant',
          breadcrumbs: [
            { name: t('dashboard.dashboard'), href: '/dashboard' },
            { name: 'AI Agent' }
          ]
        };
      }
      return {
        pageName: 'AI Agent',
        breadcrumbs: [
          { name: t('dashboard.dashboard'), href: '/dashboard' },
          { name: 'AI Agent' }
        ]
      };
    }
    
    // Handle job applicants page specifically
    if (segments.length === 3 && segments[1] === 'jobs') {
      const jobId = segments[2];
      const job = getJobById(jobId);
      if (job) {
        const jobTitle = job.title;
        return {
          pageName: jobTitle,
          breadcrumbs: [
            { name: t('dashboard.dashboard'), href: '/dashboard' },
            { name: t('dashboard.jobs'), href: '/dashboard/jobs' },
            { name: jobTitle }
          ]
        };
      }
      return {
        pageName: t('dashboard.jobDetails'),
        breadcrumbs: [
          { name: t('dashboard.dashboard'), href: '/dashboard' },
          { name: t('dashboard.jobs'), href: '/dashboard/jobs' },
          { name: t('dashboard.jobDetails') }
        ]
      };
    }
    
    const pageMap = {
      'jobs': { name: t('dashboard.jobs'), breadcrumbs: [{ name: t('dashboard.dashboard'), href: '/dashboard' }, { name: t('dashboard.jobs') }] },
      'candidates': { name: t('dashboard.candidates'), breadcrumbs: [{ name: t('dashboard.dashboard'), href: '/dashboard' }, { name: t('dashboard.candidates') }] },
      'chat-history': { name: t('dashboard.chatHistory'), breadcrumbs: [{ name: t('dashboard.dashboard'), href: '/dashboard' }, { name: t('dashboard.chatHistory') }] },
      'interviews': { name: t('dashboard.interviews'), breadcrumbs: [{ name: t('dashboard.dashboard'), href: '/dashboard' }, { name: t('dashboard.interviews') }] },
      'settings': { name: t('dashboard.settings'), breadcrumbs: [{ name: t('dashboard.dashboard'), href: '/dashboard' }, { name: t('dashboard.settings') }] }
    };
    
    const currentPage = segments[1]; // dashboard is segments[0]
    const pageInfo = pageMap[currentPage];
    
    if (!pageInfo) {
      return { pageName: '', breadcrumbs: [] };
    }
    
    return {
      pageName: pageInfo.name,
      breadcrumbs: pageInfo.breadcrumbs
    };
  };

  const { pageName, breadcrumbs } = getPageInfo();

  const navigation = [
    { name: t('dashboard.dashboard'), href: '/dashboard', icon: LayoutDashboard, navigate },
    { name: t('dashboard.aiChats'), href: '/dashboard/chat-history', icon: MessageSquare, navigate },
    //{ name: 'AI Agent', href: '/agent/employer', icon: Bot, navigate },
    { name: t('dashboard.jobs'), href: '/dashboard/jobs', icon: Briefcase, navigate },

    { name: t('dashboard.interviews'), href: '/dashboard/interviews', icon: Calendar, navigate },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageCircle, navigate },
  ];

  const handleCreateJob = () => {
    setEditingJob(null);
    setShowJobForm(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleSaveJob = (jobData) => {
    console.log('Save job:', jobData);
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleCancelJobForm = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handlePreviewJob = (jobData) => {
    console.log('Preview job:', jobData);
  };

  const handleJobCreatedFromAI = (jobData) => {
    console.log('Job created from AI:', jobData);
    // You could navigate to jobs page or show a success message
    navigate('/dashboard/jobs');
  };

  if (showJobForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <JobForm
          job={editingJob}
          onSave={handleSaveJob}
          onCancel={handleCancelJobForm}
          onPreview={handlePreviewJob}
          mode={editingJob ? 'edit' : 'create'}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar navigation={navigation} currentPath={location.pathname} profileData={basicProfile} isLoading={profileLoading} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-16">
          <Sidebar navigation={navigation} currentPath={location.pathname} profileData={basicProfile} isLoading={profileLoading} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onToggleSidebar={() => setSidebarOpen(true)}
          pageName={pageName}
          breadcrumbs={breadcrumbs}
          searchPlaceholder={t('dashboard.searchPlaceholder')}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={
              <div className="p-6">
                <ChatInterface showHeader={false} currentChatTitle={location.state?.chatTitle} />
              </div>
            } />
            <Route path="/chat-history" element={
              <div className="p-6">
                <ChatHistoryPage />
              </div>
            } />
            <Route path="/jobs" element={
              <div className="p-6">
                <JobsPage onCreateJob={handleCreateJob} onEditJob={handleEditJob} />
              </div>
            } />
            <Route path="/jobs/:jobId" element={
              <div className="p-6">
                <JobApplicantsPage />
              </div>
            } />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/interviews" element={
              <div className="p-6">
                <InterviewsPage />
              </div>
            } />
            <Route path="/messages" element={<EmployerMessagesPage />} />
            <Route path="/messages/:conversationId" element={<EmployerMessagesPage />} />
            <Route path="/settings" element={
              <div className="p-6">
                <EmployerSettingsPage />
              </div>
            } />
          </Routes>
        </main>
      </div>

      {/* AI Chat Widget - Available on all pages */}
      {/* <ChatWidget onJobCreated={handleJobCreatedFromAI} /> */}
    </div>
  );
};

export default EmployerDashboard;
