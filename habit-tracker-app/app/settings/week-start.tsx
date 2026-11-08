import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import SettingsSection from '../../src/components/settings/SettingSection';
import OptionRow from '../../src/components/settings/OptionRow';
import { useSettingsStore, type WeekStart } from '../../src/stores/settingsStore';

const WEEK_START_OPTIONS: { value: WeekStart; translationKey: string }[] = [
    { value: 0, translationKey: 'Sunday' },
    { value: 1, translationKey: 'Monday' },
];

export default function WeekStartScreen() {
    const { t } = useTranslation();
    const weekStartsOn = useSettingsStore((s) => s.weekStartsOn);
    const setWeekStartsOn = useSettingsStore((s) => s.setWeekStartsOn);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <SettingsSection title={t('weekStartsOn')}>
                {WEEK_START_OPTIONS.map((option) => (
                    <OptionRow
                        key={option.value}
                        label={t(option.translationKey)}
                        selected={weekStartsOn === option.value}
                        onPress={() => setWeekStartsOn(option.value)}
                    />
                ))}
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