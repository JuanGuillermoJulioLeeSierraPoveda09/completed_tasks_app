import React, { useState, useEffect, useMemo, use } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  ImageBackgroundComponent,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons, Feather} from '@expo/vector-icons';

interface Habit{
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

type HabitLogs = Record<string, string[]>;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const AVAILABLE_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#3B82F6',
  '#84CC16', '#14B8A6', '#6366F1', '#D97706',
];

const AVAILABLE_ICONS = [
  'fitness-outline', 'book-outline', 'water-outline', 'walk-outline',
  'barbell-outline', 'code-slash-outline', 'restaurant-outline', 'bed-outline',
  'leaf-outline', 'heart-outline', 'bicycle-outline', 'musical-notes-outline',
];

const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const formatDateKey = (date: Date) =>{
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App(){
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(new Date().getDay());
  const [headerDateText, setHeaderDateText] = useState<string>('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLogs>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStreaksModalVisible, setIsStreaksModalVisible] = useState(false);
  const [habitType, setHabitType] = useState<'Build a habit' | 'Quit a habit' | 'Task'>('Build a habit');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(() => getRandomItem(AVAILABLE_ICONS)); 
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(() => getRandomItem(AVAILABLE_COLORS));
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const handleHeaderDatePress = () =>{
    const today = new Date();
    const todayStr = formatDateKey(today);
    const activeStr = formatDateKey(activeDate);
    if (activeStr !== todayStr){
      setWeekOffset(0);
      setSelectedDayIndex(today.getDay());
    } else{
      setIsStreaksModalVisible(true);
    }
  };

  const activeDate = useMemo(() =>{
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek + weekOffset *7);

    const selectedDate = new Date(startOfWeek);
    selectedDate.setDate(startOfWeek.getDate() + selectedDayIndex);
    return selectedDate;
  }, [weekOffset, selectedDayIndex]);
  const activeDateKey = useMemo(() => formatDateKey(activeDate), [activeDate]);

  useEffect(() =>{
    const todayStr = formatDateKey(new Date());
    const activeStr = formatDateKey(activeDate);
    const isToday = todayStr === activeStr;

    const dayName = activeDate.toLocaleDateString('en-US', {weekday: 'short'});
    const monthName = activeDate.toLocaleDateString('en-US', {month: 'short'});
    const dayNum = activeDate.getDate();

    setHeaderDateText(`${isToday ? 'Today, ' : ''}${dayName} ${monthName} ${dayNum}`);
  }, [activeDate]);

  const toggleHabitCompletion = (habitId: string) =>{
    setHabitLogs((prevLogs) => {
      const currentCompleted = prevLogs[activeDateKey] || [];
      const exists = currentCompleted.includes(habitId);
      const updated = exists
        ? currentCompleted.filter((id) => id !== habitId)
        : [...currentCompleted, habitId];
      return {
        ...prevLogs,
        [activeDateKey]: updated,
      };
    });
  };

  const handleCreateHabit = () => {
    if (!newTitle.trim()) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      icon: selectedIcon,
      color: selectedColor,
    };

    setHabits([...habits, newHabit]);
    resetForm();
    setIsModalVisible(false);
  };

  const resetForm = () =>{
    setNewTitle('');
    setNewDescription('');
    setSelectedIcon(getRandomItem(AVAILABLE_ICONS));
    setSelectedColor(getRandomItem(AVAILABLE_COLORS));
    setHabitType('Build a habit');
    setIsDropdownOpen(false);
};

  const flatListRef = React.useRef<FlatList>(null);
  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / (SCREEN_WIDTH - 32));

    if (pageIndex === 0) {
      setWeekOffset((prev) => prev - 1);
      flatListRef.current?.scrollToIndex({ index: 1, animated: false });
    } else if (pageIndex === 2) {
      setWeekOffset((prev) => prev + 1);
      flatListRef.current?.scrollToIndex({ index: 1, animated: false });
    }
  };

  const streakStats = useMemo(() => {
    if (habits.length === 0) {
      return { loggedCurrent: 0, loggedBest: 0, perfectCurrent: 0, perfectBest: 0 };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalHabits = habits.length;
    const todayKey = formatDateKey(today);
    const todayCompletedCount = (habitLogs[todayKey] || []).length;
    const isTodayPerfect = todayCompletedCount >= totalHabits;

    let countPerfect = 0;
    let checkDate = new Date(today);

    if (isTodayPerfect) {
      countPerfect++;
    }
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const key = formatDateKey(checkDate);
      const completedCount = (habitLogs[key] || []).length;

      if (completedCount >= totalHabits) {
        countPerfect++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    let countLogged = 0;
    checkDate = new Date(today);
    const isTodayLogged = todayCompletedCount > 0;

    if (isTodayLogged) {
      countLogged++;
    }
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const key = formatDateKey(checkDate);
      const completedCount = (habitLogs[key] || []).length;

      if (completedCount > 0) {
        countLogged++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    let loggedBest = 0;
    let perfectBest = 0;
    let tempLogged = 0;
    let tempPerfect = 0;
    const historicDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const key = formatDateKey(historicDate);
      const completedCount = (habitLogs[key] || []).length;

      if (completedCount > 0) {
        tempLogged++;
        if (tempLogged > loggedBest) loggedBest = tempLogged;
      } else {
        tempLogged = 0;
      }
      if (completedCount >= totalHabits) {
        tempPerfect++;
        if (tempPerfect > perfectBest) perfectBest = tempPerfect;
      } else {
        tempPerfect = 0;
      }
      historicDate.setDate(historicDate.getDate() - 1);
    }
    return {
      loggedCurrent: countLogged,
      loggedBest,
      perfectCurrent: countPerfect,
      perfectBest
    };
  }, [habitLogs, habits]);

  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const days = [];

    for (let i = startingDayOfWeek; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      days.push({ date, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    return days;
  }, [currentCalendarDate]);

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentCalendarDate(newDate);
  };

  const handleSelectedCalendarDay = (targetDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - today.getDay());
    const startOfTargetWeek = new Date(target);
    startOfTargetWeek.setDate(target.getDate() - target.getDay());
    const diffInDays = Math.round(
      (startOfTargetWeek.getTime() - startOfCurrentWeek.getTime()) / (1000 * 3600 * 24)
    );
    const computedWeekOffset = Math.round(diffInDays / 7);

    setSelectedDayIndex(target.getDay());
    setWeekOffset(computedWeekOffset);
    setIsStreaksModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f7" />

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.dateSelector} onPress={handleHeaderDatePress}>
          <Text style={styles.dateText}>{headerDateText}</Text>
          <Ionicons name="chevron-down" size={18} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.streakBadge} onPress={() => setIsStreaksModalVisible(true)}>
            {(() => {
              const todayStr = formatDateKey(new Date());
              const todayLogs = habitLogs[todayStr] || [];
              const isTodayCompleted = habits.length > 0 && todayLogs.length >= habits.length;
              const flameColor = isTodayCompleted ? '#F59E0B' : '#9CA3AF';

              return (
                <>
                  <Ionicons name="flame" size={22} color={flameColor} />
                  <Text style={styles.streakText}>{streakStats.perfectCurrent}</Text>
                </>
              );
            })()}
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarShadowBox}>
          <View style={styles.calendarContainer}>
            <View style={styles.fixedHeaderRow}>
              {WEEK_DAYS.map((day, idx) => {
                const isSelected = idx === selectedDayIndex;
                return (
                  <TouchableOpacity key={idx} style={styles.dayHeaderCell} onPress={() => setSelectedDayIndex(idx)}>
                    <View style={[styles.letterCircle, isSelected && styles.letterCircleSelected]}>
                      <Text style={[styles.fixedDayText, isSelected && styles.fixedDayTextSelected]}>
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FlatList
              ref={flatListRef}
              data={[-1, 0, 1]}
              horizontal
              pagingEnabled={false}
              snapToInterval={SCREEN_WIDTH - 32}
              snapToAlignment="center"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={1}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH - 32,
                offset: (SCREEN_WIDTH - 32) * index,
                index,
              })}
              onMomentumScrollEnd={handleScrollEnd}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => {
                const targetOffset = weekOffset + item;
                const today = new Date();
                const todayStr = formatDateKey(today);
                const currentDayOfWeek = today.getDay();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - currentDayOfWeek + targetOffset * 7);

                const days = Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(startOfWeek);
                  d.setDate(startOfWeek.getDate() + i);
                  return { date: d.getDate(), fullDate: d };
                });

                return (
                  <View style={[styles.weekRow, { width: SCREEN_WIDTH - 32 }]}>
                    {days.map((dayItem, index) => {
                      const dateKey = formatDateKey(dayItem.fullDate);
                      const isToday = dateKey === todayStr;
                      const completedList = habitLogs[dateKey] || [];
                      const count = completedList.length;
                      let dotColor = '#D1D5DB';

                      if (count > 0) {
                        dotColor = habits.length > 0 && count >= habits.length ? '#10B981' : '#F59E0B';
                      }
                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.dayCard}
                          onPress={() => setSelectedDayIndex(index)}
                        >
                          <Text style={[styles.dateNumber, isToday && styles.dateNumberToday]}>
                            {dayItem.date}
                          </Text>
                          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              }}
            />
          </View>
        </View>

        <View style={styles.habitsSection}>
          <Text style={styles.sectionTitle}>Your Habits</Text>
          {habits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You don't have any habits yet</Text>
              <Text style={styles.emptySubtext}>Create one to start tracking</Text>
            </View>
          ) : (
            habits.map((habit) => {
              const isCompleted = (habitLogs[activeDateKey] || []).includes(habit.id);
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitCard, isCompleted && styles.habitCardCompleted]}
                  onPress={() => toggleHabitCompletion(habit.id)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: habit.color + '20' }]}>
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : (habit.icon as any)}
                      size={24}
                      color={isCompleted ? '#10B981' : habit.color}
                    />
                  </View>

                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]}>
                      {habit.title}
                    </Text>
                    <Text style={styles.habitDescription}>{habit.description}</Text>
                  </View>

                  <TouchableOpacity style={styles.optionsButton}>
                    <Feather name="more-vertical" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
          <TouchableOpacity style={styles.createHabitButton} onPress={() => setIsModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={22} color="#4F46E5" />
            <Text style={styles.createHabitText}>Create a new habit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Bar & Modals stay unchanged */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="grid-outline" size={22} color="#4F46E5" />
          <Text style={[styles.bottomTabText, { color: '#4F46E5' }]}>Menú</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTab} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add-circle" size={22} color="#6B7280" />
          <Text style={styles.bottomTabText}>New Habit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="bar-chart-outline" size={22} color="#6B7280" />
          <Text style={styles.bottomTabText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="person-outline" size={22} color="#6B7280" />
          <Text style={styles.bottomTabText}>Me</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.createHabitModalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>
          <View style={styles.createHabitHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={26} color="#1F2937"/>
            </TouchableOpacity>

            <View style={styles.dropdownWrapper}>
              <TouchableOpacity style={styles.dropdownSelector} onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
                <Text style={styles.dropdownTitle}>{habitType}</Text>
                <Ionicons
                  name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#1F2937"
                />
              </TouchableOpacity>

              {isDropdownOpen &&(
                <View style={styles.dropdownMenu}>
                  {(['Build a habit', 'Quit a habit', 'Task'] as const).map((type) => (
                    <TouchableOpacity 
                      key={type} 
                      style={styles.dropdownOption} 
                      onPress={() => {
                        setHabitType(type);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownOptionText, habitType === type && styles.dropdownOptionSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={{width: 26}}/>
          </View>

          <ScrollView style={styles.createHabitBody} showsVerticalScrollIndicator={false}>
            <View style={styles.iconSelectionSection}>
              <View style={[styles.iconBoxBackground, {backgroundColor: selectedColor + '15'}]}>
                <TouchableOpacity
                  style={[styles.iconCircleButton, {backgroundColor: selectedColor}]}
                  onPress={() => setIsIconPickerOpen(true)}
                >
                  <Ionicons name={selectedIcon as any} size={28} color="#FFFFFF"/>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>New habit</Text>
              <TextInput
                style={styles.formInput}
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.formInput}
                value={newDescription}
                onChangeText={setNewDescription}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {AVAILABLE_COLORS.map((color) =>{
                  const isSelected = selectedColor === color;
                  return(
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorOption, {backgroundColor: color}, isSelected && styles.colorOptionSelected]}
                      onPress ={() => setSelectedColor(color)}
                    >
                      {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF"/>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.createHabitFooter}>
            <TouchableOpacity style={[styles.saveHabitButton, {backgroundColor: selectedColor}]} onPress={handleCreateHabit}>
              <Text style={styles.saveButtonText}>Save Habit</Text>
            </TouchableOpacity>
          </View>

          
        <Modal visible={isIconPickerOpen} transparent={true} animationType="fade">
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Choose an Icon</Text>
                <View style={styles.iconGrid}>
                  {AVAILABLE_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={styles.iconPickerItem}
                      onPress={() => {
                        setSelectedIcon(icon);
                        setIsIconPickerOpen(false);
                      }}
                    >
                      <Ionicons name={icon as any} size={28} color="#1F2937" />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.closePickerButton}
                  onPress={() => setIsIconPickerOpen(false)}
                >
                  <Text style={styles.closePickerText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </Modal>

      <Modal visible={isStreaksModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.streaksContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#121212" />
          <View style={styles.streaksHeader}>
            <TouchableOpacity onPress={() => setIsStreaksModalVisible(false)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.streaksTitle}>My Streaks</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.streaksRow}>
              <View style={styles.streakCard}>
                <Ionicons name="flame" size={56} color="#F59E0B" />
                <Text style={styles.streakLabel}>Logged Days</Text>
                <Text style={[styles.streakNumber, { color: '#F59E0B' }]}>{streakStats.loggedCurrent}</Text>
                <Text style={styles.streakSubtext}>current streak</Text>
                <View style={styles.bestBadge}>
                  <Ionicons name="trophy-outline" size={16} color="#F59E0B" />
                  <Text style={styles.bestText}>Best: {streakStats.loggedBest}</Text>
                </View>
              </View>
              <View style={styles.streakCard}>
                <Ionicons name="flame" size={56} color="#10B981" />
                <Text style={styles.streakLabel}>Perfect Days</Text>
                <Text style={[styles.streakNumber, { color: '#10B981' }]}>{streakStats.perfectCurrent}</Text>
                <Text style={styles.streakSubtext}>current streak</Text>
                <View style={styles.bestBadge}>
                  <Ionicons name="trophy-outline" size={16} color="#10B981" />
                  <Text style={styles.bestText}>Best: {streakStats.perfectBest}</Text>
                </View>
              </View>
            </View>

            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth('prev')}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {currentCalendarDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth('next')}>
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysHeader}>
              {WEEK_DAYS.map((day, idx) => (
                <Text key={idx} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((item, index) => {
                const dateKey = formatDateKey(item.date);
                const todayStr = formatDateKey(new Date());
                const isToday = dateKey === todayStr;
                const completedList = habitLogs[dateKey] || [];
                const count = completedList.length;

                let dotColor = '#374151';
                if (count > 0) {
                  dotColor = habits.length > 0 && count >= habits.length ? '#10B981' : '#F59E0B';
                }
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.calendarCell}
                    onPress={() => handleSelectedCalendarDay(item.date)}
                  >
                    <Text style={[styles.calendarDayNum, !item.isCurrentMonth && { color: '#4B5563' }, isToday && styles.calendarDayNumToday]}>
                      {item.date.getDate()}
                    </Text>
                    <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f7' },
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
  dateText: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
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
  streakText: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  settingsButton: { padding: 4 },
  mainContent: { flex: 1 },
  calendarContainer: {
    paddingVertical: 12,
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
  fixedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: (SCREEN_WIDTH - 64) / 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircleSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderRadius: 14,
    borderColor: '#4f46e5',
  },
  fixedDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  fixedDayTextSelected: {
    color: '#4F46E5',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayCard: {
    width: (SCREEN_WIDTH - 64) / 7,
    height: 36,
    //borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2837',
  },
  dateNumberToday: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  dayCardSelected: { backgroundColor: '#4F46E5' },
  dateNumberSelected: { color: '#FFFFFF' },
  habitsSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  emptyText: { color: '#4B5563', fontWeight: '600', fontSize: 14 },
  emptySubtext: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  habitCardCompleted: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: { flex: 1, marginLeft: 12 },
  habitTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  habitTitleCompleted: { textDecorationLine: 'line-through', color: '#6B7280' },
  habitDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  optionsButton: { padding: 6 },
  createHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  createHabitText: { color: '#4F46E5', fontWeight: '600', fontSize: 15 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomTab: { alignItems: 'center' },
  bottomTabText: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1F2937' },
  modalSubtitle: { fontSize: 14, fontWeight: '700', marginBottom: 10, color: '#3b3b3b' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5D8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelButton: { backgroundColor: '#F3F4F6' },
  cancelButtonText: { color: '#4B5563', fontWeight: '600' },
  saveButton: { backgroundColor: '#4F46E5' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },

  createHabitModalContainer:{
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  createHabitHeader:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10,
  },
  closeButton:{
    padding: 4,
  },
  dropdownWrapper:{
    position: 'relative',
    alignItems: 'center',
  },
  dropdownSelector:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dropdownTitle:{
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  dropdownMenu:{
    position: 'absolute',
    top: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    width: 150,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dropdownOption:{
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownOptionText:{
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  dropdownOptionSelected:{
    color: '#4F46E5',
    fontWeight: '700',
  },
  createHabitBody:{
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  iconSelectionSection:{
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  iconBoxBackground:{
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleButton:{
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup:{
    marginBottom: 24,
  },
  fieldLabel:{
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput:{
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  colorGrid:{
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  colorOption:{
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected:{
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  createHabitFooter:{
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveHabitButton:{
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveHabitButtonText:{
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  pickerOverlay:{
    flex:1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard:{
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  pickerTitle:{
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  iconGrid:{
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
    marginBottom: 16,
  },
  iconPickerItem:{
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  closePickerButton:{
    paddingVertical: 12,
    alignItems: 'center',
  },
  closePickerText:{
    color: '#6B7280',
    fontWeight: '600',
  },

  streaksContainer: { flex: 1, backgroundColor: '#121212' },
  streaksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  streaksTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  streaksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  streakCard: { alignItems: 'center', flex: 1 },
  streakLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginTop: 8 },
  streakNumber: { fontSize: 36, fontWeight: '800', marginVertical: 2 },
  streakSubtext: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  bestBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bestText: { color: '#E5E7EB', fontWeight: '600', fontSize: 14 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginVertical: 16 },
  calendarMonthText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  weekDaysHeader: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 12 },
  weekDayText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 },
  calendarCell: { width: '14.28%', alignItems: 'center', paddingVertical: 8 },
  calendarDayNum: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  calendarDayNumToday: { color: '#4F46E5', fontSize: 16, fontWeight: '600' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
});