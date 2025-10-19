import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, LayoutDashboard, MessageSquare, Bot, Search, FileText, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/common';
import { useJobSeekerProfile } from '../../hooks/candidate/useJobSeekerProfile';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import CandidateAIAgentComponent from '../../components/agent/CandidateAIAgentComponent';

const CandidateAIAgentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { basicProfile, profile, isLoading: profileLoading } = useJobSeekerProfile(user?.id);

  useEffect(() => {
    document.title = 'AI Career Assistant - VelAI';
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, navigate },
    { name: 'AI Chats', href: '/dashboard/chat-history', icon: MessageSquare, navigate },
    { name: 'AI Agent', href: '/agent/candidate', icon: Bot, navigate },
    { name: 'Job Search', href: '/dashboard/jobs', icon: Search, navigate },
    { name: 'Applications', href: '/dashboard/applications', icon: FileText, navigate },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageCircle, navigate },
  ];

  const pageName = 'AI Career Assistant';
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'AI Agent' }
  ];

  return (
    <div className="h-screen flex bg-gray-50">
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onToggleSidebar={() => setSidebarOpen(true)}
          pageName={pageName}
          breadcrumbs={breadcrumbs}
          searchPlaceholder="Ask the AI career assistant..."
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <CandidateAIAgentComponent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateAIAgentPage;
