import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/common';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';

const CompanyNotVerifiedPage = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center" padding="lg">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t('companyNotVerifiedPage.title', 'Verification Pending')}</h2>
        <p className="text-gray-600 mt-2">
          {t('companyNotVerifiedPage.message', "Your company profile is currently under review. This usually takes a few hours. We will notify you via email once it's approved.")}
        </p>
        <p className="text-gray-600 mt-2">
          {t('companyNotVerifiedPage.contactSupport', 'If you have any questions, please contact our support team.')}
        </p>

        <div className="mt-8 flex flex-col space-y-4">
          <Button onClick={logout} variant="primary" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            {t('common.logout', 'Logout')}
          </Button>
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-500">
            {t('common.backToHome', 'Back to Homepage')}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default CompanyNotVerifiedPage; 