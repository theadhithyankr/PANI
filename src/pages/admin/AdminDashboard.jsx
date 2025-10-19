import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  Settings, 
  X,
  Building,
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/common';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import UserManagementPage from './UserManagementPage';
import JobManagementPage from './JobManagementPage';
import AdminSettingsPage from './AdminSettingsPage';
import CompanyManagementPage from './CompanyManagementPage';
import ApplicationManagementPage from './ApplicationManagementPage';
import DocumentManagementPage from './DocumentManagementPage';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper function to get page info
  const getPageInfo = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (path.endsWith('/admin/dashboard') || path.endsWith('/admin/dashboard/')) {
      return {
        pageName: 'Users',
        breadcrumbs: [{ name: 'Admin', href: '/admin/dashboard' }, { name: 'Users' }]
      };
    }
    
    const pageMap = {
      'users': { name: 'User Management', breadcrumbs: [{ name: 'Admin', href: '/admin/dashboard' }, { name: 'Users' }] },
      'companies': { name: 'Company Management', breadcrumbs: [{ name: 'Admin', href: '/admin/dashboard' }, { name: 'Companies' }] },
      'jobs': { name: 'Job Management', breadcrumbs: [{ name: 'Admin', href: '/admin/dashboard' }, { name: 'Jobs' }] },
      'applications': { name: 'Application Management', breadcrumbs: [{ name: 'Admin', href: '/admin/dashboard' }, { name: 'Applications' }] },
      'documents': { name: 'Document Management', breadcrumbs: [{ name: 'Admin', href: '/admin/dashboard' }, { name: 'Documents' }] },
      'settings': { name: 'Settings', breadcrumbs: [{ name: 'Admin', href: '/admin/dashboard' }, { name: 'Settings' }] }
    };
    
    const currentPage = segments[2];
    const pageInfo = pageMap[currentPage];
    
    if (!pageInfo) {
      return { pageName: 'Admin', breadcrumbs: [] };
    }
    
    return {
      pageName: pageInfo.name,
      breadcrumbs: pageInfo.breadcrumbs
    };
  };

  const { pageName, breadcrumbs } = getPageInfo();

  const navigation = [
    { name: 'Users', href: '/admin/dashboard/users', icon: Users, navigate },
    { name: 'Companies', href: '/admin/dashboard/companies', icon: Building, navigate },
    { name: 'Jobs', href: '/admin/dashboard/jobs', icon: Briefcase, navigate },
    { name: 'Applications', href: '/admin/dashboard/applications', icon: FileText, navigate },
    { name: 'Documents', href: '/admin/dashboard/documents', icon: FileText, navigate },
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
            <Sidebar navigation={navigation} currentPath={location.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-16">
          <Sidebar navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onToggleSidebar={() => setSidebarOpen(true)}
          pageName={pageName}
          breadcrumbs={breadcrumbs}
          searchPlaceholder="Search..."
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Routes>
              <Route index element={<Navigate to="users" />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="companies" element={<CompanyManagementPage />} />
              <Route path="jobs" element={<JobManagementPage />} />
              <Route path="applications" element={<ApplicationManagementPage />} />
              <Route path="documents" element={<DocumentManagementPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="*" element={<Navigate to="/admin/dashboard/users" />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 