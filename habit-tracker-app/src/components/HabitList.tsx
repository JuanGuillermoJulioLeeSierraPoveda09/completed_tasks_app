import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useHabitsStore, getHabitsForDate as habitsForDate, isHabitDone, getQuitQuoteIndex, getQuitStreak as computeQuitStreak, type Habit } from '../../habitsStore';
import { FONTS } from '../../fonts';
import { type DragContext } from '../utils/dragLayout';
import SwipeableHabitCard from './SwipeableHabitCard';
import CompletedHabitCard from './CompletedHabitCard';
import PendingGroupList from './PendingGroupList';

const HabitList = React.memo<{
  activeDate: Date;
  activeDateKey: string;
  todayKey: string;
  activeMenuHabitId: string | null;
  isEditMode: boolean;
  dragCtx: DragContext;
  handleToggle: (habitId: string) => void;
  handleRelapse: (habitId: string) => void;
  handleLongPress: () => void;
  handleReorder: (habitId: string, toIndex: number, groupKey: string) => void;
  handleDragCancel: () => void;
  handleToggleMenu: (habitId: string) => void;
  handleStartEdit: (habitId: string) => void;
  handleDeleteHabit: (habitId: string) => void;
  handleGroupIds: (groupKey: string, ids: string[]) => void;
  openCreateForm: () => void;
}>(({
  activeDate,
  activeDateKey,
  todayKey,
  activeMenuHabitId,
  isEditMode,
  dragCtx,
  handleToggle,
  handleRelapse,
  handleLongPress,
  handleReorder,
  handleDragCancel,
  handleToggleMenu,
  handleStartEdit,
  handleDeleteHabit,
  handleGroupIds,
  openCreateForm,
}) => {
  const { t } = useTranslation();
  const habits = useHabitsStore((s) => s.habits);
  const habitLogs = useHabitsStore((s) => s.habitLogs);
  const relapseLogs = useHabitsStore((s) => s.relapseLogs);
  const uncheckedLogs = useHabitsStore((s) => s.uncheckedLogs);
  const QUIT_QUOTES_KEYS = useMemo(() => [
    t('youCanDoItSoldier'),
    t('stayStrongOneDayAtATime'),
    t('focusOnYourProgressNotOnPerfection'),
    t('everySecondIsAVictory'),
    t('youAreStrongerThanYourUrges'),
    t('keepGoingYoureDoingGreat')
  ], [t]);
  const visibleHabits = useMemo(() => habitsForDate(habits, activeDate), [habits, activeDate]);
  const getQuitStreak = (habit: Habit) => computeQuitStreak(habit, habitLogs, relapseLogs, uncheckedLogs, activeDate);

  const getDisplayDescription = (habit: Habit) => {
    const quoteIndex = getQuitQuoteIndex(habit, activeDateKey);
    return quoteIndex === null ? habit.description : QUIT_QUOTES_KEYS[quoteIndex];
  };

  return (
    <View style={styles.habitsSection}>
      {isEditMode && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.editModeOverlay} />
      )}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('yourHabits')}</Text>
      </View>

      {visibleHabits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('youDontHaveAnyHabitsYet')}</Text>
          <Text style={styles.emptySubtext}>{t('createOneToStartTracking')}</Text>
        </View>
      ) : (
        (() => {
          const isHabitCompleted = (h: Habit) =>
            isHabitDone(h, activeDateKey, habitLogs, relapseLogs, uncheckedLogs, todayKey);
          const relapsedIds = relapseLogs[activeDateKey] || [];
          const sortedHabits = [...visibleHabits].sort((a, b) => (a.order || 0) - (b.order || 0));
          const relapsedHabits = sortedHabits.filter(h => relapsedIds.includes(h.id));
          const activeHabits = sortedHabits.filter(h => !relapsedIds.includes(h.id));
          const renderGroup = (title: string | null, groupHabits: Habit[]) => {
            if (groupHabits.length === 0) return null;
            const pending = groupHabits.filter(h => !isHabitCompleted(h));
            const completed = groupHabits.filter(h => isHabitCompleted(h));
            const hasActiveMenu = groupHabits.some(h => h.id === activeMenuHabitId);
            const pendingHasMenu = pending.some(h => h.id === activeMenuHabitId);
            const completedHasMenu = completed.some(h => h.id === activeMenuHabitId);

            return (
              <Animated.View
                key={title || 'no-time'}
                style={hasActiveMenu ? { zIndex: 100, elevation: 3 } : { zIndex: 10, elevation: 1 }}
              >
                {title && <Text style={styles.timeOfDayHeader}>{title}</Text>}
                {pending.length > 0 && (
                  <PendingGroupList
                    groupKey={title || 'no-time'}
                    ids={pending.map(h => h.id)}
                    version={habits}
                    raised={pendingHasMenu}
                    drag={dragCtx}
                    onIdsChange={handleGroupIds}
                  >
                    {pending.map((habit, index) => (
                      <SwipeableHabitCard
                        key={`pending-${habit.id}`}
                        habit={habit}
                        isCompleted={false}
                        isFailed={false}
                        onToggle={handleToggle}
                        onRelapse={handleRelapse}
                        displayDescription={getDisplayDescription(habit)}
                        streak={habit.type === 'Quit a habit' ? getQuitStreak(habit) : undefined}
                        isEditMode={isEditMode}
                        onLongPress={handleLongPress}
                        onReorder={handleReorder}
                        onDragCancel={handleDragCancel}
                        isMenuOpen={activeMenuHabitId === habit.id}
                        onToggleMenu={handleToggleMenu}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteHabit}
                        index={index}
                        positioned
                        groupKey={title || 'no-time'}
                        drag={dragCtx}
                      />
                    ))}
                  </PendingGroupList>
                )}

                {completed.length > 0 && (
                  <View style={{ marginTop: pending.length > 0 ? 10 : 0, zIndex: completedHasMenu ? 6 : 0 }}>
                    {completed.map((habit) => (
                      <TouchableOpacity
                        key={`completed-${habit.id}`}
                        onPress={() => handleToggle(habit.id)}
                        activeOpacity={0.8}
                        style={{ zIndex: activeMenuHabitId === habit.id ? 10 : 0 }}
                      >
                        <CompletedHabitCard
                          habit={habit}
                          displayDescription={getDisplayDescription(habit)}
                          streak={habit.type === 'Quit a habit' ? getQuitStreak(habit) : undefined}
                          isMenuOpen={activeMenuHabitId === habit.id}
                          onToggleMenu={handleToggleMenu}
                          onEdit={handleStartEdit}
                          onDelete={handleDeleteHabit}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Animated.View>
            );
          };

          const noTimeHabits = activeHabits.filter(h => !h.timeOfDay || h.type === 'Quit a habit');
          const morningHabits = activeHabits.filter(h => h.timeOfDay === 'Morning' && h.type !== 'Quit a habit');
          const afternoonHabits = activeHabits.filter(h => h.timeOfDay === 'Afternoon' && h.type !== 'Quit a habit');
          const eveningHabits = activeHabits.filter(h => h.timeOfDay === 'Evening' && h.type !== 'Quit a habit');

          return (
            <View>
              {relapsedHabits.map((relapsedHabit) => (
                <SwipeableHabitCard
                  key={`relapsed-${relapsedHabit.id}`}
                  habit={relapsedHabit}
                  isCompleted={false}
                  isFailed={true}
                  onToggle={handleToggle}
                  displayDescription={getDisplayDescription(relapsedHabit)}
                  drag={dragCtx}
                />
              ))}
              {renderGroup(null, noTimeHabits)}
              {renderGroup(t('morning') || 'Mañana', morningHabits)}
              {renderGroup(t('afternoon') || 'Tarde', afternoonHabits)}
              {renderGroup(t('evening') || 'Noche', eveningHabits)}
            </View>
          );
        })()
      )}
      <TouchableOpacity style={styles.createHabitButton} onPress={openCreateForm}>
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  habitsSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#1F2937', marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editModeOverlay: {
    position: 'absolute',
    top: -2000,
    bottom: -2000,
    left: -1000,
    right: -1000,
    //backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 0,
    elevation: 0
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  emptyText: { color: '#4B5563', fontFamily: FONTS.semiBold, fontSize: 14 },
  emptySubtext: { color: '#9CA3AF', fontSize: 12, fontFamily: FONTS.regular, marginTop: 4 },
  createHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 22,
    backgroundColor: '#00B763',
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  timeOfDayHeader: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 10
  },
});

export default HabitList;
