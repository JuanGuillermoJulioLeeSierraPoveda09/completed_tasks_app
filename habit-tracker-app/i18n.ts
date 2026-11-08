import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './languages/en.json';
import es from './languages/es.json';
import ja from './languages/ja.json';
import { useSettingsStore, type AppLanguage } from './src/stores/settingsStore';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'es', 'ja'];

const isSupportedLanguage = (code: string | null | undefined): code is AppLanguage =>
  !!code && (SUPPORTED_LANGUAGES as string[]).includes(code);

export const getDeviceLanguage = (): AppLanguage => {
  const code = Localization.getLocales()[0]?.languageCode;
  return isSupportedLanguage(code) ? code : 'en';
};

const resources = {
  en: { translation: en },
  es: { translation: es },
  ja: { translation: ja },
};

const initialLanguage = useSettingsStore.getState().language ?? getDeviceLanguage();

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;