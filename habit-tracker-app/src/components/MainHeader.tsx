import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../fonts';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

const MainHeader = React.memo<{
  dateText: string;
  isTodayCompleted: boolean;
  streak: number;
  onDatePress: () => void;
  onStreakPress: () => void;
  onSettingsPress: () => void;
}>(({ dateText, isTodayCompleted, streak, onDatePress, onStreakPress, onSettingsPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.navbar}>
      <TouchableOpacity style={styles.dateSelector} onPress={onDatePress}>
        <Text style={styles.dateText}>{dateText}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.streakBadge} onPress={onStreakPress}>
          <Ionicons name="flame" size={22} color={isTodayCompleted ? colors.warning : colors.textMuted} />
          <Text style={styles.streakText}>{streak}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    navbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: { fontSize: 22, fontFamily: FONTS.extraBold, color: colors.text },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    streakText: { fontSize: 16, fontFamily: FONTS.bold, color: colors.text },
    settingsButton: { padding: 4 },
  });

export default MainHeader;