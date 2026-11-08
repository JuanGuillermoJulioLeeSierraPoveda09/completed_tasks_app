import type { AppLanguage } from '../stores/settingsStore';

export const LANGUAGE_OPTIONS: { code: AppLanguage; nativeName: string; translationKey: string }[] = [
    { code: 'en', nativeName: 'English', translationKey: 'english' },
    { code: 'es', nativeName: 'Español', translationKey: 'spanish' },
    { code: 'ja', nativeName: '日本語', translationKey: 'japanese' },
];
