const LOCALE_TAGS: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    ja: 'ja-JP',
};

export const toLocaleTag = (language: string): string => LOCALE_TAGS[language] ?? 'en-US';

export const capitalize = (text: string, localeTag: string): string =>
    text.charAt(0).toLocaleUpperCase(localeTag) + text.slice(1);