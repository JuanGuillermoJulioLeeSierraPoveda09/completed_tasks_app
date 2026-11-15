import { useColorScheme } from "react-native";
import { useSettingsStore } from "../stores/settingsStore";
import { darkColors, lightColors, type ThemeColors } from "./colors";

export type Theme = {
    colors: ThemeColors;
    isDark: boolean;
};

const LIGHT_THEME: Theme = { colors: lightColors, isDark: false };
const DARK_THEME: Theme = { colors: darkColors, isDark: true };

export function useTheme(): Theme {
    const preference = useSettingsStore((s) => s.theme);
    const systemScheme = useColorScheme();
    const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
    
    return isDark ? DARK_THEME : LIGHT_THEME;
}