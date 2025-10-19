import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building, Users, Settings, Shield, Download, Save, Edit3, Camera, Globe, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import ImageCropper from '../../components/common/ImageCropper';
import { useAuth } from '../../hooks/common';
import { useEmployerProfile } from '../../hooks/employer';
import { useToast } from '../../hooks/common';
import { getProfileImageUrl } from '../../utils/imageUtils';

const EmployerSettingsPage = () => {
  const { t } = useTranslation('employer');
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('personal');
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imageCacheBuster, setImageCacheBuster] = useState(Date.now());
  
  const {
    profile,
    basicProfile,
    company,
    isLoading,
    error,
    saving,
    hasUnsavedChanges,
    isUpdatingBasicProfile,
    updateBasicProfile,
    uploadProfilePhoto,
    updateLocalProfile,
    updateLocalCompany,
    saveProfile
  } = useEmployerProfile(user?.id);

  const tabs = [
    { id: 'personal', label: t('settingsPage.tabs.personal'), icon: User },
    { id: 'company', label: t('settingsPage.tabs.company'), icon: Building },
    { id: 'team', label: t('settingsPage.tabs.team'), icon: Users },
  ];

  const industryOptions = [
    { value: 'technology', label: t('settingsPage.industryOptions.technology') },
    { value: 'healthcare', label: t('settingsPage.industryOptions.healthcare') },
    { value: 'finance', label: t('settingsPage.industryOptions.finance') },
    { value: 'education', label: t('settingsPage.industryOptions.education') },
    { value: 'manufacturing', label: t('settingsPage.industryOptions.manufacturing') },
    { value: 'retail', label: t('settingsPage.industryOptions.retail') },
    { value: 'consulting', label: t('settingsPage.industryOptions.consulting') },
    { value: 'media', label: t('settingsPage.industryOptions.media') },
    { value: 'other', label: t('settingsPage.industryOptions.other') }
  ];

  const companySizeOptions = [
    { value: '1-10', label: t('settingsPage.companySizeOptions.s1_10') },
    { value: '11-50', label: t('settingsPage.companySizeOptions.s11_50') },
    { value: '51-200', label: t('settingsPage.companySizeOptions.s51_200') },
    { value: '201-500', label: t('settingsPage.companySizeOptions.s201_500') },
    { value: '501-1000', label: t('settingsPage.companySizeOptions.s501_1000') },
    { value: '1000+', label: t('settingsPage.companySizeOptions.s1000plus') }
  ];

  const handleSaveChanges = async () => {
    try {
      await saveProfile();
      toast.success(t('settingsPage.toasts.saveSuccess'));
    } catch (err) {
      toast.error(t('settingsPage.toasts.saveError'));
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImageFile(file);
      setShowImageCropper(true);
    }
  };

  const handleCropComplete = async (croppedFile) => {
    try {
      console.log('Uploading cropped file:', croppedFile);
      await uploadProfilePhoto(croppedFile);
      toast.success(t('settingsPage.toasts.photoUpdateSuccess'));
      setShowImageCropper(false);
      setSelectedImageFile(null);
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      toast.error(t('settingsPage.toasts.photoUpdateError'));
    }
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    setSelectedImageFile(null);
  };

  const handleBasicProfileUpdate = async (field, value) => {
    try {
      await updateBasicProfile({ [field]: value });
      toast.success(t('settingsPage.toasts.profileUpdateSuccess'));
    } catch (err) {
      toast.error(t('settingsPage.toasts.profileUpdateError'));
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            {/* Profile Photo Section */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settingsPage.personalInfo.profilePhoto')}</h3>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {basicProfile?.avatar_url ? (
                    <img
                      src={getProfileImageUrl(basicProfile.avatar_url)}
                      alt={basicProfile?.full_name || 'Profile'}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {basicProfile?.full_name?.charAt(0)?.toUpperCase() || 'E'}
                      </span>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 border">
                    <Camera className="w-4 h-4 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUpdatingBasicProfile}
                    />
                  </label>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{basicProfile?.full_name || 'Employer'}</h4>
                  <p className="text-gray-600">{basicProfile?.email || user?.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {profile?.position || t('settingsPage.personalInfo.positionNotSet')} • {company?.name || t('settingsPage.personalInfo.companyNotSet')}
                  </p>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settingsPage.personalInfo.title')}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label={t('settingsPage.personalInfo.fullName')}
                  value={basicProfile?.full_name || ''}
                  onChange={(e) => handleBasicProfileUpdate('full_name', e.target.value)}
                  disabled={isUpdatingBasicProfile}
                />
                <div className="md:col-span-2">
                  <Input
                    label={t('settingsPage.personalInfo.email')}
                    value={basicProfile?.email || user?.email || ''}
                    disabled
                    hint={t('settingsPage.personalInfo.emailHelper')}
                  />
                </div>
              </div>
            </Card>

            {/* Professional Details */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settingsPage.professionalDetails.title')}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label={t('settingsPage.professionalDetails.positionLabel')}
                  value={profile?.position || ''}
                  onChange={(e) => updateLocalProfile({ position: e.target.value })}
                  placeholder={t('settingsPage.professionalDetails.positionPlaceholder')}
                />
                <Input
                  label={t('settingsPage.professionalDetails.departmentLabel')}
                  value={profile?.department || ''}
                  onChange={(e) => updateLocalProfile({ department: e.target.value })}
                  placeholder={t('settingsPage.professionalDetails.departmentPlaceholder')}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settingsPage.professionalDetails.managementStyleLabel')}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    rows={3}
                    value={profile?.management_style?.style || ''}
                    onChange={(e) => updateLocalProfile({ 
                      management_style: { 
                        ...profile?.management_style, 
                        style: e.target.value 
                      } 
                    })}
                    placeholder={t('settingsPage.professionalDetails.managementStylePlaceholder')}
                  />
                </div>
              </div>
            </Card>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6">
            {/* Company Basic Info */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settingsPage.companyInfo.title')}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label={t('settingsPage.companyInfo.nameLabel')}
                  value={company?.name || ''}
                  onChange={(e) => updateLocalCompany({ name: e.target.value })}
                  placeholder={t('settingsPage.companyInfo.namePlaceholder')}
                />
                <Input
                  label={t('settingsPage.companyInfo.websiteLabel')}
                  value={company?.website || ''}
                  onChange={(e) => updateLocalCompany({ website: e.target.value })}
                  placeholder={t('settingsPage.companyInfo.websitePlaceholder')}
                />
                <Select
                  label={t('settingsPage.companyInfo.industryLabel')}
                  value={company?.industry || ''}
                  onChange={(value) => updateLocalCompany({ industry: value })}
                  options={industryOptions}
                />
                <Select
                  label={t('settingsPage.companyInfo.sizeLabel')}
                  value={company?.size || ''}
                  onChange={(value) => updateLocalCompany({ size: value })}
                  options={companySizeOptions}
                />
                <Input
                  label={t('settingsPage.companyInfo.locationLabel')}
                  value={company?.headquarters_location || ''}
                  onChange={(e) => updateLocalCompany({ headquarters_location: e.target.value })}
                  placeholder={t('settingsPage.companyInfo.locationPlaceholder')}
                />
                <Input
                  label={t('settingsPage.companyInfo.foundedLabel')}
                  type="number"
                  value={company?.founded_year || ''}
                  onChange={(e) => updateLocalCompany({ founded_year: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder={t('settingsPage.companyInfo.foundedPlaceholder')}
                />
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settingsPage.companyInfo.descriptionLabel')}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  rows={4}
                  value={company?.description || ''}
                  onChange={(e) => updateLocalCompany({ description: e.target.value })}
                  placeholder={t('settingsPage.companyInfo.descriptionPlaceholder')}
                />
              </div>
            </Card>

            {/* Company Culture & Benefits */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settingsPage.hiringPreferences.title')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settingsPage.hiringPreferences.processLabel')}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    rows={3}
                    value={profile?.hiring_preferences?.interview_process || ''}
                    onChange={(e) => updateLocalProfile({
                      hiring_preferences: {
                        ...profile?.hiring_preferences,
                        interview_process: e.target.value
                      }
                    })}
                    placeholder={t('settingsPage.hiringPreferences.processPlaceholder')}
                  />
                </div>
                <Input
                  label={t('settingsPage.hiringPreferences.salaryLabel')}
                  type="number"
                  value={company?.average_salary || ''}
                  onChange={(e) => updateLocalCompany({ average_salary: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="50000"
                  hint={t('settingsPage.hiringPreferences.salaryHelper')}
                />
              </div>
            </Card>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settingsPage.teamManagement.title')}</h3>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">{t('settingsPage.teamManagement.comingSoon')}</h4>
                <p className="text-gray-600">
                  {t('settingsPage.teamManagement.description')}
                </p>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('settingsPage.error.title')}</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              {t('settingsPage.error.tryAgain')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('settingsPage.header.title')}</h1>
          <p className="text-gray-600 mt-1">{t('settingsPage.header.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Button 
              variant="primary" 
              onClick={handleSaveChanges}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? t('settingsPage.header.saving') : t('settingsPage.header.saveChanges')}
            </Button>
          )}
        </div>
      </div>

      {/* Settings Header Card */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          {basicProfile?.avatar_url ? (
            <img 
              src={getProfileImageUrl(basicProfile.avatar_url)} 
              alt={basicProfile?.full_name || 'Profile'} 
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {basicProfile?.full_name?.charAt(0)?.toUpperCase() || 'E'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{basicProfile?.full_name || 'Employer'}</h2>
            <p className="text-gray-600">{profile?.position || t('settingsPage.personalInfo.positionNotSet')}</p>
            <p className="text-sm text-gray-500">{company?.name || t('settingsPage.personalInfo.companyNotSet')}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">{t('settingsPage.header.accountStatus')}</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">{t('settingsPage.header.active')}</span>
            </div>
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
                  ? 'border-violet-500 text-violet-600'
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-amber-100 border border-amber-300 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Edit3 className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">{t('settingsPage.unsavedChanges.title')}</p>
              <p className="text-sm text-amber-700">{t('settingsPage.unsavedChanges.subtitle')}</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? t('settingsPage.header.saving') : t('settingsPage.unsavedChanges.saveNow')}
            </Button>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showImageCropper && selectedImageFile && (
        <ImageCropper
          imageFile={selectedImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          minWidth={100}
          minHeight={100}
          maxWidth={800}
          maxHeight={800}
        />
      )}
    </div>
  );
};

export default EmployerSettingsPage; 