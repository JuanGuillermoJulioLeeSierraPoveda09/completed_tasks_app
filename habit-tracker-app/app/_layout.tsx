import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { FONT_ASSETS } from '../fonts';
import '../i18n';
import { Stack } from 'expo-router';

export default function RootLayout() {
    const [fontsLoaded] = useFonts(FONT_ASSETS);
    if (!fontsLoaded) return null;
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </GestureHandlerRootView>
    )
}