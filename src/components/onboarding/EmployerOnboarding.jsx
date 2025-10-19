import React, { useState } from 'react';
import { useAuth } from '../../hooks/common';
import { useEmployerOnboarding } from '../../hooks/employer';
import { useToast } from '../../hooks/common';
import useEmailNotifications from '../../hooks/common/useEmailNotifications';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import EmployerOnboardingChat from './EmployerOnboardingChat';
import { 
  Building2, 
  Users, 
  MapPin, 
  Globe, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  Heart,
  Zap,
  Target,
  Handshake,
  TrendingUp,
  Star,
  Check,
  X,
  Send,
  Monitor,
  CreditCard,
  ShoppingBag,
  Truck,
  Stethoscope,
  Factory,
  BarChart3,
  Car,
  Briefcase,
  Search,
  Bot,
  Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployerOnboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { sendOnboardingCompletedNotification } = useEmailNotifications();
  const { 
    loading, 
    error, 
    completeEmployerOnboarding, 
    validateOnboardingData,
    clearError 
  } = useEmployerOnboarding();
  
  // New state for chat vs form mode
  const [onboardingMode, setOnboardingMode] = useState('chat'); // 'chat' | 'form' | 'review'
  const [chatDataExtracted, setChatDataExtracted] = useState(false);
  const [extractedData, setExtractedData] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    location: '',
    website: '',
    description: '',
    foundedYear: '',
    workLifeBalance: '',
    innovation: '',
    collaboration: '',
    flexibility: '',
    growth: '',
    diversity: '',
    dataProtection: false,
    equalOpportunity: false,
    workPermits: false,
    salaryTransparency: false,
    healthSafety: false,
    position: '',
    department: '',
    managementStyle: '',
    hiringPreferences: '',
  });

  const totalSteps = 6; // Updated from 7 since we removed one step

  const germanCities = [
    'Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt am Main',
    'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen',
    'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg',
    'Bochum', 'Wuppertal', 'Bonn', 'Bielefeld', 'Mannheim',
    'Karlsruhe', 'Münster', 'Wiesbaden', 'Augsburg', 'Aachen',
    'Mönchengladbach', 'Gelsenkirchen', 'Braunschweig', 'Chemnitz',
    'Kiel', 'Krefeld', 'Halle', 'Magdeburg', 'Freiburg im Breisgau',
    'Oberhausen', 'Lübeck', 'Erfurt', 'Rostock', 'Mainz',
    'Kassel', 'Hagen', 'Potsdam', 'Saarbrücken', 'Hamm'
  ];

  const filteredCities = germanCities.filter(city =>
    city.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const handleNumberInput = (field, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    handleInputChange(field, numericValue);
  };

  const handleLocationSelect = (city) => {
    handleInputChange('location', city);
    setLocationSearch(city);
    setShowLocationDropdown(false);
  };

  const handleLocationInputChange = (value) => {
    setLocationSearch(value);
    setShowLocationDropdown(true);
    // Also update the form data when typing
    handleInputChange('location', value);
  };

  const industryOptions = [
    { value: 'technology', label: 'Technology & Software', icon: Monitor },
    { value: 'finance', label: 'Finance & Banking', icon: CreditCard },
    { value: 'healthcare', label: 'Healthcare', icon: Stethoscope },
    { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
    { value: 'consulting', label: 'Consulting', icon: BarChart3 },
    { value: 'automotive', label: 'Automotive', icon: Car },
    { value: 'retail', label: 'Retail & E-commerce', icon: ShoppingBag },
    { value: 'logistics', label: 'Logistics', icon: Truck },
  ];

  const companySizeOptions = [
    { value: '1-10', label: 'Startup', description: '1-10 employees' },
    { value: '11-50', label: 'Small', description: '11-50 employees' },
    { value: '51-200', label: 'Medium', description: '51-200 employees' },
    { value: '201-1000', label: 'Large', description: '201-1000 employees' },
    { value: '1000+', label: 'Enterprise', description: '1000+ employees' },
  ];

  const cultureValues = [
    { key: 'workLifeBalance', label: 'Work-Life Balance', icon: Heart },
    { key: 'innovation', label: 'Innovation', icon: Zap },
    { key: 'collaboration', label: 'Collaboration', icon: Handshake },
    { key: 'flexibility', label: 'Flexibility', icon: Target },
    { key: 'growth', label: 'Growth', icon: TrendingUp },
    { key: 'diversity', label: 'Diversity', icon: Star },
  ];

  const validateCurrentStep = () => {
    const errors = [];
    switch (currentStep) {
      case 1:
        if (!formData.companyName?.trim()) {
          errors.push('Company name is required');
        }
        if (!formData.industry) {
          errors.push('Please select an industry');
        }
        break;
      case 2:
        if (!formData.companySize) {
          errors.push('Please select company size');
        }
        break;
      case 3:
        if (!formData.location?.trim()) {
          errors.push('Location is required');
        }
        break;
      case 4:
        // Logo and description are optional
        break;
      case 5:
        if (!formData.position?.trim()) {
          errors.push('Your position is required');
        }
        if (!formData.department?.trim()) {
          errors.push('Department is required');
        }
        break;
    }
    return errors;
  };

  const handleNext = async () => {
    clearError();
    setValidationErrors([]);
    
    const currentStepErrors = validateCurrentStep();
    

    
    if (currentStepErrors.length > 0) {
      // Show toast for each error with a slight delay between them
      currentStepErrors.forEach((error, index) => {
        setTimeout(() => {
          toast.error(error);
        }, index * 100); // Small delay between multiple toasts
      });
      return;
    }

    if (currentStep < totalSteps) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      handleCompleteSetup();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  // Handle data extracted from AI chat
  const handleChatDataExtracted = (aiExtractedData, action = 'showArtifacts', messages = []) => {
    console.log('=== AI Data Extraction Debug ===');
    console.log('Raw extracted data:', aiExtractedData);
    console.log('Action:', action);
    console.log('Chat messages:', messages);
    
    // Store the extracted data and chat history
    setExtractedData(aiExtractedData);
    setChatHistory(messages);
    setChatDataExtracted(true);
    
    if (action === 'submit') {
      console.log('🚀 DIRECT SUBMISSION from chat button');
      // Direct submission - complete onboarding immediately
      handleCompleteWithAIData(aiExtractedData);
    } else {
      // Show artifacts review panel
      setOnboardingMode('review');
      toast.success('✨ Perfect! I\'ve gathered your information. Please review and confirm.');
    }
  };

  // Handle skipping the AI chat - preserve any extracted data
  const handleSkipChat = (skipExtractedData = {}, messages = []) => {
    // Store chat history
    setChatHistory(messages);
    
    // If there's any extracted data from the conversation, use it
    if (skipExtractedData && Object.keys(skipExtractedData).length > 0) {
      const mappedData = {
        // Start with existing form data
        ...formData,
        // Override with extracted data (only if extracted data has actual values)
        ...(skipExtractedData.companyName && { companyName: skipExtractedData.companyName }),
        ...(skipExtractedData.industry && { industry: skipExtractedData.industry }),
        ...(skipExtractedData.companySize && { companySize: skipExtractedData.companySize }),
        ...(skipExtractedData.location && { location: skipExtractedData.location }),
        ...(skipExtractedData.website && { website: skipExtractedData.website }),
        ...(skipExtractedData.description && { description: skipExtractedData.description }),
        ...(skipExtractedData.foundedYear && { foundedYear: skipExtractedData.foundedYear }),
        ...(skipExtractedData.position && { position: skipExtractedData.position }),
        ...(skipExtractedData.department && { department: skipExtractedData.department }),
        ...(skipExtractedData.managementStyle && { managementStyle: skipExtractedData.managementStyle }),
        ...(skipExtractedData.hiringPreferences && { hiringPreferences: skipExtractedData.hiringPreferences }),
      };
      
      setFormData(mappedData);
      setLocationSearch(skipExtractedData.location || '');
      setChatDataExtracted(true);
      
      if (Object.keys(skipExtractedData).length > 0) {
        toast.success('💡 Great! I\'ve saved the information from our conversation.');
      }
    } else {
      setChatDataExtracted(false);
    }
    
    setOnboardingMode('form');
  };

  // Handle completing onboarding directly with AI data
  const handleCompleteWithAIData = async (dataToUse = null) => {
    console.log('🔥 handleCompleteWithAIData called');
    console.log('dataToUse param:', dataToUse);
    console.log('extractedData state:', extractedData);
    
    try {
      if (!user || !user.id) {
        toast.error('User information is not available. Please try refreshing the page.');
        return;
      }

      // Use provided data or fall back to stored extractedData
      const dataSource = dataToUse || extractedData;
      
      console.log('=== AI Data Completion Debug ===');
      console.log('Raw extracted data:', dataSource);
      console.log('Current form data:', formData);

      // Map extracted data to form data structure
      const aiFormData = {
        ...formData,
        ...(dataSource.companyName && { companyName: dataSource.companyName }),
        ...(dataSource.industry && { industry: dataSource.industry }),
        ...(dataSource.companySize && { companySize: dataSource.companySize }),
        ...(dataSource.location && { location: dataSource.location }),
        ...(dataSource.website && { website: dataSource.website }),
        ...(dataSource.description && { description: dataSource.description }),
        ...(dataSource.foundedYear && { foundedYear: dataSource.foundedYear }),
        ...(dataSource.position && { position: dataSource.position }),
        ...(dataSource.department && { department: dataSource.department }),
        ...(dataSource.managementStyle && { managementStyle: dataSource.managementStyle }),
        ...(dataSource.hiringPreferences && { hiringPreferences: dataSource.hiringPreferences }),
      };
      
      console.log('Final mapped form data:', aiFormData);
      
      toast.custom('Setting up your profile with AI data...', {
        icon: '⏳',
        duration: 2000,
      });
      
      await completeEmployerOnboarding(aiFormData, user);
      updateUser({ onboarding_complete: true });
      
      toast.success('🎉 Setup completed successfully! Welcome to Velai.');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      console.error('Error completing onboarding with AI data:', err);
      toast.error('Something went wrong. Please try again.');
    }
  };

  // Handle editing the AI data manually
  const handleEditManually = () => {
    // Map AI data to form data and switch to manual mode
    const mappedData = {
      ...formData,
      ...(extractedData.companyName && { companyName: extractedData.companyName }),
      ...(extractedData.industry && { industry: extractedData.industry }),
      ...(extractedData.companySize && { companySize: extractedData.companySize }),
      ...(extractedData.location && { location: extractedData.location }),
      ...(extractedData.website && { website: extractedData.website }),
      ...(extractedData.description && { description: extractedData.description }),
      ...(extractedData.foundedYear && { foundedYear: extractedData.foundedYear }),
      ...(extractedData.position && { position: extractedData.position }),
      ...(extractedData.department && { department: extractedData.department }),
      ...(extractedData.managementStyle && { managementStyle: extractedData.managementStyle }),
      ...(extractedData.hiringPreferences && { hiringPreferences: extractedData.hiringPreferences }),
    };
    
    setFormData(mappedData);
    setLocationSearch(extractedData.location || '');
    setChatDataExtracted(true);
    setOnboardingMode('form');
    
    toast.success('✏️ Ready to edit! Your AI-gathered data has been pre-filled.');
  };

  const handleCompleteSetup = async () => {
    try {
      if (!user || !user.id) {
        toast.error('User information is not available. Please try refreshing the page.');
        return;
      }
      
      toast.custom('Setting up your profile...', {
        icon: '⏳',
        duration: 2000,
      });
      
      await completeEmployerOnboarding(formData, user);
      updateUser({ onboarding_complete: true });
      
      // Send onboarding completion notification email
      try {
        await sendOnboardingCompletedNotification({
          to: user.email,
          fullName: user.full_name || user.user_metadata?.full_name || 'User',
          accountType: 'employer',
          companyName: formData.companyName,
          dashboardUrl: `${window.location.origin}/dashboard`
        });
        console.log('Employer onboarding completion notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send employer onboarding completion notification email:', emailError);
        // Don't fail the onboarding completion if email fails
        // Just log the error silently
      }
      
      toast.success('Setup completed successfully! Welcome to Velai.');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      console.error('Error completing onboarding:', err);
      toast.error('Something went wrong. Please try again.');
    }
  };

  // Step 1: Company Name & Industry
  const renderStep1 = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tell us about your company</h1>
        <p className="text-gray-600">What's your company name and what industry are you in?</p>
      </div>

      <div className="space-y-6">
        <Input
          label="Company name"
          value={formData.companyName}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
          placeholder="Enter your company name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Industry</label>
          <div className="grid grid-cols-2 gap-3">
            {industryOptions.map((industry) => {
              const IconComponent = industry.icon;
              return (
                <button
                  key={industry.value}
                  onClick={() => handleInputChange('industry', industry.value)}
                  className={`p-3 border rounded-xl text-left transition-colors hover:border-gray-400 ${
                    formData.industry === industry.value
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5 text-gray-600 mb-2" />
                  <div className="text-sm font-medium text-gray-900">{industry.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Company Size
  const renderStep2 = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">How big is your company?</h1>
        <p className="text-gray-600">This helps us understand your hiring needs and scale.</p>
      </div>

      <div className="space-y-3">
        {companySizeOptions.map((size) => (
          <button
            key={size.value}
            onClick={() => handleInputChange('companySize', size.value)}
            className={`w-full p-4 border rounded-xl text-left transition-colors hover:border-gray-400 ${
              formData.companySize === size.value
                ? 'border-violet-500 bg-violet-50'
                : 'border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">{size.label}</div>
            <div className="text-sm text-gray-500">{size.description}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 3: Company Details
  const renderStep3 = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Company details</h1>
        <p className="text-gray-600">Where are you located and some basic company info.</p>
      </div>

      <div className="space-y-4">
        {/* Location Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <div className="relative">
            <input
              type="text"
              value={locationSearch || formData.location}
              onChange={(e) => handleLocationInputChange(e.target.value)}
              onFocus={() => setShowLocationDropdown(true)}
              placeholder="Search German cities..."
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            
            {showLocationDropdown && filteredCities.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCities.slice(0, 10).map((city) => (
                  <button
                    key={city}
                    onClick={() => handleLocationSelect(city)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Input
          label="Website (optional)"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder="https://yourcompany.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />

        <Input
          label="Founded year (optional)"
          value={formData.foundedYear}
          onChange={(e) => handleNumberInput('foundedYear', e.target.value)}
          placeholder="2015"
          maxLength={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  // Step 4: Company Description
  const renderStep4 = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tell us more</h1>
        <p className="text-gray-600">Describe your company to help candidates understand what you do.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company description (optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Brief description of what your company does and what makes it special..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-2">
          This helps candidates understand your company culture and what makes you unique.
        </p>
      </div>
    </div>
  );

  // Step 5: Your Profile
  const renderStep5 = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tell us about yourself</h1>
        <p className="text-gray-600">Help candidates understand who they'll be working with.</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Your position"
          value={formData.position}
          onChange={(e) => handleInputChange('position', e.target.value)}
          placeholder="e.g., Head of HR, CEO, Talent Lead"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />

        <Input
          label="Department"
          value={formData.department}
          onChange={(e) => handleInputChange('department', e.target.value)}
          placeholder="e.g., Human Resources, Operations"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />

        <Input
          label="Management style (optional)"
          value={formData.managementStyle}
          onChange={(e) => handleInputChange('managementStyle', e.target.value)}
          placeholder="e.g., Collaborative, Supportive"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />

        <Input
          label="What you look for in candidates (optional)"
          value={formData.hiringPreferences}
          onChange={(e) => handleInputChange('hiringPreferences', e.target.value)}
          placeholder="e.g., Cultural fit, Growth mindset"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Compliance (optional)</h3>
          <div className="space-y-3">
            {[
              { key: 'workPermits', label: 'Can sponsor work permits' },
              { key: 'salaryTransparency', label: 'Transparent about salaries' },
              { key: 'equalOpportunity', label: 'Equal opportunity employer' },
            ].map((item) => (
              <label key={item.key} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[item.key]}
                  onChange={(e) => handleInputChange(item.key, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Step 6: Review
  const renderStep6 = () => (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">You're all set!</h1>
        <p className="text-gray-600">Review your information and complete your setup.</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Company</h3>
            <p className="text-gray-600">{formData.companyName}</p>
            <p className="text-sm text-gray-500">{industryOptions.find(o => o.value === formData.industry)?.label} • {companySizeOptions.find(o => o.value === formData.companySize)?.label}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Your role</h3>
            <p className="text-gray-600">{formData.position}</p>
            <p className="text-sm text-gray-500">{formData.department}</p>
          </div>

          {cultureValues.filter(v => formData[v.key]).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Culture values</h3>
              <div className="flex flex-wrap gap-2">
                {cultureValues.filter(v => formData[v.key]).map((value) => (
                  <span key={value.key} className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                    {value.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        onClick={handleCompleteSetup}
        loading={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 px-4 rounded-full font-medium flex items-center justify-center"
      >
        <Send className="w-4 h-4 mr-2" />
        Complete setup
      </Button>
    </div>
  );

  // Click outside handler for location dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render AI Review Panel - Claude Artifacts style
  const renderAIReviewPanel = () => {
    console.log('🎨 Rendering AI Review Panel');
    console.log('extractedData in review panel:', extractedData);
    console.log('Number of extracted data keys:', Object.keys(extractedData).length);
    
    const getIndustryLabel = (value) => {
      const option = industryOptions.find(o => o.value === value);
      return option ? option.label : value;
    };

    const getCompanySizeLabel = (value) => {
      const option = companySizeOptions.find(o => o.value === value);
      return option ? option.description : value;
    };

    return (
      <div className="h-screen bg-gray-50 flex">
        {/* Left Panel - AI Chat */}
        <div className="w-1/2 bg-white border-r border-gray-200">
          <EmployerOnboardingChat 
            onDataExtracted={handleChatDataExtracted}
            onSkip={handleSkipChat}
            hideActions={true}
            existingMessages={chatHistory}
            readonly={true}
          />
        </div>

        {/* Right Panel - Data Review (Artifacts-style) */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Profile Summary</h2>
                  <p className="text-gray-600 mt-1">Review your information collected by AI</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">V</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">AI Generated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-violet-600" />
                Company Information
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                {extractedData.companyName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <p className="text-gray-900 font-medium">{extractedData.companyName}</p>
                  </div>
                )}
                
                {extractedData.industry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <p className="text-gray-900">{getIndustryLabel(extractedData.industry)}</p>
                  </div>
                )}
                
                {extractedData.companySize && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <p className="text-gray-900">{getCompanySizeLabel(extractedData.companySize)}</p>
                  </div>
                )}
                
                {extractedData.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      {extractedData.location}
                    </p>
                  </div>
                )}
                
                {extractedData.website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <p className="text-gray-900 flex items-center">
                      <Globe className="w-4 h-4 mr-1 text-gray-500" />
                      <a href={extractedData.website} target="_blank" rel="noopener noreferrer" 
                         className="text-violet-600 hover:text-violet-700 underline">
                        {extractedData.website}
                      </a>
                    </p>
                  </div>
                )}
                
                {extractedData.foundedYear && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Founded</label>
                    <p className="text-gray-900">{extractedData.foundedYear}</p>
                  </div>
                )}
                
                {extractedData.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900 leading-relaxed">{extractedData.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Your Profile */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-violet-600" />
                Your Profile
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                {extractedData.position && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <p className="text-gray-900 font-medium">{extractedData.position}</p>
                  </div>
                )}
                
                {extractedData.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <p className="text-gray-900">{extractedData.department}</p>
                  </div>
                )}
                
                {extractedData.managementStyle && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Management Style</label>
                    <p className="text-gray-900">{extractedData.managementStyle}</p>
                  </div>
                )}
                
                {extractedData.hiringPreferences && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hiring Preferences</label>
                    <p className="text-gray-900 leading-relaxed">{extractedData.hiringPreferences}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col space-y-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    console.log('🎯 ARTIFACTS PANEL button clicked');
                    console.log('Extracted data being passed:', extractedData);
                    handleCompleteWithAIData(extractedData);
                  }}
                  loading={loading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 px-4 rounded-full font-medium flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Setup with AI Data
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleEditManually}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-full font-medium flex items-center justify-center"
                >
                  <Edit3 className="w-5 h-5 mr-2" />
                  Edit Details Manually
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                You can complete setup directly with the AI-collected data, or edit details manually in the step-by-step form.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show chat interface first, then review panel, then form
  if (onboardingMode === 'chat') {
    return (
      <EmployerOnboardingChat 
        onDataExtracted={handleChatDataExtracted}
        onSkip={handleSkipChat}
      />
    );
  }

  // Show AI review panel when data is extracted
  if (onboardingMode === 'review') {
    return renderAIReviewPanel();
  }

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step indicator with AI badge if data was extracted */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">Velai</span>
                {chatDataExtracted && (
                  <div className="flex items-center space-x-1 bg-blue-50 border border-blue-200 rounded-full px-2 py-1">
                    <Bot className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">AI Enhanced</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Debug Information - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
              <details>
                <summary className="font-semibold text-yellow-800 cursor-pointer">Debug: Form Data</summary>
                <pre className="mt-2 text-yellow-700 overflow-auto max-h-32">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* AI Enhancement Notification */}
          {chatDataExtracted && currentStep === 1 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">AI-Enhanced Profile Setup</h3>
                  <p className="text-sm text-blue-800">
                    Great news! I've pre-filled your profile with the information from our conversation. 
                    Please review and edit any details as needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content with transition */}
          <div className={`transition-all duration-150 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}
          </div>

          {/* Navigation - Only show for steps 1-5 */}
          {currentStep < totalSteps && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 ? (
                              <Button
                variant="outline"
                onClick={handleBack}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
              >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              ) : (
                <div></div>
              )}
              
                            <Button
              variant="primary"
              onClick={handleNext}
                className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-full font-medium"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerOnboarding;
