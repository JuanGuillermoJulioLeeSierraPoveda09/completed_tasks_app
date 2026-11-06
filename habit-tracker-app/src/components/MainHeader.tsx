import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../fonts';

const MainHeader = React.memo<{
  dateText: string;
  isTodayCompleted: boolean;
  streak: number;
  onDatePress: () => void;
  onStreakPress: () => void;
  onSettingsPress: () => void;
}>(({ dateText, isTodayCompleted, streak, onDatePress, onStreakPress, onSettingsPress }) => (
  <View style={styles.navbar}>
    <TouchableOpacity style={styles.dateSelector} onPress={onDatePress}>
      <Text style={styles.dateText}>{dateText}</Text>
      <Ionicons name="chevron-down" size={18} color="#1F2937" />
    </TouchableOpacity>

    <View style={styles.rightActions}>
      <TouchableOpacity style={styles.streakBadge} onPress={onStreakPress}>
        <Ionicons name="flame" size={22} color={isTodayCompleted ? '#F39E0B' : '#9CA3AF'} />
        <Text style={styles.streakText}>{streak}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress}>
        <Ionicons name="settings-outline" size={22} color="#1F2937" />
      </TouchableOpacity>
    </View>
  </View>
));

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dateText: { fontSize: 22, fontFamily: FONTS.extraBold, color: '#1F2937' },
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
  streakText: { fontSize: 16, fontFamily: FONTS.bold, color: '#1F2937' },
  settingsButton: { padding: 4 },
});

export default MainHeader;
