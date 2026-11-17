import { useEffect } from 'react';
import { Appearance, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { FONT_ASSETS } from '../fonts';
import '../i18n';
import { Stack } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function RootLayout() {
    const [fontsLoaded] = useFonts(FONT_ASSETS);
    const { colors, isDark } = useTheme();
    const themePreference = useSettingsStore((s) => s.theme);

    useEffect(() => {
        Appearance.setColorScheme(themePreference === 'system' ? 'unspecified' : themePreference);
    }, [themePreference]);

    if (!fontsLoaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: colors.background },
                }}
            />
        </GestureHandlerRootView>
    );
}