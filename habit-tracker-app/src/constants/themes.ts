import type { ThemePreference } from "../stores/settingsStore";

export const THEME_OPTIONS: {
    value: ThemePreference;
    translationKey: string;
    descriptionKey?: string;
}[] = [
    { value: 'system', translationKey: 'themeSystem', descriptionKey: 'themeSystemDescription' },
    { value: 'light', translationKey: 'themeLight' },
    { value: 'dark', translationKey: 'themeDark' },
];