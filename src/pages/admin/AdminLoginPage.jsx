import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth, useToast } from '../../hooks/common';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const AdminLoginPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remember = localStorage.getItem('remember-login-admin') === 'true';
    if (!remember) {
      localStorage.removeItem('admin-login-email');
      localStorage.removeItem('admin-login-password');
    } else {
      const savedEmail = localStorage.getItem('admin-login-email') || '';
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      // Admin login: persist email only if explicitly remembered elsewhere (future option)
      localStorage.removeItem('admin-login-password');

      // Add a check to ensure only admins can log in
      if (user && user.user_type === 'admin') {
        toast.success(t('loginPage.welcomeBackSuccess'));
        navigate('/admin/dashboard');
      } else {
        toast.error('You do not have permission to access this page.');
        // Maybe sign them out if they are not an admin
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 via-gray-900 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
          <p className="text-gray-600 mt-2">Sign in to the administration panel</p>
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            {t('common.signIn')}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLoginPage; 