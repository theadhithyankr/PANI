import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const AwaitingConfirmationPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const email = location.state?.email || t('awaitingConfirmationPage.yourEmailAddress');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t('awaitingConfirmationPage.title')}</h2>
        <p className="text-gray-600 mt-2">
          {t('awaitingConfirmationPage.messageLine1')}
        </p>
        <p className="font-semibold text-gray-800 my-4">{email}</p>
        <p className="text-gray-600">
          {t('awaitingConfirmationPage.messageLine2')}
        </p>
        <div className="mt-8">
          <p className="text-sm text-gray-500">
            {t('awaitingConfirmationPage.didNotReceiveEmail')}{' '}
            <button
              // TODO: Implement resend confirmation email functionality
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t('awaitingConfirmationPage.resendLink')}
            </button>
          </p>
        </div>
        <div className="mt-6">
          <Link to="/login">
            <Button variant="outline" className="w-full">
              {t('awaitingConfirmationPage.backToLogin')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AwaitingConfirmationPage; 