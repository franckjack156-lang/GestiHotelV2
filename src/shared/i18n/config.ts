/**
 * Configuration i18n pour la traduction multilingue
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des traductions
import frTranslations from './locales/fr.json';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

i18n
  .use(LanguageDetector) // Détecte la langue du navigateur
  .use(initReactI18next) // Passe i18n à react-i18next
  .init({
    resources: {
      fr: { translation: frTranslations },
      en: { translation: enTranslations },
      es: { translation: esTranslations },
    },
    fallbackLng: 'fr', // Langue par défaut
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
