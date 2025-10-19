import React, { useState } from 'react';
import { User, FileText, Settings } from 'lucide-react';
import Button from '../../components/common/Button';
import { ProfileSection, PersonalInfoSection, SkillsSection, LanguageSection, PreferencesSection, ExperienceLevelSection } from '../../components/candidate/ProfileSection';
import DocumentLibrary from '../../components/candidate/DocumentLibrary';
import { useAuth } from '../../hooks/common';
import { useTheme } from '../../contexts/ThemeContext';
import { useJobSeekerProfile } from '../../hooks/candidate/useJobSeekerProfile';

const ProfilePage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('personal');
  const {
    profile,
    basicProfile,
    isLoading,
    error,
    saving,
    hasUnsavedChanges,
    isUpdatingBasicProfile,
    updateBasicProfile,
    uploadProfilePhoto,
    saveProfile,
    updateProfile,
    addSkill,
    removeSkill,
    addLanguage,
    removeLanguage,
    addLocation,
    removeLocation,
    addJobType,
    removeJobType,
    addCulturalValue,
    removeCulturalValue
  } = useJobSeekerProfile(user?.id);
  const [documents, setDocuments] = useState([
    {
      id: '1',
      name: 'Resume_2024.pdf',
      type: 'resume',
      size: 245760,
      uploadDate: '2024-01-15',
    },
    {
      id: '2',
      name: 'Cover_Letter_TechCorp.pdf',
      type: 'cover_letter',
      size: 156432,
      uploadDate: '2024-01-16',
    },
  ]);

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  const handleUpdatePersonalInfo = async (data) => {
    // Separate basic profile fields from job seeker profile fields
    const basicProfileFields = {
      full_name: data.full_name,
      phone: data.phone,
    };
    
    const jobSeekerFields = {
      headline: data.headline,
      current_location: data.current_location,
      summary: data.summary,
    };
    
    // Update basic profile immediately in profiles table
    if (basicProfileFields.full_name || basicProfileFields.phone) {
      await updateBasicProfile(basicProfileFields);
    }

    // Update job seeker profile and persist immediately
    if (jobSeekerFields.headline || jobSeekerFields.current_location || jobSeekerFields.summary) {
      updateProfile(jobSeekerFields);
      await saveProfile();
    }
  };

  const handleUpdateSkills = (skills) => {
    updateProfile({ skills });
  };

  const handleUpdateLanguages = (languages) => {
    updateProfile({ languages });
  };

  const handleUpdatePreferences = async (preferences) => {
    updateProfile(preferences);
    await saveProfile();
  };

  const handleUpdateExperience = async (experienceYears) => {
    updateProfile({ experience_years: experienceYears });
    await saveProfile();
  };

  const handleUploadDocument = (file) => {
    const newDocument = {
      id: Date.now().toString(),
      name: file.name,
      type: 'other',
      size: file.size,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    setDocuments(prev => [...prev, newDocument]);
  };

  const handleDeleteDocument = (document) => {
    setDocuments(prev => prev.filter(doc => doc.id !== document.id));
  };

  const handleViewDocument = (document) => {
    console.log('View document:', document);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            <ProfileSection title="Personal Information" onEdit={handleUpdatePersonalInfo}>
              {({ isEditing, setIsEditing }) => (
                <PersonalInfoSection 
                  user={{ 
                    ...basicProfile, 
                    headline: profile?.headline, 
                    current_location: profile?.current_location, 
                    summary: (profile?.summary ?? profile?.ai_generated_summary), 
                    email: user?.email,
                    email_verified: basicProfile?.email_verified || user?.is_email_verified,
                    phone_verified: basicProfile?.phone_verified
                  }} 
                  onUpdate={handleUpdatePersonalInfo}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              )}
            </ProfileSection>
            
            <ProfileSection title="Skills & Expertise" onEdit={handleUpdateSkills}>
              {({ isEditing, setIsEditing }) => (
                <SkillsSection 
                  skills={profile?.skills || []} 
                  onUpdate={handleUpdateSkills}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              )}
            </ProfileSection>

            <ProfileSection title="Languages" onEdit={handleUpdateLanguages}>
              {({ isEditing, setIsEditing }) => (
                <LanguageSection 
                  languages={profile?.languages || []} 
                  onUpdate={handleUpdateLanguages}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              )}
            </ProfileSection>
          </div>
        );
      
      case 'documents':
        return (
          <DocumentLibrary
            documents={documents}
            onUpload={handleUploadDocument}
            onDelete={handleDeleteDocument}
            onView={handleViewDocument}
          />
        );
      
      case 'preferences':
        return (
          <div className="space-y-6">
            <ProfileSection title="Job Preferences" onEdit={handleUpdatePreferences}>
              {({ isEditing, setIsEditing }) => (
                <PreferencesSection 
                  preferences={profile} 
                  onUpdate={handleUpdatePreferences}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              )}
            </ProfileSection>
            
            <ProfileSection title="Notification Preferences">
              <div className="space-y-3">
                {[
                  'Email notifications for new job matches',
                  'SMS alerts for interview invitations',
                  'Weekly job recommendation digest',
                  'Application status updates',
                  'Company messages and updates',
                ].map((pref, index) => (
                  <label key={index} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      defaultChecked={index < 3}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{pref}</span>
                  </label>
                ))}
              </div>
            </ProfileSection>
          </div>
        );
      

      
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
          <p className="text-gray-600 mt-1">Manage your profile information and preferences</p>
        </div>

      </div>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          {basicProfile?.avatar_url ? (
            <img 
              src={basicProfile.avatar_url} 
              alt={basicProfile?.full_name || 'Profile'} 
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {basicProfile?.full_name?.charAt(0)?.toUpperCase() || 'J'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{basicProfile?.full_name || 'Job Seeker'}</h2>
            <p className="text-gray-600">{profile?.headline || basicProfile?.email || 'Complete your profile'}</p>
            <p className="text-sm text-gray-500">{profile?.current_location || basicProfile?.phone || ''}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>

      {/* Save Changes Button */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4">
          <Button
            variant="primary"
            onClick={saveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
