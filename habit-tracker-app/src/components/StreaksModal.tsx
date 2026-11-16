import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { computeStreakStats } from '../../habitsStore';
import MonthCalendar from './MonthCalendar';
import { FONTS } from '../../fonts';
import type { WeekStart } from '../stores/settingsStore';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

const StreaksModal = React.memo<{
  visible: boolean;
  stats: ReturnType<typeof computeStreakStats>;
  weekDayLabels: string[];
  weekStartsOn: WeekStart;
  locale: string;
  getDayProgress: (date: Date) => { total: number; done: number };
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}>(({ visible, stats, weekDayLabels, weekStartsOn, locale, getDayProgress, onSelectDate, onClose }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent={true}>
      <SafeAreaView style={styles.streaksContainer}>
        <View style={styles.streaksHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.streaksTitle}>{t('myStreaks')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.streaksTopBox}>
          <View style={styles.streakCard}>
            <Ionicons name="flame" size={56} color={colors.warning} />
            <Text style={styles.streakLabel}>{t('loggedDays')}</Text>
            <Text style={[styles.streakNumber, { color: colors.warning }]}>
              {stats.loggedCurrent}
            </Text>
            <Text style={styles.streakSubtext}>{t('currentStreak')}</Text>
            <View style={styles.bestBadge}>
              <Ionicons name="trophy-outline" size={16} color={colors.warning} />
              <Text style={styles.bestText}>{t('best')}: {stats.loggedBest}</Text>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakCard}>
            <Ionicons name="flame" size={56} color={colors.success} />
            <Text style={styles.streakLabel}>{t('perfectDays')}</Text>
            <Text style={[styles.streakNumber, { color: colors.success }]}>{stats.perfectCurrent}</Text>
            <Text style={styles.streakSubtext}>{t('currentStreak')}</Text>
            <View style={styles.bestBadge}>
              <Ionicons name="trophy-outline" size={16} color={colors.success} />
              <Text style={styles.bestText}>{t('best')}: {stats.perfectBest}</Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarSectionBox}>
          <MonthCalendar
            weekDayLabels={weekDayLabels}
            weekStartsOn={weekStartsOn}
            locale={locale}
            getDayProgress={getDayProgress}
            onSelectDate={onSelectDate}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    streaksContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    streaksHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1.3,
      borderColor: colors.fill,
    },
    streaksTitle: { fontSize: 17, fontFamily: FONTS.bold, color: colors.text },
    streaksTopBox: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      paddingVertical: 20,
      paddingHorizontal: 12,
      paddingBottom: 40,
    },
    streakCard: { alignItems: 'center', flex: 1 },
    streakDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
    streakLabel: { fontSize: 15, fontFamily: FONTS.bold, color: colors.text, marginTop: 8 },
    streakNumber: { fontSize: 32, fontFamily: FONTS.extraBold, marginVertical: 2 },
    streakSubtext: { fontSize: 13, fontFamily: FONTS.regular, color: colors.textSecondary, marginBottom: 10 },
    bestBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.fill,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    bestText: { color: colors.text, fontFamily: FONTS.semiBold, fontSize: 14 },
    calendarSectionBox: {
      backgroundColor: colors.fill,
      padding: 16,
      paddingBottom: 200,
    },
  });

export default StreaksModal;