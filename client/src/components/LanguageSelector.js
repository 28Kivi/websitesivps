import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';
import './LanguageSelector.css';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');

  useEffect(() => {
    // i18n dil değişikliklerini dinle
    const handleLanguageChanged = (lng) => {
      const langCode = lng?.split('-')[0] || lng || 'en';
      setCurrentLang(langCode);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    // İlk yüklemede mevcut dili ayarla
    setCurrentLang(i18n.language?.split('-')[0] || i18n.language || 'en');

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const changeLanguage = useCallback((lng) => {
    logger.log('Changing language to:', lng);
    i18n.changeLanguage(lng).then(() => {
      logger.log('Language changed to:', lng);
      setCurrentLang(lng);
      localStorage.setItem('i18nextLng', lng);
    }).catch((err) => {
      logger.error('Language change error:', err);
    });
  }, [i18n]);

  return (
    <div className="language-selector">
      <select
        value={currentLang}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;

