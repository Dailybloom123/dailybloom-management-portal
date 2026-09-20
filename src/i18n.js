import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './i18n/locales.json';

const resources = {
  en: {
    translation: enTranslations.en.translation,
  },
  hi: {
    translation: enTranslations.hi.translation,
  },
  as: {
    translation: enTranslations.as.translation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Detect user's preferred language
const detectLanguage = () => {
  const savedLang = localStorage.getItem('dailybloom_language');
  if (savedLang && ['en', 'hi', 'as'].includes(savedLang)) {
    return savedLang;
  }
  
  // Try to detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (['en', 'hi', 'as'].includes(browserLang)) {
    return browserLang;
  }
  
  return 'en';
};

// Set detected language
i18n.changeLanguage(detectLanguage());

export default i18n;
