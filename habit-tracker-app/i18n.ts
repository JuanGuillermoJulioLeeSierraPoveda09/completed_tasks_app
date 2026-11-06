import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './languages/en.json';
import es from './languages/es.json';
import ja from './languages/jp.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  jp: { translation: ja }
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;