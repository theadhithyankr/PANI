import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  User, 
  Settings, 
  X,
  Calendar,
  Gift,
  Globe,
  MessageCircle,
  MessageSquare,
  Bot
} from 'lucide-react';
import { useAuth } from '../../hooks/common';
import { useTheme } from '../../contexts/ThemeContext';
import { useJobSeekerProfile } from '../../hooks/candidate/useJobSeekerProfile';
import ChatInterface from '../../components/dashboard/ChatInterface';
import ChatHistoryPage from '../ai/ChatHistoryPage';
import JobSearchPage from './JobSearchPage';
import ApplicationsPage from './ApplicationsPage';
import ApplicationDetailsPage from './ApplicationDetailsPage';
import MessagesPage from './MessagesPage';
import ProfilePage from './ProfilePage';
import InterviewsPage from './InterviewsPage';
import VisaTrackingPage from './VisaTrackingPage';
import CandidateSettingsPage from './CandidateSettingsPage';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';

const CandidateDashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Fetch profile data for sidebar
  const { basicProfile, profile, isLoading: profileLoading } = useJobSeekerProfile(user?.id);

  // Helper function to get page info
  const getPageInfo = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (path === '/dashboard' || path === '/dashboard/') {
      // Always show chat breadcrumbs on the main dashboard (ChatInterface)
      const chatTitle = location.state?.chatTitle || 'New Chat';
      return {
        pageName: '',
        breadcrumbs: [
          { name: 'All Chats', href: '/dashboard/chat-history' },
          { name: chatTitle }
        ]
      };
    }
    
    // Handle AI Agent pages
    if (segments[0] === 'agent') {
      if (segments[1] === 'candidate') {
        return {
          pageName: 'AI Career Assistant',
          breadcrumbs: [
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'AI Agent' }
          ]
        };
      }
      return {
        pageName: 'AI Agent',
        breadcrumbs: [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'AI Agent' }
        ]
      };
    }
    
    // Handle application details page specifically
    if (segments.length === 3 && segments[1] === 'applications') {
      const applicationId = segments[2];
      return {
        pageName: 'Application Details',
        breadcrumbs: [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Applications', href: '/dashboard/applications' },
          { name: `Application ${applicationId}` }
        ]
      };
    }
    
    const pageMap = {
      'jobs': { name: 'Job Search', breadcrumbs: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Job Search' }] },
      'applications': { name: 'Applications', breadcrumbs: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Applications' }] },
      'chat-history': { name: 'Chat History', breadcrumbs: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Chat History' }] },
      'messages': { name: 'Messages', breadcrumbs: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Messages' }] },
      'interviews': { name: 'Interviews', breadcrumbs: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Interviews' }] },
      'visa': { name: 'Visa Tracking', breadcrumbs: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Visa Tracking' }] },
      'profile': { name: 'Profile', breadcrumbs: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Profile' }] },
      'settings': { name: 'Settings', breadcrumbs: [{ name: 'Dashboard', href: '/dashboard' }, { name: 'Settings' }] }
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
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, navigate },
    { name: 'AI Chats', href: '/dashboard/chat-history', icon: MessageSquare, navigate },
    //{ name: 'AI Agent', href: '/agent/candidate', icon: Bot, navigate },
    { name: 'Job Search', href: '/dashboard/jobs', icon: Search, navigate },
    { name: 'Applications', href: '/dashboard/applications', icon: FileText, navigate },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageCircle, navigate },
    // { name: 'Interviews', href: '/dashboard/interviews', icon: Calendar, navigate }, // Hidden for now
    // { name: 'Visa Tracking', href: '/dashboard/visa', icon: Globe, navigate }, // Hidden for now
    // { name: 'Profile', href: '/dashboard/profile', icon: User, navigate }, // Hidden for now
  ];

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
          <Sidebar 
            navigation={navigation} 
            currentPath={location.pathname} 
            profileData={{
              ...basicProfile,
              headline: profile?.headline,
              current_location: profile?.current_location
            }}
            isLoading={profileLoading}
          />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-16">
          <Sidebar 
            navigation={navigation} 
            currentPath={location.pathname} 
            profileData={{
              ...basicProfile,
              headline: profile?.headline,
              current_location: profile?.current_location
            }}
            isLoading={profileLoading}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onToggleSidebar={() => setSidebarOpen(true)}
          pageName={pageName}
          breadcrumbs={breadcrumbs}
          searchPlaceholder="Search jobs or ask AI for help..."
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<div className="p-6"><ChatInterface showHeader={false} currentChatTitle={location.state?.chatTitle} /></div>} />
            <Route path="/chat-history" element={<div className="p-6"><ChatHistoryPage /></div>} />
            <Route path="/jobs" element={<div className="p-6"><JobSearchPage /></div>} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/applications/:applicationId" element={<div className="p-6"><ApplicationDetailsPage /></div>} />
            <Route path="/messages" element={<div className="p-6"><MessagesPage /></div>} />
            <Route path="/messages/:conversationId" element={<div className="p-6"><MessagesPage /></div>} />
            <Route path="/interviews" element={<div className="p-6"><InterviewsPage /></div>} />
            <Route path="/offers" element={<div className="p-6"><ApplicationsPage /></div>} />
            <Route path="/visa" element={<div className="p-6"><VisaTrackingPage /></div>} />
            <Route path="/profile" element={<div className="p-6"><ProfilePage /></div>} />
            <Route path="/settings" element={<div className="p-6"><CandidateSettingsPage /></div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default CandidateDashboard;
