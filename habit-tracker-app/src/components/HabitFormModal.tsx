import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Modal, TextInput, Dimensions, Switch, Platform, LayoutAnimation, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { formatDateKey, parseDateKey, type Habit, type HabitDraft, type HabitType } from '../../habitsStore';
import { requestNotificationPermission, openNotificationSettings } from '../../notifications';
import { FONTS } from '../../fonts';
import { AVAILABLE_COLORS, COLOR_ROWS, ICON_CATEGORIES } from '../constants/habitOptions';
import { type FrequencyType, everyWeekDay, formatMonthDaysDisplay, describeWeekDays } from '../utils/frequency';
import CustomTimePickerModal from './CustomTimePickerModal';
import { toLocaleTag } from '../utils/locale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

interface HabitFormState {
  type: HabitType;
  icon: string;
  color: string;
  title: string;
  description: string;
  frequencyType: FrequencyType;
  weekDays: boolean[];
  monthDays: number[];
  frequencyDisplay: string;
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening';
  taskDate: Date;
  reminderEnabled: boolean;
  reminderHour: string;
  reminderMinute: string;
  reminderPeriod: 'AM' | 'PM';
}

const makeInitialForm = (habit: Habit | undefined, everyday: string): HabitFormState => {
  if (!habit) {
    return {
      type: 'Build a habit',
      icon: getRandomItem(ICON_CATEGORIES.All),
      color: getRandomItem(AVAILABLE_COLORS),
      title: '',
      description: '',
      frequencyType: 'days_of_week',
      weekDays: everyWeekDay(),
      monthDays: [],
      frequencyDisplay: everyday,
      timeOfDay: undefined,
      taskDate: new Date(),
      reminderEnabled: false,
      reminderHour: '05',
      reminderMinute: '00',
      reminderPeriod: 'AM',
    };
  }
  return {
    type: habit.type || 'Build a habit',
    icon: habit.icon,
    color: habit.color,
    title: habit.title,
    description: habit.description || '',
    frequencyType: !habit.selectedWeekDays && habit.selectedMonthDays ? 'days_of_month' : 'days_of_week',
    weekDays: habit.selectedWeekDays ? [...habit.selectedWeekDays] : everyWeekDay(),
    monthDays: habit.selectedMonthDays ? [...habit.selectedMonthDays] : [],
    frequencyDisplay: habit.frequency || everyday,
    timeOfDay: habit.timeOfDay,
    taskDate: habit.targetDate ? parseDateKey(habit.targetDate) : new Date(),
    reminderEnabled: !!habit.reminder,
    reminderHour: habit.reminder ? habit.reminder.hour : '05',
    reminderMinute: habit.reminder ? habit.reminder.minute : '00',
    reminderPeriod: habit.reminder ? habit.reminder.period : 'AM',
  };
};

const buildDraft = (form: HabitFormState, everyday: string): HabitDraft => {
  const isQuit = form.type === 'Quit a habit';
  const isTask = form.type === 'Task';
  return {
    title: form.title,
    description: isQuit ? '' : form.description,
    icon: form.icon,
    color: form.color,
    type: form.type,
    frequency: isQuit ? everyday : form.frequencyDisplay,
    selectedWeekDays: isQuit ? everyWeekDay() : form.frequencyType === 'days_of_week' ? [...form.weekDays] : undefined,
    selectedMonthDays: isQuit ? undefined : form.frequencyType === 'days_of_month' ? [...form.monthDays] : undefined,
    targetDate: isTask ? formatDateKey(form.taskDate) : undefined,
    timeOfDay: isQuit ? undefined : form.timeOfDay,
    reminder: form.reminderEnabled
      ? { hour: form.reminderHour, minute: form.reminderMinute, period: form.reminderPeriod }
      : undefined,
  };
};

