import React, { useMemo } from 'react';
import { useCandidateOnboarding } from '../../hooks/candidate/useCandidateOnboarding';
import useEmailNotifications from '../../hooks/common/useEmailNotifications';
import Stepper from '../common/Stepper';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';
import FileUpload from '../common/FileUpload';
import { User, Briefcase, Upload, Settings, CheckCircle, Lock, Plus, X } from 'lucide-react';

// Currency mapping for countries
const countryCurrencyMap = {
  usa: { symbol: '$', code: 'USD' },
  uk: { symbol: '£', code: 'GBP' },
  canada: { symbol: 'C$', code: 'CAD' },
  australia: { symbol: 'A$', code: 'AUD' },
  germany: { symbol: '€', code: 'EUR' },
  france: { symbol: '€', code: 'EUR' },
  spain: { symbol: '€', code: 'EUR' },
  italy: { symbol: '€', code: 'EUR' },
  netherlands: { symbol: '€', code: 'EUR' },
  sweden: { symbol: 'kr', code: 'SEK' },
  norway: { symbol: 'kr', code: 'NOK' },
  denmark: { symbol: 'kr', code: 'DKK' },
  finland: { symbol: '€', code: 'EUR' },
  ireland: { symbol: '€', code: 'EUR' },
  switzerland: { symbol: 'CHF', code: 'CHF' },
  austria: { symbol: '€', code: 'EUR' },
  belgium: { symbol: '€', code: 'EUR' },
  portugal: { symbol: '€', code: 'EUR' },
  greece: { symbol: '€', code: 'EUR' },
  poland: { symbol: 'zł', code: 'PLN' },
  czech_republic: { symbol: 'Kč', code: 'CZK' },
  hungary: { symbol: 'Ft', code: 'HUF' },
  romania: { symbol: 'lei', code: 'RON' },
  bulgaria: { symbol: 'лв', code: 'BGN' },
  croatia: { symbol: '€', code: 'EUR' },
  slovakia: { symbol: '€', code: 'EUR' },
  slovenia: { symbol: '€', code: 'EUR' },
  estonia: { symbol: '€', code: 'EUR' },
  latvia: { symbol: '€', code: 'EUR' },
  lithuania: { symbol: '€', code: 'EUR' },
  india: { symbol: '₹', code: 'INR' },
  china: { symbol: '¥', code: 'CNY' },
  japan: { symbol: '¥', code: 'JPY' },
  south_korea: { symbol: '₩', code: 'KRW' },
  singapore: { symbol: 'S$', code: 'SGD' },
  malaysia: { symbol: 'RM', code: 'MYR' },
  indonesia: { symbol: 'Rp', code: 'IDR' },
  thailand: { symbol: '฿', code: 'THB' },
  vietnam: { symbol: '₫', code: 'VND' },
  philippines: { symbol: '₱', code: 'PHP' },
  brazil: { symbol: 'R$', code: 'BRL' },
  mexico: { symbol: '$', code: 'MXN' },
  argentina: { symbol: '$', code: 'ARS' },
  chile: { symbol: '$', code: 'CLP' },
  colombia: { symbol: '$', code: 'COP' },
  peru: { symbol: 'S/', code: 'PEN' },
  south_africa: { symbol: 'R', code: 'ZAR' },
  nigeria: { symbol: '₦', code: 'NGN' },
  egypt: { symbol: 'E£', code: 'EGP' },
  israel: { symbol: '₪', code: 'ILS' },
  uae: { symbol: 'د.إ', code: 'AED' },
  saudi_arabia: { symbol: '﷼', code: 'SAR' },
  qatar: { symbol: 'ر.ق', code: 'QAR' },
  new_zealand: { symbol: 'NZ$', code: 'NZD' },
  other: { symbol: '€', code: 'EUR' }, // Default to Euro
};

