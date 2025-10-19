import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);

  const [selectedChoice, setSelectedChoice] = useState(
    localStorage.getItem('language-choice') || 'system'
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSystemLanguage = () => {
    const lang = navigator.language.split('-')[0];
    return ['en', 'de'].includes(lang) ? lang : 'en';
  };

  useEffect(() => {
    const choice = localStorage.getItem('language-choice') || 'system';
    setSelectedChoice(choice);
    if (choice === 'system') {
      i18n.changeLanguage(getSystemLanguage());
    } else {
      i18n.changeLanguage(choice);
    }
  }, [i18n]);

  const languages = [
    { code: 'system', name: 'System Language' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
  ];

  const changeLanguage = (choice) => {
    setSelectedChoice(choice);
    localStorage.setItem('language-choice', choice);
    if (choice === 'system') {
      i18n.changeLanguage(getSystemLanguage());
    } else {
      i18n.changeLanguage(choice);
    }
    setIsLangOpen(false);
  };

  const renderIconContent = () => {
    switch (selectedChoice) {
      case 'en':
        return <span className="font-semibold text-gray-600 group-hover:text-gray-900">EN</span>;
      case 'de':
        return <span className="font-semibold text-gray-600 group-hover:text-gray-900">DE</span>;
      default:
        return <Globe className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />;
    }
  };

  return (
    <div className="relative" ref={langRef}>
      <Tippy content="Language" placement="right" delay={[0, 0]} disabled={isLangOpen}>
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="group flex items-center justify-center w-12 h-12 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-gray-100"
        >
          {renderIconContent()}
        </button>
      </Tippy>

      {isLangOpen && (
        <div className="absolute bottom-8 left-16 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Language</p>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className="w-full text-left px-3 py-2.5 text-sm rounded-lg flex justify-between items-center hover:bg-gray-100 group transition-colors"
              >
                <span className="font-medium text-gray-700 group-hover:text-gray-900">{lang.name}</span>
                {selectedChoice === lang.code && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 