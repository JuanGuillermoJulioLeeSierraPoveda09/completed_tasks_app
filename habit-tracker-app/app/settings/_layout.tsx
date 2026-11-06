import { Stack } from 'expo-router';
import { useTranslation} from 'react-i18next';
import { FONTS } from '../../fonts';

export default function SettingsLayout() {
    const { t } = useTranslation();

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#F9F9F7' },
                headerShadowVisible: false,
                headerTintColor: '#1F2937',
                headerTitleStyle: { fontFamily: FONTS.bold },
                contentStyle: { backgroundColor: '#F9F9F7' },
            }}
        >
            <Stack.Screen name="index" options={{ title: t('settings') }} />
            <Stack.Screen name="edit-profile" options={{ title: t('editProfile') }} />
            <Stack.Screen name="account-security" options={{ title: t('accountAndSecurity') }} />
            <Stack.Screen name="language" options={{ title: t('language') }} />
            <Stack.Screen name="theme" options={{ title: t('theme') }} />
            <Stack.Screen name="week-start" options={{ title: t('weekStartsOn') }} />
            <Stack.Screen name="reminders" options={{ title: t('reminders') }} />
        </Stack>
    );
}