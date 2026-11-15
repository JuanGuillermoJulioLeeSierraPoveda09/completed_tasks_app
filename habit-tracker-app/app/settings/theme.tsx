import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import SettingsSection from "../../src/components/settings/SettingSection";
import OptionRow from "../../src/components/settings/OptionRow";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { THEME_OPTIONS } from "../../src/constants/themes";
import { useTheme } from "../../src/theme/useTheme";
import type { ThemeColors } from "../../src/theme/colors";

export default function ThemeScreen() {
  const { t } = useTranslation();
  const themePreference = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingsSection title={t('theme')} dividerInset={16}>
        {THEME_OPTIONS.map((option) => (
          <OptionRow 
            key={option.value}
            label={t(option.translationKey)}
            description={option.descriptionKey ? t(option.descriptionKey) : undefined}
            selected={themePreference === option.value}
            onPress={() => setTheme(option.value)}
          />
        ))}
      </SettingsSection>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: 16,
            paddingBottom: 32,
        },
    });