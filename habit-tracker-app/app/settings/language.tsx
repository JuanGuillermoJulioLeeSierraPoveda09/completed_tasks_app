import React from 'react';
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from 'react-i18next';
import SettingsSection from '../../src/components/settings/SettingSection';
import OptionRow from '../../src/components/settings/OptionRow';
import { useSettingsStore, type AppLanguage } from '../../src/stores/settingsStore';
import { LANGUAGE_OPTIONS } from '../../src/constants/languages';

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const currentLanguage = i18n.language;
  
  const handleSelect = (code: AppLanguage) => {
    if (code === currentLanguage ) return;
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingsSection title={t('language')} dividerInset={16}>
        {LANGUAGE_OPTIONS.map((option) => (
          <OptionRow 
            key={option.code}
            label={option.nativeName}
            description={t(option.translationKey)}
            selected={currentLanguage === option.code}
            onPress={() => handleSelect(option.code)}
          />
        ))}
      </SettingsSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:  '#F9F9F7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});