const HabitFormBody: React.FC<{
  habit?: Habit;
  onClose: () => void;
  onSave: (draft: HabitDraft) => void;
}> = ({ habit, onClose, onSave }) => {
  const { t, i18n } = useTranslation();
  const currentLocale = toLocaleTag(i18n.language);
  const WEEK_DAYS = useMemo(() => [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')], [t]);

  const [form, setForm] = useState<HabitFormState>(() => makeInitialForm(habit, t('everyday')));
  const patch = (changes: Partial<HabitFormState>) => setForm((f) => ({ ...f, ...changes }));
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [activeIconCategory, setActiveIconCategory] = useState<keyof typeof ICON_CATEGORIES>('All');
  const [isFrequencyModalOpen, setIsFrequencyModalOpen] = useState(false);
  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const toggleSwitch = async () => {
    const turningOn = !form.reminderEnabled;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setForm((f) => ({ ...f, reminderEnabled: !f.reminderEnabled }));
    if (!turningOn) return;
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(t('reminderBlockedTitle'), t('remindersBlockedBody'), [
        { text: t('notNow'), style: 'cancel' },
        { text: t('openSettings'), onPress: openNotificationSettings },
      ]);
    }
  };

  const handleReminderSaveTime = (hour: string, minute: string, period: 'AM' | 'PM') => {
    patch({ reminderHour: hour, reminderMinute: minute, reminderPeriod: period });
    setIsReminderPickerVisible(false);
  };

  const toggleWeekDaySelection = (index: number) => {
    setForm((f) => {
      const weekDays = [...f.weekDays];
      weekDays[index] = !weekDays[index];
      return { ...f, weekDays, frequencyDisplay: describeWeekDays(weekDays, t) };
    });
  };

  const toggleMonthDaySelection = (day: number) => {
    setForm((f) => {
      const monthDays = f.monthDays.includes(day) ? f.monthDays.filter((d) => d !== day) : [...f.monthDays, day];
      return { ...f, monthDays, frequencyDisplay: formatMonthDaysDisplay(monthDays, t) };
    });
  };

  const handleCloseFrequencyModal = () => {
    if (form.frequencyType === 'days_of_week') {
      if (form.weekDays.filter(Boolean).length === 0) return;
    } else if (form.frequencyType === 'days_of_month') {
      if (form.monthDays.length === 0) return;
    }
    setIsFrequencyModalOpen(false);
  };

  const handleTaskDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setIsDatePickerVisible(false);
    if (selectedDate) patch({ taskDate: selectedDate });
  };

  const handleTaskDateDismiss = () => {
    setIsDatePickerVisible(false);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(buildDraft(form, t('everyday')));
  };

  return (
    <>
      <SafeAreaView style={styles.createHabitModalContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.createHabitHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={26} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownTitle}>{t(form.type)}</Text>
          </View>

          <View style={{ width: 26 }} />
        </View>

        <ScrollView style={styles.createHabitBody} showsVerticalScrollIndicator={false}>
          <View style={styles.iconSelectionSection}>
            <View style={[styles.iconBoxBackground, { backgroundColor: form.color + '15' }]}>
              <TouchableOpacity
                style={[styles.iconCircleButton, { backgroundColor: form.color }]}
                onPress={() => setIsIconPickerOpen(true)}
              >
                <Ionicons name={form.icon as any} size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.typeSelectorContainer}>
            {(['Build a habit', 'Quit a habit', 'Task'] as const).map((type) => {
              const isSelected = form.type === type;
              const displayLabel = type === 'Build a habit' ? t('build') : type === 'Quit a habit' ? t('quit') : t('task');

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeSelectorButton,
                    isSelected && styles.typeSelectorButtonSelected
                  ]}
                  onPress={() => patch({ type })}
                >
                  <Text style={[styles.typeSelectorText, isSelected && { color: form.color }]}>
                    {displayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>
              {form.type === 'Task' ? t('taskName') : t('newHabit')}
            </Text>
            <TextInput
              style={styles.formInput}
              value={form.title}
              onChangeText={(v) => patch({ title: v })}
            />
          </View>

          {form.type !== 'Quit a habit' && (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>{t('description')}</Text>
              <TextInput
                style={styles.formInput}
                value={form.description}
                onChangeText={(v) => patch({ description: v })}
                multiline={true}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>{t('color')}</Text>
            <View style={styles.colorGrid}>
              {COLOR_ROWS.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.colorRow}>
                  {row.map((color) => {
                    const isSelected = form.color === color;
                    return (
                      <TouchableOpacity
                        key={`${color}-${isSelected}`}
                        style={[styles.colorOption, { backgroundColor: color }, isSelected && styles.colorOptionSelected]}
                        onPress={() => patch({ color })}
                      >
                        {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {form.type !== 'Task' && (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>{t('frequency')}</Text>
              {form.type === 'Quit a habit' ? (
                <TouchableOpacity style={[styles.frequencyInputSelector, { backgroundColor: '#E5E7EB' }]}>
                  <Text style={styles.frequencyValueText}>{t('everyday')}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.frequencyInputSelector} onPress={() => setIsFrequencyModalOpen(true)}>
                  <Text style={styles.frequencyValueText}>{form.frequencyDisplay}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {form.type !== 'Quit a habit' && (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>{t('timeOfDay')}</Text>
              <View style={styles.timeOfDayContainer}>
                {(['Morning', 'Afternoon', 'Evening'] as const).map((time) => {
                  const isSelected = form.timeOfDay === time;
                  const displayTime = time === 'Morning' ? (t('morning')) :
                    time === 'Afternoon' ? (t('afternoon')) :
                      (t('evening'));
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOfDayButton,
                        isSelected && { backgroundColor: form.color, borderColor: form.color }
                      ]}
                      onPress={() => patch({ timeOfDay: isSelected ? undefined : time })}
                    >
                      <Text style={[styles.timeOfDayText, isSelected && { color: '#FFFFFF' }]}>
                        {displayTime}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {form.type === 'Task' && (
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>{t('when')}</Text>
              <TouchableOpacity
                style={styles.frequencyInputSelector}
                onPress={() => setIsDatePickerVisible(true)}
              >
                <Text style={styles.frequencyValueText}>
                  {t('doItOn')}: {form.taskDate.toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {isDatePickerVisible && (
                <DateTimePicker
                  value={form.taskDate}
                  mode="date"
                  display="default"
                  onValueChange={handleTaskDateChange}
                  onDismiss={handleTaskDateDismiss}
                />
              )}
              {Platform.OS === 'ios' && isDatePickerVisible && (
                <TouchableOpacity
                  style={{ marginTop: 8, alignItems: 'flex-end', paddingRight: 10 }}
                  onPress={() => setIsDatePickerVisible(false)}
                >
                  <Text style={{ color: form.color, fontFamily: FONTS.semiBold }}>{t('done')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>{t('reminder')}</Text>
            <View style={styles.reminderCardContainer}>
              <View style={styles.reminderHeaderRow}>
                <Text style={styles.frequencyValueText}>{t('reminder')}</Text>
                <Switch
                  trackColor={{ false: '#767577', true: form.color + '10' }}
                  thumbColor={form.reminderEnabled ? form.color : '#F4F3F4'}
                  ios_backgroundColor="#3E3E3E"
                  onValueChange={toggleSwitch}
                  value={form.reminderEnabled}
                />
              </View>

              {form.reminderEnabled && (
                <Animated.View
                  entering={FadeInUp.duration(200)}
                  style={styles.reminderExpandedContent}>
                  <View style={styles.reminderDivider} />
                  <TouchableOpacity style={styles.reminderTimeButton} onPress={() => setIsReminderPickerVisible(true)}>
                    <Text style={styles.reminderTimeButtonText}>
                      {`${form.reminderHour}:${form.reminderMinute} ${form.reminderPeriod}`}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
              <CustomTimePickerModal
                visible={isReminderPickerVisible}
                reminderSelectedHour={form.reminderHour}
                reminderSelectedMinute={form.reminderMinute}
                reminderSelectedPeriod={form.reminderPeriod}
                onConfirm={(h, m, p) => handleReminderSaveTime(h, m, p)}
                onClose={() => setIsReminderPickerVisible(false)}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.createHabitFooter}>
          <TouchableOpacity style={[styles.saveHabitButton, { backgroundColor: form.color }]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('saveHabit')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={isIconPickerOpen} transparent={false} animationType="slide" statusBarTranslucent={true}>
        <SafeAreaView style={styles.fullscreenModalContainer}>
          <View style={styles.fullscreenModalHeader}>
            <TouchableOpacity onPress={() => setIsIconPickerOpen(false)}>
              <Ionicons name="close" size={26} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.fullscreenModalTitle}>{t('selectIcon')}</Text>
            <TouchableOpacity onPress={() => setIsIconPickerOpen(false)}>
              <Text style={styles.headerDoneText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryNavbar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryNavContent}>
              {(Object.keys(ICON_CATEGORIES) as Array<keyof typeof ICON_CATEGORIES>).map((cat) => {
                const isActive = activeIconCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                    onPress={() => setActiveIconCategory(cat)}
                  >
                    <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView style={styles.iconScrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.iconCategoryGrid}>
              {ICON_CATEGORIES[activeIconCategory].map((iconName) => {
                const isSelected = form.icon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconTile,
                      isSelected && { borderColor: form.color, backgroundColor: form.color + '15' }]}
                    onPress={() => {
                      patch({ icon: iconName })
                    }}
                  >
                    <Ionicons name={iconName as any} size={30} color={isSelected ? form.color : '#374151'} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={isFrequencyModalOpen} animationType="slide" transparent={false} statusBarTranslucent={true}>
        <SafeAreaView style={styles.fullscreenModalContainer}>
          <View style={styles.fullscreenModalHeader}>
            <TouchableOpacity
              onPress={handleCloseFrequencyModal}
            >
              <Ionicons name="close" size={26} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.fullscreenModalTitle}>{t('frequency')}</Text>
            <TouchableOpacity
              onPress={handleCloseFrequencyModal}
            >
              <Text style={styles.headerDoneText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.frequencyBody} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.frequencyOptionCard}
              onPress={() => {
                patch({ frequencyType: 'days_of_week', frequencyDisplay: describeWeekDays(form.weekDays, t) });
              }}
            >
              <View style={styles.frequencyOptionHeader}>
                <Ionicons
                  name={form.frequencyType === 'days_of_week' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={form.frequencyType === 'days_of_week' ? form.color : '#9CA3AF'}
                />
                <Text style={styles.frequencyOptionTitle}>{t('specificDaysOfTheWeek')}</Text>
              </View>

              {form.frequencyType === 'days_of_week' && (
                <View style={styles.weekDaysPickerRow} >
                  {WEEK_DAYS.map((day, idx) => {
                    const isSelected = form.weekDays[idx];
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.weekDayCircle,
                          isSelected && { backgroundColor: form.color }
                        ]}
                        onPress={() => toggleWeekDaySelection(idx)}
                      >
                        <Text style={[styles.weekDayCircleText, isSelected && { color: '#FFFFFF' }]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.frequencyOptionCard}
              onPress={() => {
                patch({ frequencyType: 'days_of_month', frequencyDisplay: formatMonthDaysDisplay(form.monthDays, t) });
              }}
            >
              <View style={styles.frequencyOptionHeader}>
                <Ionicons
                  name={form.frequencyType === 'days_of_month' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={form.frequencyType === 'days_of_month' ? form.color : '#9CA3AF'}
                />
                <Text style={styles.frequencyOptionTitle}>{t('specificDaysOfTheMonth')}</Text>
              </View>

              {form.frequencyType === 'days_of_month' && (
                <View style={styles.monthDaysGridContainer}>
                  <View style={[styles.monthDaysRow, styles.monthDaysRowFirst]}>
                    {[1, 2, 3, 4, 5].map((day) => {
                      const isSelected = form.monthDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.monthDayCircle,
                            isSelected && { backgroundColor: form.color }
                          ]}
                          onPress={() => toggleMonthDaySelection(day)}
                        >
                          <Text style={[styles.monthDayText, isSelected && { color: '#FFFFFF' }]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {[
                    [6, 7, 8, 9, 10, 11, 12],
                    [13, 14, 15, 16, 17, 18, 19],
                    [20, 21, 22, 23, 24, 25, 26],
                  ].map((rowDays, rowIndex) => (
                    <View key={rowIndex} style={styles.monthDaysRow}>
                      {rowDays.map((day) => {
                        const isSelected = form.monthDays.includes(day);
                        return (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.monthDayCircle,
                              isSelected && { backgroundColor: form.color },
                            ]}
                            onPress={() => toggleMonthDaySelection(day)}
                          >
                            <Text style={[styles.monthDayText, isSelected && { color: '#FFFFFF' }]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                  <View style={[styles.monthDaysRow, styles.monthDaysRowEnd]}>
                    {[27, 28, 29, 30, 31].map((day) => {
                      const isSelected = form.monthDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.monthDayCircle,
                            isSelected && { backgroundColor: form.color },
                          ]}
                          onPress={() => toggleMonthDaySelection(day)}
                        >
                          <Text style={[styles.monthDayText, isSelected && { color: '#FFFFFF' }]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const HabitFormModal = React.memo<{
  visible: boolean;
  sessionKey: number;
  habit?: Habit;
  onClose: () => void;
  onSave: (draft: HabitDraft) => void;
}>(({ visible, sessionKey, habit, onClose, onSave }) => (
  <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent={true}>
    <HabitFormBody key={sessionKey} habit={habit} onClose={onClose} onSave={onSave} />
  </Modal>
));

const styles = StyleSheet.create({
  saveButtonText: { color: '#FFFFFF', fontFamily: FONTS.semiBold },
  createHabitModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  createHabitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10,
  },
  closeButton: {
    padding: 4,
  },
  dropdownWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dropdownTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: '#1F2937',
  },
  createHabitBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  iconSelectionSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBoxBackground: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  typeSelectorButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  typeSelectorButtonSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeSelectorText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#6B7280'
  },
  formGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: '#1F2937',
  },
  frequencyInputSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  frequencyValueText: { fontSize: 15, fontFamily: FONTS.semiBold, color: '#1F2937' },
  colorGrid: {
    gap: 12,
    marginTop: 4,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  timeOfDayContainer: {
    flexDirection: 'row',
    gap: 8
  },
  timeOfDayButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  timeOfDayText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#1F2937'
  },
  createHabitFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveHabitButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  fullscreenModalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  fullscreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fullscreenModalTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#1F2937' },
  headerDoneText: { fontSize: 16, fontFamily: FONTS.bold, color: '#00B763' },
  categoryNavbar: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA'
  },
  categoryNavContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB'
  },
  categoryTabActive: { backgroundColor: '#1F2937' },
  categoryTabText: { fontSize: 13, fontFamily: FONTS.semiBold, color: '#4B5563' },
  categoryTabTextActive: { color: '#FFFFFF' },
  iconScrollContainer: { flex: 1, padding: 16 },
  iconCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 25 },
  iconTile: {
    width: (SCREEN_WIDTH - 64) / 6,
    height: (SCREEN_WIDTH - 64) / 6,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  frequencyBody: { flex: 1, padding: 16 },
  frequencyOptionCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  frequencyOptionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  frequencyOptionTitle: { fontSize: 15, fontFamily: FONTS.semiBold, color: '#1F2937' },
  weekDaysPickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  weekDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayCircleText: { fontSize: 13, fontFamily: FONTS.bold, color: '#4B5563' },
  monthDaysGridContainer: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%'
  },
  monthDaysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    width: '100%'
  },
  monthDaysRowFirst: {
    justifyContent: 'flex-end',
    paddingRight: 9
  },
  monthDaysRowEnd: {
    justifyContent: 'flex-start',
    paddingLeft: 9
  },
  monthDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#4B5563'
  },
  reminderCardContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  reminderHeaderRow: {
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
    marginBottom: 16
  },
  reminderExpandedContent: {
    paddingBottom: 12,
  },
  reminderTimeButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    marginHorizontal: 45,
    borderRadius: 10,
    alignItems: 'center',
  },
  reminderTimeButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#1F2937',
  },
});

export default HabitFormModal;
