import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, StatusBar, Platform, Alert, AppState } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useHabitsStore, formatDateKey, getDayProgress as dayProgress, computeStreakStats, type HabitDraft } from '../habitsStore';
import { ensureReminderChannel, shouldShowNotificationPrompt, snoozeNotificationPrompt, requestNotificationPermission, scheduleHabitReminder, cancelHabitReminders, rescheduleAllHabitReminders, areNotificationsEnabled, openNotificationSettings } from '../notifications';
import NotificationPermissionModal from '../src/components/NotificationPermissionModal';
import WeekStrip from '../src/components/WeekStrip';
import { triggerHaptic, triggerButtonHaptics } from '../src/utils/haptics';
import { type InfoMap, type DragContext } from '../src/utils/dragLayout';
import { getRelativeDay } from '../src/utils/relativeDay';
import HabitFormModal from '../src/components/HabitFormModal';
import MainHeader from '../src/components/MainHeader';
import BottomBar from '../src/components/BottomBar';
import HabitList from '../src/components/HabitList';
import StreaksModal from '../src/components/StreaksModal';
import RelapseModal from '../src/components/RelapseModal';
import { toLocaleTag, capitalize } from '../src/utils/locale';
import { useSettingsStore } from '../src/stores/settingsStore';
import { getDayColumn, getDateAt, getWeekOffset, rotateWeekDays } from '../src/utils/week';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLocale = toLocaleTag(i18n.language);
  const WEEK_DAYS = useMemo(() => [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')], [t]);
  const weekStartsOn = useSettingsStore((s) => s.weekStartsOn);
  const WEEK_LABELS = useMemo(() => rotateWeekDays(WEEK_DAYS, weekStartsOn), [WEEK_DAYS, weekStartsOn]);
  const dragInfo = useSharedValue<InfoMap>({});
  const dragId = useSharedValue('');
  const dragTo = useSharedValue(-1);
  const dragCommitting = useSharedValue(false);
  const dragCtx = useMemo<DragContext>(
    () => ({ info: dragInfo, dragId, dragTo, committing: dragCommitting }),
    []
  );
  const habits = useHabitsStore((s) => s.habits);
  const habitLogs = useHabitsStore((s) => s.habitLogs);
  const relapseLogs = useHabitsStore((s) => s.relapseLogs);
  const uncheckedLogs = useHabitsStore((s) => s.uncheckedLogs);
  const toggleCompletion = useHabitsStore((s) => s.toggleCompletion);
  const confirmRelapseInStore = useHabitsStore((s) => s.confirmRelapse);
  const createHabit = useHabitsStore((s) => s.createHabit);
  const updateHabit = useHabitsStore((s) => s.updateHabit);
  const deleteHabit = useHabitsStore((s) => s.deleteHabit);
  const reorderHabit = useHabitsStore((s) => s.reorderHabit);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => getDayColumn(new Date(), weekStartsOn));
  const [isRelapseModalVisible, setIsRelapseModalVisible] = useState(false);
  const [relapsingHabitId, setRelapsingHabitId] = useState<string | null>(null);
  const [isNotificationPromptVisible, setIsNotificationPromptVisible] = useState(false);


  useEffect(() => {
    let promptTimer: ReturnType<typeof setTimeout> | undefined;
    ensureReminderChannel();
    shouldShowNotificationPrompt().then((show) => {
      if (show) promptTimer = setTimeout(() => setIsNotificationPromptVisible(true), 800);
    });
    return () => clearTimeout(promptTimer);
  }, []);

  useEffect(() => {
    rescheduleAllHabitReminders(useHabitsStore.getState().habits);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') rescheduleAllHabitReminders(useHabitsStore.getState().habits);
    });
    return () => subscription.remove();
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsNotificationPromptVisible(false);
    const granted = await requestNotificationPermission();
    if (!granted) rescheduleAllHabitReminders(useHabitsStore.getState().habits);
    else snoozeNotificationPrompt();
  }, []);

  const handleNotificationPromptLater = useCallback(() => {
    snoozeNotificationPrompt();
    setIsNotificationPromptVisible(false);
  }, []);

  const handleMePress = useCallback(async () => {
    const enabled = await areNotificationsEnabled();
    Alert.alert(
      t('notifSettingsTitle'),
      enabled ? t('notifSettingsOnBody') : t('notifSettingsOffBody'),
      [
        { text: t('notNow'), style: 'cancel' },
        { text: t('openSettings'), onPress: openNotificationSettings },
      ]
    );
  }, [t]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStreaksModalVisible, setIsStreaksModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [formSession, setFormSession] = useState(0);

  const activeDate = useMemo(
    () => getDateAt(weekOffset, selectedDayIndex, weekStartsOn),
    [weekOffset, selectedDayIndex, weekStartsOn]
  );

  const prevWeekStartsOn = useRef(weekStartsOn);
  useEffect(() => {
    const previous = prevWeekStartsOn.current;
    if (previous === weekStartsOn) return;
    prevWeekStartsOn.current = weekStartsOn;
    const date = getDateAt(weekOffset, selectedDayIndex, previous);
    setWeekOffset(getWeekOffset(date, weekStartsOn));
    setSelectedDayIndex(getDayColumn(date, weekStartsOn));
  }, [weekStartsOn]);

  const activeDateKey = useMemo(() => formatDateKey(activeDate), [activeDate]);

  const headerDateText = useMemo(() => {
    const relativeDay = getRelativeDay(activeDate);
    if (relativeDay) return t(relativeDay);
    const dayName = capitalize(activeDate.toLocaleDateString(currentLocale, { weekday: 'long' }), currentLocale);
    const monthName = capitalize(activeDate.toLocaleDateString(currentLocale, { month: 'short' }), currentLocale);
    return `${dayName} ${monthName} ${activeDate.getDate()}`;
  }, [activeDate, currentLocale, t]);

  const handleHeaderDatePress = useCallback(() => {
    const today = new Date();
    const todayStr = formatDateKey(today);
    const activeStr = formatDateKey(activeDate);
    setActiveMenuHabitId(null);
    if (activeStr !== todayStr) {
      setWeekOffset(0);
      setSelectedDayIndex(getDayColumn(today, weekStartsOn));
    } else {
      setIsStreaksModalVisible(true);
    }
  }, [activeDate]);

  const getDayProgress = useCallback(
    (date: Date) => dayProgress(habits, habitLogs, relapseLogs, uncheckedLogs, date),
    [habits, habitLogs, relapseLogs, uncheckedLogs]
  );
  const activeDateKeyRef = useRef(activeDateKey);
  activeDateKeyRef.current = activeDateKey;

  const handleToggle = useCallback(
    (habitId: string) => toggleCompletion(habitId, activeDateKeyRef.current),
    [toggleCompletion]
  );

  const handleRelapse = useCallback((habitId: string) => {
    setRelapsingHabitId(habitId);
    setIsRelapseModalVisible(true);
  }, []);

  const confirmRelapse = useCallback(() => {
    if (relapsingHabitId) {
      confirmRelapseInStore(relapsingHabitId, activeDateKey);
    }
    setIsRelapseModalVisible(false);
    setRelapsingHabitId(null);
  }, [relapsingHabitId, activeDateKey, confirmRelapseInStore]);

  const cancelRelapse = useCallback(() => {
    setIsRelapseModalVisible(false);
    setRelapsingHabitId(null);
  }, []);

  const handleToggleMenu = useCallback((habitId: string) => {
    setActiveMenuHabitId((prev) => (prev === habitId ? null : habitId));
  }, []);

  const handleLongPress = useCallback(() => {
    setIsEditMode(true);
    triggerHaptic();
  }, []);

  const handleDragCancel = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const groupOrdersRef = useRef<Record<string, string[]>>({});
  const handleGroupIds = useCallback((groupKey: string, ids: string[]) => {
    groupOrdersRef.current[groupKey] = ids;
  }, []);

  const handleReorder = useCallback(
    (habitId: string, toIndex: number, groupKey: string) => {
      setIsEditMode(false);
      setActiveMenuHabitId(null);
      reorderHabit(habitId, toIndex, groupOrdersRef.current[groupKey] ?? []);
    },
    [reorderHabit]
  );

  const handleDeleteHabit = useCallback(
    (habitId: string) => {
      deleteHabit(habitId);
      cancelHabitReminders(habitId);
      setActiveMenuHabitId(null);
    },
    [deleteHabit]
  );

  const openCreateForm = useCallback(() => {
    setEditingHabitId(null);
    setActiveMenuHabitId(null);
    setFormSession((n) => n + 1);
    setIsModalVisible(true);
    triggerButtonHaptics();
  }, []);

  const handleStartEdit = useCallback((habitId: string) => {
    if (useHabitsStore.getState().habits.some((h) => h.id === habitId)) {
      setEditingHabitId(habitId);
      setFormSession((n) => n + 1);
      setIsModalVisible(true);
    }
    setActiveMenuHabitId(null);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsModalVisible(false);
    setEditingHabitId(null);
  }, []);

  const handleSaveHabit = useCallback(
    (draft: HabitDraft) => {
      let savedHabitId = editingHabitId;
      if (editingHabitId) {
        updateHabit(editingHabitId, draft, activeDateKey);
      } else {
        savedHabitId = createHabit(draft, activeDateKey).id;
      }
      if (savedHabitId) scheduleHabitReminder(savedHabitId, draft);
      setIsModalVisible(false);
      setEditingHabitId(null);
      setActiveMenuHabitId(null);
      if (Platform.OS === 'android') {
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    [editingHabitId, activeDateKey, createHabit, updateHabit]
  );

  const handleSelectWeekDay = useCallback((index: number) => {
    setSelectedDayIndex(index);
    setActiveMenuHabitId(null);
  }, []);

  const streakStats = useMemo(() => computeStreakStats(habits, habitLogs, relapseLogs, uncheckedLogs), [habits, habitLogs, relapseLogs, uncheckedLogs]);

  const handleSelectedCalendarDay = useCallback((targetDate: Date) => {
    setSelectedDayIndex(getDayColumn(targetDate, weekStartsOn));
    setWeekOffset(getWeekOffset(targetDate, weekStartsOn));
    setIsStreaksModalVisible(false);
    setActiveMenuHabitId(null);
  }, [weekStartsOn]);

  const getLocale = (languageCode: string) => {
    switch (languageCode) {
      case 'es': return 'es-ES';
      case 'jp': return 'ja-JP';
      case 'en':
      default: return 'en-US';
    }
  };

  const handleStreakPress = useCallback(() => {
    setIsStreaksModalVisible(true);
    setActiveMenuHabitId(null);
  }, []);

  const handleCloseStreaks = useCallback(() => setIsStreaksModalVisible(false), []);

  const handleSettingsPress = useCallback(() => {
    setActiveMenuHabitId(null);
    router.push('/settings');
  }, [router]);

  const isTodayCompleted = useMemo(() => {
    const progress = getDayProgress(new Date());
    return progress.total > 0 && progress.done >= progress.total;
  }, [getDayProgress]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f7" />
      <View
        style={{ flex: 1 }}
      >
        <MainHeader
          dateText={headerDateText}
          isTodayCompleted={isTodayCompleted}
          streak={streakStats.perfectCurrent}
          onDatePress={handleHeaderDatePress}
          onStreakPress={handleStreakPress}
          onSettingsPress={handleSettingsPress}
        />
        <ScrollView
          style={styles.mainContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => activeMenuHabitId && setActiveMenuHabitId(null)}>
          <View style={styles.calendarShadowBox}>
            <View style={styles.calendarContainer}>
              <WeekStrip
                weekOffset={weekOffset}
                weekStartsOn={weekStartsOn}
                selectedDayIndex={selectedDayIndex}
                weekDayLabels={WEEK_LABELS}
                getDayProgress={getDayProgress}
                onChangeWeek={setWeekOffset}
                onSelectDay={handleSelectWeekDay}
              />
            </View>
          </View>

          <HabitList
            activeDate={activeDate}
            activeDateKey={activeDateKey}
            activeMenuHabitId={activeMenuHabitId}
            isEditMode={isEditMode}
            dragCtx={dragCtx}
            handleToggle={handleToggle}
            handleRelapse={handleRelapse}
            handleLongPress={handleLongPress}
            handleReorder={handleReorder}
            handleDragCancel={handleDragCancel}
            handleToggleMenu={handleToggleMenu}
            handleStartEdit={handleStartEdit}
            handleDeleteHabit={handleDeleteHabit}
            handleGroupIds={handleGroupIds}
            openCreateForm={openCreateForm}
          />
        </ScrollView>

        <BottomBar
          onCreate={openCreateForm}
          onMe={handleMePress}
        />
      </View>
      <HabitFormModal
        visible={isModalVisible}
        sessionKey={formSession}
        habit={editingHabitId ? habits.find((h) => h.id === editingHabitId) : undefined}
        onClose={handleCloseForm}
        onSave={handleSaveHabit}
      />

      <StreaksModal
        visible={isStreaksModalVisible}
        stats={streakStats}
        weekDayLabels={WEEK_LABELS}
        weekStartsOn={weekStartsOn}
        locale={currentLocale}
        getDayProgress={getDayProgress}
        onSelectDate={handleSelectedCalendarDay}
        onClose={handleCloseStreaks}
      />

      <RelapseModal
        visible={isRelapseModalVisible}
        onCancel={cancelRelapse}
        onConfirm={confirmRelapse}
      />

      <NotificationPermissionModal
        visible={isNotificationPromptVisible}
        onEnable={handleEnableNotifications}
        onLater={handleNotificationPromptLater}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f7' },
  mainContent: { flex: 1 },
  calendarContainer: {
    paddingVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  calendarShadowBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
});
