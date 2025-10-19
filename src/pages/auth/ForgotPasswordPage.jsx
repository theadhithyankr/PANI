import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../clients/supabaseClient';
import { useToast } from '../../hooks/common';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(t('forgotPasswordPage.emailRequired'));
      return;
    }

    setLoading(true);
    
    try {
      console.log('Sending reset email to:', email);
      
      // Call the Supabase function
      const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://app.velai.eu/reset-password',
      });

      console.log('API Response:', response);

      // Since API returns empty object {} for success, treat it as success
      setEmailSent(true);
      toast.success(t('forgotPasswordPage.emailSentSuccess'));
      
    } catch (err) {
      console.error('Error in password reset:', err);
      toast.error(t('forgotPasswordPage.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center p-8">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('forgotPasswordPage.checkYourEmail')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('forgotPasswordPage.resetLinkSent')} <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {t('forgotPasswordPage.didNotReceive')}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                {t('forgotPasswordPage.tryDifferentEmail')}
              </Button>
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('forgotPasswordPage.backToLogin')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('forgotPasswordPage.forgotPasswordTitle')}
            </h2>
            <p className="text-gray-600">
              {t('forgotPasswordPage.enterEmailInstruction')}
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('forgotPasswordPage.emailAddressLabel')}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('forgotPasswordPage.enterEmailPlaceholder')}
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? t('forgotPasswordPage.sending') : t('forgotPasswordPage.sendResetLink')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              {t('forgotPasswordPage.backToLogin')}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage; 