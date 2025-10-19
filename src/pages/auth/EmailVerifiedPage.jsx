import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/common';
import Confetti from '../../components/common/Confetti';

const EmailVerifiedPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    // The user is automatically signed in by onAuthStateChange after verification.
    // We just need to show a success message.
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Confetti />
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t('emailVerifiedPage.title')}</h2>
        <p className="text-gray-600 mt-2">
          {t('emailVerifiedPage.message')}
        </p>

        <div className="mt-8">
          {user ? (
            <Link to={user.onboarding_complete ? "/dashboard" : "/onboarding"}>
              <Button variant="primary" className="w-full">
                {t('emailVerifiedPage.continueToDashboard')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="primary" className="w-full">
                {t('emailVerifiedPage.continueToLogin')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EmailVerifiedPage; 