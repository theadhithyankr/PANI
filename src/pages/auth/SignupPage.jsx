import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, User, Building, CheckCircle, XCircle } from 'lucide-react';
import { useAuth, useToast } from '../../hooks/common';
import useEmailNotifications from '../../hooks/common/useEmailNotifications';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const SignupPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    userType: 'employer',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { sendAccountCreatedNotification } = useEmailNotifications();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.email) {
      toast.error(t('signupPage.emailRequired'));
      return false;
    } 
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('signupPage.invalidEmail'));
      return false;
    }
    
    if (!formData.password) {
      toast.error(t('signupPage.passwordRequired'));
      return false;
    } 
    if (formData.password.length < 8) {
      toast.error(t('signupPage.passwordTooShort'));
      return false;
    } 
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      toast.error(t('signupPage.passwordRequirements'));
      return false;
    }
    
    if (!formData.confirmPassword) {
      toast.error(t('signupPage.confirmPasswordRequired'));
      return false;
    } 
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('signupPage.passwordsDoNotMatch'));
      return false;
    }
    
    if (!formData.name || !formData.name.trim()) {
      toast.error(t(formData.userType === 'employer' ? 'signupPage.contactNameRequired' : 'signupPage.fullNameRequired'));
      return false;
    } 
    if (formData.name.trim().length < 2) {
      toast.error(t('signupPage.nameTooShort'));
      return false;
    }
    
    if (formData.userType === 'employer' && (!formData.company || !formData.company.trim())) {
      toast.error(t('signupPage.companyNameRequired'));
      return false;
    } 
    if (formData.userType === 'employer' && formData.company && formData.company.trim().length < 2) {
      toast.error(t('signupPage.companyNameTooShort'));
      return false;
    }
    
    if (!formData.agreeToTerms) {
      toast.error(t('signupPage.termsRequired'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        type: formData.userType,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        ...(formData.userType === 'employer' && { company: formData.company }),
      };
      
      await signup(userData);
      
      // Send account creation notification email
      try {
        await sendAccountCreatedNotification({
          to: formData.email,
          fullName: formData.name,
          accountType: formData.userType,
          dashboardUrl: `${window.location.origin}/onboarding`,
          profileUrl: `${window.location.origin}/onboarding`
        });
        console.log('Account creation notification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send account creation notification email:', emailError);
        // Don't fail the signup process if email fails
        // Just log the error silently
      }
      
      toast.success(t('signupPage.signupSuccess'));
      navigate('/awaiting-confirmation', { state: { email: formData.email } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: '', color: '', width: '0%' };
    
    let score = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push(t('signupPage.passwordStrength.feedback_length'));

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push(t('signupPage.passwordStrength.feedback_lowercase'));

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push(t('signupPage.passwordStrength.feedback_uppercase'));

    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push(t('signupPage.passwordStrength.feedback_number'));

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    const strengthLevels = {
      0: { strength: t('signupPage.passwordStrength.veryWeak'), color: 'bg-red-500', width: '20%' },
      1: { strength: t('signupPage.passwordStrength.weak'), color: 'bg-red-400', width: '40%' },
      2: { strength: t('signupPage.passwordStrength.fair'), color: 'bg-yellow-500', width: '60%' },
      3: { strength: t('signupPage.passwordStrength.good'), color: 'bg-blue-500', width: '80%' },
      4: { strength: t('signupPage.passwordStrength.strong'), color: 'bg-green-500', width: '100%' },
      5: { strength: t('signupPage.passwordStrength.veryStrong'), color: 'bg-green-600', width: '100%' }
    };

    return { ...strengthLevels[score], feedback };
  };

  const isSignupEnabled = (
    formData.email.trim() &&
    formData.password.trim() &&
    formData.confirmPassword.trim() &&
    formData.name.trim() &&
    (formData.userType !== 'employer' || formData.company.trim()) &&
    formData.agreeToTerms
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <img 
              src="https://xxluivbatngexikkjqbo.supabase.co/storage/v1/object/public/assets/logos/Logo%20Color.png" 
              alt="Velai" 
              className="h-10 w-auto"
            />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{t('signupPage.createAccount')}</h2>
          <p className="text-gray-600 mt-2">{t('signupPage.startJourney')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.iAmA')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, userType: 'employer' }))}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  formData.userType === 'employer'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {t('common.employer')}
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, userType: 'candidate' }))}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  formData.userType === 'candidate'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {t('common.candidate')}
              </button>
            </div>
          </div>

          <Input
            label={t(formData.userType === 'employer' ? 'signupPage.contactName' : 'signupPage.fullName')}
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            icon={<User className="w-5 h-5" />}
            placeholder={t(formData.userType === 'employer' ? 'signupPage.yourFullName' : 'signupPage.enterFullName')}
          />

          {formData.userType === 'employer' && (
            <Input
              label={t('signupPage.companyName')}
              name="company"
              type="text"
              value={formData.company}
              onChange={handleChange}
              icon={<Building className="w-5 h-5" />}
              placeholder={t('signupPage.enterCompanyName')}
            />
          )}

          <Input
            label={t('common.emailAddress')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail className="w-5 h-5" />}
            placeholder={t('common.enterEmail')}
          />

          <div className="relative">
            <Input
              label={t('common.password')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="w-5 h-5" />}
              placeholder={t('signupPage.createPassword')}
              hint={t('signupPage.passwordHint')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-600">{t('signupPage.passwordStrength.title')}</span>
                <span className={`text-xs font-bold ${getPasswordStrength(formData.password).color.replace('bg-', 'text-')}`}>
                  {getPasswordStrength(formData.password).strength}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getPasswordStrength(formData.password).color}`}
                  style={{ width: getPasswordStrength(formData.password).width }}
                ></div>
              </div>
              {getPasswordStrength(formData.password).feedback.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('signupPage.passwordStrength.suggestions')} {getPasswordStrength(formData.password).feedback.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="relative">
            <Input
              label={t('signupPage.confirmPassword')}
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={<Lock className="w-5 h-5" />}
              placeholder={t('signupPage.reEnterPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Real-time password match feedback */}
          {formData.confirmPassword && (
            <div className="mt-1">
              {formData.password === formData.confirmPassword ? (
                <p className="text-xs text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t('signupPage.passwordMatch')}
                </p>
              ) : (
                <p className="text-xs text-red-600 flex items-center">
                  <XCircle className="w-3 h-3 mr-1" />
                  {t('signupPage.passwordsDoNotMatch')}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {t('signupPage.termsAndConditions.agreeTo')}{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
                  {t('signupPage.termsAndConditions.termsOfService')}
                </Link>
                {' '}{t('signupPage.termsAndConditions.and')}{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500 font-medium">
                  {t('signupPage.termsAndConditions.privacyPolicy')}
                </Link>
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!isSignupEnabled || loading}
          >
            {t('signupPage.createAccountButton')}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              {t('signupPage.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                {t('common.signIn')}
              </Link>
            </span>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SignupPage;
