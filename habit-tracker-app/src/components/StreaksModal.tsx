import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { computeStreakStats } from '../../habitsStore';
import MonthCalendar from './MonthCalendar';
import { FONTS } from '../../fonts';

const StreaksModal = React.memo<{
  visible: boolean;
  stats: ReturnType<typeof computeStreakStats>;
  weekDayLabels: string[];
  locale: string;
  getDayProgress: (date: Date) => { total: number; done: number };
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}>(({ visible, stats, weekDayLabels, locale, getDayProgress, onSelectDate, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent={true}>
      <SafeAreaView style={styles.streaksContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.streaksHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.streaksTitle}>{t('myStreaks')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.streaksTopBox}>
          <View style={styles.streakCard}>
            <Ionicons name="flame" size={56} color="#F59E0B" />
            <Text style={styles.streakLabel}>{t('loggedDays')}</Text>
            <Text style={[styles.streakNumber, { color: '#F59E0B' }]}>
              {stats.loggedCurrent}
            </Text>
            <Text style={styles.streakSubtext}>{t('currentStreak')}</Text>
            <View style={styles.bestBadge}>
              <Ionicons name="trophy-outline" size={16} color="#F59E0B" />
              <Text style={styles.bestText}>{t('best')}: {stats.loggedBest}</Text>
            </View>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakCard}>
              <Ionicons name="flame" size={56} color="#10B981" />
              <Text style={styles.streakLabel}>{t('perfectDays')}</Text>
              <Text style={[styles.streakNumber, { color: '#10B981' }]}>{stats.perfectCurrent}</Text>
              <Text style={styles.streakSubtext}>{t('currentStreak')}</Text>
              <View style={styles.bestBadge}>
                <Ionicons name="trophy-outline" size={16} color="#10B981" />
                <Text style={styles.bestText}>{t('best')}: {stats.perfectBest}</Text>
              </View>
            </View>
          </View>

          <View style={styles.calendarSectionBox}>
            <MonthCalendar 
              weekDayLabels={weekDayLabels}
              locale={locale}
              getDayProgress={getDayProgress}
              onSelectDate={onSelectDate}
            />
          </View>
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  streaksContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  streaksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.3,
    borderColor: '#F3F4F6'
  },
  streaksTitle: { fontSize: 17, fontFamily: FONTS.bold, color: '#1F2937' },
  streaksTopBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 12,
    paddingBottom: 40
  },
  streakCard: { alignItems: 'center', flex: 1 },
  streakDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  streakLabel: { fontSize: 15, fontFamily: FONTS.bold, color: '#1F2937', marginTop: 8 },
  streakNumber: { fontSize: 32, fontFamily: FONTS.extraBold, marginVertical: 2 },
  streakSubtext: { fontSize: 13, fontFamily: FONTS.regular, color: '#6B7280', marginBottom: 10 },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  bestText: { color: '#374151', fontFamily: FONTS.semiBold, fontSize: 14 },
  calendarSectionBox: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    paddingBottom: 200
  },
});

export default StreaksModal;
