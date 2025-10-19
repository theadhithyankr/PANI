import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth, useToast } from '../../hooks/common';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const LoginPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // One-time cleanup and optional restore of remembered email only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remember = localStorage.getItem('remember-login') === 'true';
    if (!remember) {
      localStorage.removeItem('login-email');
      localStorage.removeItem('login-password'); // legacy cleanup, we never store password
    } else {
      const savedEmail = localStorage.getItem('login-email') || '';
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.email) {
      toast.error(t('loginPage.emailRequired'));
      return false;
    } 
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('loginPage.invalidEmail'));
      return false;
    }
    
    if (!formData.password) {
      toast.error(t('loginPage.passwordRequired'));
      return false;
    } 
    if (formData.password.length < 8) {
      toast.error(t('loginPage.passwordTooShort'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      // Respect explicit Remember Me: persist email only, never password
      if (formData.rememberMe) {
        localStorage.setItem('remember-login', 'true');
        localStorage.setItem('login-email', formData.email);
      } else {
        localStorage.setItem('remember-login', 'false');
        localStorage.removeItem('login-email');
        localStorage.removeItem('login-password');
      }
      toast.success(t('loginPage.welcomeBackSuccess'));
      // Navigation will be handled by the App.jsx routing logic
      // based on user.onboarding_complete status
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isLoginEnabled = formData.email.trim() && formData.password.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <img 
              src="/src/assets/logos/logo-type.svg" 
              alt="Pani" 
              className="h-10 w-auto"
            />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{t('loginPage.welcomeBack')}</h2>
          <p className="text-gray-600 mt-2">{t('loginPage.signInToAccount')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <Input
            label={t('common.emailAddress')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail className="w-5 h-5" />}
            placeholder={t('common.enterEmail')}
            autoComplete="username"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
          />

          <div className="relative">
            <Input
              label={t('common.password')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="w-5 h-5" />}
              placeholder={t('loginPage.enterPassword')}
              autoComplete="current-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{t('loginPage.rememberMe')}</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
              {t('loginPage.forgotPassword')}
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!isLoginEnabled || loading}
          >
            {t('common.signIn')}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              {t('loginPage.noAccount')}{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                {t('common.signUp')}
              </Link>
            </span>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