const CandidateOnboarding = () => {
  // Currency mapping for different countries
  const countryCurrencyMap = useMemo(() => ({
    'United States': { symbol: '$', code: 'USD' },
    'United Kingdom': { symbol: '£', code: 'GBP' },
    'Germany': { symbol: '€', code: 'EUR' },
    'France': { symbol: '€', code: 'EUR' },
    'Spain': { symbol: '€', code: 'EUR' },
    'Italy': { symbol: '€', code: 'EUR' },
    'Canada': { symbol: 'C$', code: 'CAD' },
    'Australia': { symbol: 'A$', code: 'AUD' },
    'Japan': { symbol: '¥', code: 'JPY' },
    'China': { symbol: '¥', code: 'CNY' },
    'India': { symbol: '₹', code: 'INR' },
    'Brazil': { symbol: 'R$', code: 'BRL' },
    'South Korea': { symbol: '₩', code: 'KRW' },
    'Russia': { symbol: '₽', code: 'RUB' },
    'Mexico': { symbol: 'Mex$', code: 'MXN' },
    'Switzerland': { symbol: 'CHF', code: 'CHF' },
    'Sweden': { symbol: 'kr', code: 'SEK' },
    'Singapore': { symbol: 'S$', code: 'SGD' },
    'other': { symbol: '€', code: 'EUR' }, // Default to Euro
  }), []);
  const {
    // State
    currentStep,
    formData,
    uploadedDocuments,
    steps,
    experienceOptions,
    workTypeOptions,
    availabilityOptions,
    countryOptions,
    visaStatusOptions,
    
    // Status
    loading,
    uploading,
    uploadError,
    uploadProgress,
    error,
    
    // Actions
    handleInputChange,
    handleFileUpload,
    handleNext,
    handleBack,
    
    // Validation
    canProceed,
    canComplete,
  } = useCandidateOnboarding();

  const { sendOnboardingCompletedNotification } = useEmailNotifications();

  // State for skills input
  const [newSkill, setNewSkill] = React.useState('');
  const [newLanguage, setNewLanguage] = React.useState('');
  const [newLanguageLevel, setNewLanguageLevel] = React.useState('intermediate');

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      handleInputChange('skills', [...formData.skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    handleInputChange('skills', formData.skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !formData.languages.some(lang => lang.language === newLanguage.trim())) {
      const languageObj = {
        language: newLanguage.trim(),
        proficiency: newLanguageLevel
      };
      handleInputChange('languages', [...formData.languages, languageObj]);
      setNewLanguage('');
      setNewLanguageLevel('intermediate');
    }
  };

  const handleRemoveLanguage = (languageToRemove) => {
    handleInputChange('languages', formData.languages.filter(lang => lang.language !== languageToRemove));
  };

  const handleLanguageKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLanguage();
    }
  };

  const languageLevelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'native', label: 'Native' },
  ];

  // Shared professional summary generator for live preview across steps
  const generatePreviewSummary = () => {
    const { firstName, lastName, currentTitle, experience, skills, languages, preferredLocation, workType, relocatable, visaStatus, salaryExpectation, desiredPosition } = formData;

    if (!firstName || !lastName || !currentTitle || !experience || skills.length === 0) {
      return "Complete the previous steps to see your professional summary preview.";
    }

    const experienceText = experience === '0' ? 'entry-level' :
                          experience === '1' ? '1 year' :
                          `${experience} years`;

    const languagesText = Array.isArray(languages) && languages.length > 0 ?
      languages.map(lang => `${lang.language} (${lang.proficiency})`).join(', ') :
      'English';

    const locationText = preferredLocation && preferredLocation !== 'other' ?
      `seeking opportunities in ${preferredLocation}` :
      relocatable ? 'open to relocation opportunities' :
      'preferring local opportunities';

    const workTypeText = workType ?
      workType.charAt(0).toUpperCase() + workType.slice(1).replace('-', ' ') :
      'full-time';

    const visaText = visaStatus === 'citizen' ? 'EU citizen with full work authorization' :
                     visaStatus === 'permit' ? 'work permit holder with authorization to work' :
                     visaStatus === 'student' ? 'student visa holder seeking work opportunities' :
                     visaStatus === 'applying' ? 'visa application in progress for work authorization' :
                     'actively seeking work authorization';

    const salaryText = salaryExpectation ?
      `with salary expectations of ${salaryExpectation}` :
      'with competitive salary expectations';

    const skillsText = skills.length > 0 ?
      skills.slice(0, 3).join(', ') + (skills.length > 3 ? `, and ${skills.length - 3} other skills` : '') :
      'various technical skills';

    const jobTypeText = workType ?
      workType.charAt(0).toUpperCase() + workType.slice(1).replace('-', ' ') :
      'full-time';

    const targetTitle = desiredPosition || currentTitle || 'role';
    const summary = `${firstName} ${lastName} is a ${currentTitle || 'professional'} with ${experienceText} of experience. Seeking a ${targetTitle} ${jobTypeText} position. Skilled in ${skillsText}.`;

    return summary;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600 mt-2">Tell us about yourself</p>
        <p className="text-sm text-blue-600 mt-1">
          Your email and name are pre-filled from signup
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          placeholder="Enter your first name"
        />
        
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          placeholder="Enter your last name"
        />
        
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          disabled={true}
          placeholder="your.email@example.com"
          className="bg-gray-50 cursor-not-allowed"
          hint="Pre-filled from your signup"
          icon={<Lock className="w-5 h-5" />}
        />
        
        <Input
          label="Current Location"
          value={formData.currentLocation}
          onChange={(e) => handleInputChange('currentLocation', e.target.value)}
          placeholder="City, Country"
        />
        
        <Input
          label="Date of Birth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
        />
        
        <Select
          label="Visa Status"
          options={visaStatusOptions}
          value={formData.visaStatus}
          onChange={(value) => handleInputChange('visaStatus', value)}
          placeholder="Select your visa status"
        />
      </div>
    </div>
  );

  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <Briefcase className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Professional Experience</h2>
          <p className="text-gray-600 mt-2">Share your professional background</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="Current Job Title"
            value={formData.currentTitle}
            onChange={(e) => handleInputChange('currentTitle', e.target.value)}
            placeholder="e.g., Software Developer"
          />
          <Input
            label="Desired Position"
            value={formData.desiredPosition}
            onChange={(e) => handleInputChange('desiredPosition', e.target.value)}
            placeholder="e.g., Senior Frontend Engineer"
          />
          <Select
            label="Years of Experience"
            options={experienceOptions}
            value={formData.experience}
            onChange={(value) => handleInputChange('experience', value)}
            placeholder="Select experience level"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
          <div className="space-y-3">
            {/* Skills Input */}
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a skill (e.g., React, Node.js, Python)"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
                className="px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Skills List */}
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Help Text */}
            <p className="text-sm text-gray-500">
              Add your key skills one by one. Press Enter or click the + button to add each skill.
            </p>
          </div>
        </div>

        <Input
          label="Education"
          value={formData.education}
          onChange={(e) => handleInputChange('education', e.target.value)}
          placeholder="e.g., B.Tech Computer Science"
          hint="Required"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Languages <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {/* Languages Input */}
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyPress={handleLanguageKeyPress}
                placeholder="Add a language (e.g., English, Hindi, German)"
                className="flex-1"
              />
              <Select
                value={newLanguageLevel}
                onChange={(value) => setNewLanguageLevel(value)}
                options={languageLevelOptions}
                className="w-32"
                placeholder="Level"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddLanguage}
                disabled={!newLanguage.trim()}
                className="px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Languages List */}
            {formData.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{lang.language}</span>
                    <span className="text-xs bg-green-200 px-2 py-0.5 rounded">
                      {lang.proficiency}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang.language)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Help Text */}
            <p className="text-sm text-gray-500">
              Required. Add at least one language with a proficiency level. Press Enter or click the + button to add each language.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
        <div className="text-center mb-8">
        <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
        <p className="text-gray-600 mt-2">Upload your resume and other documents</p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{uploadError}</p>
        </div>
      )}

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-blue-600 text-sm">Uploading... {uploadProgress}%</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Resume Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
          <div className="text-center">
            {!uploadedDocuments.resume ? (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Resume (Required)</h3>
                <p className="text-gray-600 mb-4">Upload your resume in PDF, DOC, or DOCX format</p>
                <FileUpload
                  accept=".pdf,.doc,.docx"
                  onFileSelect={(file) => handleFileUpload(file, 'resume')}
                  disabled={uploading}
                  className="inline-block"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Resume Uploaded</h3>
                    <p className="text-sm text-gray-600">{uploadedDocuments.resume.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleFileUpload(null, 'resume')}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cover Letter Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
          <div className="text-center">
            {!uploadedDocuments.coverLetter ? (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cover Letter (Optional)</h3>
                <p className="text-gray-600 mb-4">Upload your cover letter in PDF, DOC, or DOCX format</p>
                <FileUpload
                  accept=".pdf,.doc,.docx"
                  onFileSelect={(file) => handleFileUpload(file, 'coverLetter')}
                  disabled={uploading}
                  className="inline-block"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Cover Letter Uploaded</h3>
                    <p className="text-sm text-gray-600">{uploadedDocuments.coverLetter.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleFileUpload(null, 'coverLetter')}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
          <div className="text-center">
            {!uploadedDocuments.portfolio ? (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Portfolio/Work Samples (Optional)</h3>
                <p className="text-gray-600 mb-4">Upload your portfolio or work samples in PDF, DOC, DOCX, or ZIP format</p>
                <FileUpload
                  accept=".pdf,.doc,.docx,.zip"
                  onFileSelect={(file) => handleFileUpload(file, 'portfolio')}
                  disabled={uploading}
                  className="inline-block"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Portfolio Uploaded</h3>
                    <p className="text-sm text-gray-600">{uploadedDocuments.portfolio.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleFileUpload(null, 'portfolio')}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Uploading...</span>
            <span className="text-sm text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {!uploading && (uploadedDocuments.resume || uploadedDocuments.coverLetter || uploadedDocuments.portfolio) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">Upload Summary</h4>
          <div className="space-y-1">
            {uploadedDocuments.resume && (
              <div className="flex items-center text-sm text-green-800">
                <span>Resume</span>
                <CheckCircle className="w-4 h-4 ml-2" />
              </div>
            )}
            {uploadedDocuments.coverLetter && (
              <div className="flex items-center text-sm text-green-800">
                <span>Cover Letter</span>
                <CheckCircle className="w-4 h-4 ml-2" />
              </div>
            )}
            {uploadedDocuments.portfolio && (
              <div className="flex items-center text-sm text-green-800">
                <span>Portfolio</span>
                <CheckCircle className="w-4 h-4 ml-2" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* No preview in step 3 as requested */}
    </div>
  );

  const renderStep4 = () => {
    // Generate preview summary
    const generatePreviewSummary = () => {
      const { firstName, lastName, currentTitle, experience, skills, education, languages, preferredLocation, workType, relocatable, visaStatus, salaryExpectation } = formData;
      
      if (!firstName || !lastName || !currentTitle || !experience || skills.length === 0) {
        return "Complete the previous steps to see your professional summary preview.";
      }
      
      const experienceText = experience === '0' ? 'entry-level' : 
                            experience === '1' ? '1 year' : 
                            `${experience} years`;
      
      // Format skills section (not used in current summary)
      
      const languagesText = languages.length > 0 ? 
        languages.map(lang => `${lang.language} (${lang.proficiency})`).join(', ') : 
        'English';
      
      const locationText = preferredLocation && preferredLocation !== 'other' ? 
        `seeking opportunities in ${preferredLocation}` : 
        relocatable ? 'open to relocation opportunities' : 
        'preferring local opportunities';
      
      const workTypeText = workType ? 
        workType.charAt(0).toUpperCase() + workType.slice(1).replace('-', ' ') : 
        'full-time';
      
      const visaText = visaStatus === 'citizen' ? 'EU citizen with full work authorization' :
                       visaStatus === 'permit' ? 'work permit holder with authorization to work' :
                       visaStatus === 'student' ? 'student visa holder seeking work opportunities' :
                       visaStatus === 'applying' ? 'visa application in progress for work authorization' :
                       'actively seeking work authorization';
      
      const salaryText = salaryExpectation ? 
        `with salary expectations of ${salaryExpectation}` : 
        'with competitive salary expectations';

      // Generate concise professional summary with skills and job details
      const skillsText = skills.length > 0 ? 
        skills.slice(0, 3).join(', ') + (skills.length > 3 ? `, and ${skills.length - 3} other skills` : '') : 
        'various technical skills';
      
      const jobTypeText = workType ? 
        workType.charAt(0).toUpperCase() + workType.slice(1).replace('-', ' ') : 
        'full-time';
      
      const targetTitle = formData.desiredPosition || currentTitle || 'role';
      const summary = `${firstName} ${lastName} is a ${currentTitle || 'professional'} with ${experienceText} of experience. Seeking a ${targetTitle} ${jobTypeText} position. Skilled in ${skillsText}.`;

      return summary;
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <Settings className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Job Preferences</h2>
          <p className="text-gray-600 mt-2">Tell us what you're looking for</p>
        </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Select
          label="Preferred Location"
          options={countryOptions}
          value={formData.preferredLocation}
          onChange={(value) => handleInputChange('preferredLocation', value)}
          placeholder="Select a country"
        />
        
        {formData.preferredLocation === 'other' && (
          <Input
            label="Custom City"
            value={formData.customCity || ''}
            onChange={(e) => handleInputChange('customCity', e.target.value)}
            placeholder="Enter city name"
          />
        )}
        
        <Input
          label="Salary Expectation"
          value={formData.salaryExpectation}
          onChange={(e) => handleInputChange('salaryExpectation', e.target.value)}
          placeholder="e.g., $60,000 - $80,000"
        />
        
        <Select
          label="Work Type"
          options={workTypeOptions}
          value={formData.workType}
          onChange={(value) => handleInputChange('workType', value)}
          placeholder="Select work type"
        />
        
        <Select
          label="Availability"
          options={availabilityOptions}
          value={formData.availability}
          onChange={(value) => handleInputChange('availability', value)}
          placeholder="When can you start?"
        />
      </div>

      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={formData.relocatable}
          onChange={(e) => handleInputChange('relocatable', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          I am willing to relocate for the right opportunity
        </span>
      </label>

      {/* Professional Summary Preview */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Your Professional Summary Preview
        </h3>
        <div className="bg-white p-4 rounded-lg border border-blue-100">
          <p className="text-gray-800 leading-relaxed">
            {generatePreviewSummary()}
          </p>
        </div>
        <p className="text-sm text-blue-700 mt-3">
          This summary will be used in your profile and shared with potential employers. 
          It's automatically generated based on the information you've provided.
        </p>
      </div>
    </div>
  );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Stepper steps={steps} currentStep={currentStep} className="mb-8" />
        
        <Card padding="lg">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={uploading || loading || !canProceed}
            >
              {loading ? 'Completing...' : currentStep === 4 ? 'Complete Setup' : 'Next'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CandidateOnboarding;
