import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import SettingsSection from '../../src/components/settings/SettingSection';
import SettingsRow from '../../src/components/settings/SettingsRow';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { LANGUAGE_OPTIONS } from '../../src/constants/languages';

export default function SettingsScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const weekStartsOn = useSettingsStore((s) => s.weekStartsOn);
    const currentLanguageName = LANGUAGE_OPTIONS.find((option) => option.code === i18n.language)?.nativeName;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <SettingsSection title={t('account')}>
                <SettingsRow 
                    icon="person-outline"
                    label={t('editProfile')}
                    onPress={() => router.push('/settings/edit-profile')}
                />
                <SettingsRow 
                    icon="shield-checkmark-outline"
                    label={t('accountAndSecurity')}
                    onPress={() => router.push('/settings/account-security')}
                />
            </SettingsSection>

            <SettingsSection title={t('preferences')}>
                <SettingsRow 
                    icon="language-outline"
                    label={t('language')}
                    value={currentLanguageName}
                    onPress={() => router.push('/settings/language')}
                />
                <SettingsRow 
                    icon="color-palette-outline"
                    label={t('theme')}
                    onPress={() => router.push('/settings/theme')}
                />
                <SettingsRow 
                    icon="calendar-outline"
                    label={t('weekStartsOn')}
                    value={t(weekStartsOn === 0 ? 'Sunday' : 'Monday')}
                    onPress={() => router.push('/settings/week-start')}
                />
                <SettingsRow 
                    icon="notifications-outline"
                    label={t('reminders')}
                    onPress={() => router.push('/settings/reminders')}
                />
            </SettingsSection>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F7',
    },
    content: {
        padding: 16,
        paddingBottom: 32,
    },
});