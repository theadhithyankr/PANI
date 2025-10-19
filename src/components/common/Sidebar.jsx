import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, Settings, User, Home, Mail, CreditCard, HelpCircle, ExternalLink } from 'lucide-react';
import iconmarkLogo from '../../assets/logos/iconmark.svg';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { useAuth } from '../../hooks/common/useAuth';
import LanguageSwitcher from './LanguageSwitcher';
import { getProfileImageUrl } from '../../utils/imageUtils';

const Sidebar = ({ navigation, currentPath, profileData, isLoading }) => {
  const { t } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const profileMenuItems = [
    {
      label: t('nav.settings'),
      icon: Settings,
      onClick: () => {
        window.location.href = '/dashboard/settings';
        setIsProfileOpen(false);
      }
    },
    {
      label: t('nav.homepage'),
      icon: Home,
      onClick: () => handleExternalLink('https://velai.eu'),
      external: true
    },
    {
      label: t('nav.contactUs'),
      icon: Mail,
      onClick: () => handleExternalLink('https://velai.eu/contact'),
      external: true
    }
  ];

  // Dynamic user data from context and profile data
  const userData = profileData && !isLoading
    ? {
        name: profileData.full_name || profileData.name || 'User',
        email: profileData.email || user?.email || '',
        avatar: profileData.avatar_url || profileData.avatar || null,
        credits: profileData.credits || 0,
        headline: profileData.headline || '',
        location: profileData.current_location || profileData.location || ''
      }
    : user
    ? {
        name: user.full_name || user.name || 'User',
        email: user.email,
        avatar: user.avatar_url || user.avatar || null,
        credits: user.credits || 0
      }
    : {
        name: 'User',
        email: '',
        avatar: null,
        credits: 0
      };

  const getInitials = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'J';
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-16">
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center justify-center border-b border-gray-200" style={{ height: '65px' }}>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="h-full w-full flex items-center justify-center focus:outline-none"
            aria-label={t('sidebar.dashboard')}
            title={t('sidebar.dashboard')}
          >
            <img 
              src={iconmarkLogo} 
              alt="Velai" 
              className="h-6 w-6 cursor-pointer"
            />
          </button>
        </div>
        {/* Navigation */}
        <nav className="mt-4 flex-1 px-2 space-y-2">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || 
              (item.href !== '/dashboard' && currentPath.startsWith(item.href));
            return (
              <Tippy content={item.name} placement="right" key={item.name} delay={[0, 0]}>
                <button
                  onClick={() => item.onClick ? item.onClick() : item.navigate(item.href)}
                  className={`group flex items-center justify-center w-12 h-12 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive ? '' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${
                      isActive ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900'
                    }`}
                  />
                </button>
              </Tippy>
            );
          })}
        </nav>
      </div>
      
      {/* Language Switcher */}
      <div className="flex-shrink-0 p-2">
        <LanguageSwitcher />
      </div>

      {/* Profile Button */}
      <div className="flex-shrink-0 border-t border-gray-200 p-2 relative" ref={profileRef}>
        <Tippy content={t('sidebar.profile')} placement="right" delay={[0, 0]} disabled={isProfileOpen}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="group flex items-center justify-center w-12 h-12 text-sm font-medium rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 relative"
          >
            {userData.avatar ? (
              <img
                src={getProfileImageUrl(userData.avatar)}
                alt={userData.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {getInitials(userData.name)}
              </div>
            )}
          </button>
        </Tippy>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div className="absolute bottom-16 left-16 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* User Info Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                {userData.avatar ? (
                  <img
                    src={getProfileImageUrl(userData.avatar)}
                    alt={userData.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white text-lg font-medium">
                    {getInitials(userData.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">{userData.name}</p>
                  <p className="text-sm text-gray-600 truncate">
                    {userData.headline || userData.email || t('sidebar.completeProfile')}
                  </p>
                  {userData.location && (
                    <p className="text-xs text-gray-500 truncate">{userData.location}</p>
                  )}
                </div>

              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {profileMenuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                >
                  <item.icon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                  <span className="text-gray-700 group-hover:text-gray-900">{item.label}</span>
                  {item.external && (
                    <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                  )}
                </button>
              ))}
              
              {/* Sign Out */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 transition-colors group"
                >
                  <LogOut className="h-5 w-5 text-red-500" />
                  <span className="text-red-600 font-medium">{t('nav.signOut')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
