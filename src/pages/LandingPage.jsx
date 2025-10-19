import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Briefcase, Globe, Zap } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const LandingPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-900">{t('landing.brand')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" size="sm">{t('nav.login')}</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">{t('nav.getStarted')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('landing.hero.title1')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
              {t('landing.hero.title2')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                {t('landing.hero.startHiring')}
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" size="lg">
                {t('landing.hero.findOpportunities')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.aiMatching.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('landing.features.aiMatching.desc')}
              </p>
            </Card>
            
            <Card className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.globalRelocation.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('landing.features.globalRelocation.desc')}
              </p>
            </Card>
            
            <Card className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.culturalBridge.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('landing.features.culturalBridge.desc')}
              </p>
            </Card>
            
            <Card className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.endToEnd.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('landing.features.endToEnd.desc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-500 to-green-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <Link to="/signup">
            <Button variant="neutral" size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
              {t('landing.cta.button')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
                <span className="text-lg font-bold">{t('landing.brand')}</span>
              </div>
              <p className="text-gray-400 text-sm">
                {t('landing.footer.brandDesc')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.employers')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.postJobs')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.findTalent')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.pricing')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.candidates')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.browseJobs')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.careerAdvice')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.relocationGuide')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.support')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.helpCenter')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.contactUs')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.footer.links.privacyPolicy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 {t('landing.brand')}. {t('landing.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
