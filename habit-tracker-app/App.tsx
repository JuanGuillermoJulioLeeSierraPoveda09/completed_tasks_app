import React, { useState, useEffect, useMemo } from 'react';
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
  Switch,
  Platform,
  LayoutAnimation,
  Alert,
  Vibration,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { GestureHandlerRootView, GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import './i18n';
import * as Haptics from 'expo-haptics';
/*
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false
  }),
});
*/
interface Habit {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  frequency: string;
  selectedWeekDays?: boolean[];
  selectedMonthDays?: number[];
  type?: 'Build a habit' | 'Quit a habit' | 'Task';
  createdAt?: string;
  quoteOrder?: number[];
  targetDate?: string;
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening';
  order?: number;
}

interface CustomTimePickerModalProps {
  visible: boolean;
  reminderSelectedHour: string;
  reminderSelectedMinute: string;
  reminderSelectedPeriod: 'AM' | 'PM';
  onConfirm: (hour: string, minute: string, period: 'AM' | 'PM') => void;
  onClose: () => void;
}

type HabitLogs = Record<string, string[]>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_CARD_WIDTH = SCREEN_WIDTH - 32;
const CELL_WIDTH = Math.floor(CALENDAR_CARD_WIDTH / 7);
const REMINDER_ITEM_HEIGHT = 45;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = REMINDER_ITEM_HEIGHT * VISIBLE_ITEMS;
const REMINDER_PERIODS = ["AM", "PM"] as const;
const LOOP_FACTOR = 100;
const INFINITE_HOURS = Array.from({ length: 12 * LOOP_FACTOR }, (_, i) => String((i % 12) + 1));
const INFINITE_MINUTES = Array.from({ length: 60 * LOOP_FACTOR }, (_, i) => String(i % 60).padStart(2, '0'));

const AVAILABLE_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#3B82F6',
  '#84CC16', '#14B8A6', '#6366F1', '#D97706',
];

const ICON_CATEGORIES = {
  All: [
    'fitness-outline', 'book-outline', 'water-outline', 'walk-outline',
    'barbell-outline', 'code-slash-outline', 'restaurant-outline', 'bed-outline',
    'leaf-outline', 'heart-outline', 'bicycle-outline', 'musical-notes-outline',
    'cafe-outline', 'pizza-outline', 'fast-food-outline', 'nutrition-outline',
    'game-controller-outline', 'camera-outline', 'brush-outline', 'laptop-outline',
  ],
  Food: [
    'restaurant-outline', 'cafe-outline', 'pizza-outline', 'fast-food-outline',
    'nutrition-outline', 'beer-outline', 'wine-outline', 'ice-cream-outline',
  ],
  Lifestyle: [
    'fitness-outline', 'water-outline', 'walk-outline', 'barbell-outline',
    'bed-outline', 'leaf-outline', 'heart-outline', 'bicycle-outline',
    'medkit-outline', 'sunny-outline',
  ],
  Hobby: [
    'book-outline', 'code-slash-outline', 'musical-notes-outline',
    'game-controller-outline', 'camera-outline', 'brush-outline', 'laptop-outline',
    'headset-outline', 'tv-outline',
  ],
};

const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PADDED_HOURS = ['', ...INFINITE_HOURS, ''];
const PADDED_MINUTES = ['', ...INFINITE_MINUTES, ''];
const PADDED_PERIODS = ['', ...REMINDER_PERIODS, ''];
/*
async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Fallo al obtener el token para notificaciones push!');
    return false;
  }
  return true;
}

useEffect(() => {
  registerForPushNotificationsAsync();
}, []);
*/

const MemorizedPickerItem = React.memo(({ item, isSelected }: { item: string; isSelected: boolean }) => {
  if (item === '') return <View style={{ height: REMINDER_ITEM_HEIGHT }} />;
  return (
    <View style={{ height: REMINDER_ITEM_HEIGHT, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
      <Text
        style={[
          styles.reminderPickerText,
          isSelected && styles.reminderPickerTextSelected,
          { textAlign: 'center', width: '100%' }
        ]}
      >
        {item}
      </Text>
    </View>
  );
},
  (prevProps, nextProps) => prevProps.isSelected === nextProps.isSelected
);

export const CustomTimePickerModal: React.FC<CustomTimePickerModalProps> = ({
  visible,
  reminderSelectedHour,
  reminderSelectedMinute,
  reminderSelectedPeriod,
  onConfirm,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const [hour, setHour] = useState(reminderSelectedHour);
  const [minute, setMinute] = useState(reminderSelectedMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(reminderSelectedPeriod);
  const hourFlatListRef = React.useRef<FlatList>(null);
  const minuteFlatListRef = React.useRef<FlatList>(null);
  const periodFlatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setHour(reminderSelectedHour);
      setMinute(reminderSelectedMinute);
      setPeriod(reminderSelectedPeriod);
      const baseHour = parseInt(reminderSelectedHour, 10) || 8;
      const targetHourIndex = (LOOP_FACTOR / 2) * 12 + (baseHour - 1);
      const baseMinute = parseInt(reminderSelectedMinute, 10) || 0;
      const targetMinuteIndex = (LOOP_FACTOR / 2) * 60 + baseMinute;
      const targetPeriodIndex = reminderSelectedPeriod === 'AM' ? 0 : 1;
      setTimeout(() => {
        hourFlatListRef.current?.scrollToOffset({
          offset: targetHourIndex * REMINDER_ITEM_HEIGHT,
          animated: false,
        });
        minuteFlatListRef.current?.scrollToOffset({
          offset: targetMinuteIndex * REMINDER_ITEM_HEIGHT,
          animated: false,
        });
        periodFlatListRef.current?.scrollToOffset({
          offset: targetPeriodIndex * REMINDER_ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [visible, reminderSelectedHour, reminderSelectedMinute, reminderSelectedPeriod]);

  const handleScrollEnd = <T extends string>(
    offsetY: number,
    originalData: readonly T[],
    setter: (val: T) => void,
    listRef: React.RefObject<FlatList<any> | null>
  ) => {
    const validOffsetY = Math.max(0, offsetY);
    const index = Math.round(validOffsetY / REMINDER_ITEM_HEIGHT);
    const safeIndex = Math.min(Math.max(0, index), originalData.length - 1);
    listRef.current?.scrollToOffset({
      offset: safeIndex * REMINDER_ITEM_HEIGHT,
      animated: true
    });
    setter(originalData[safeIndex]);
  };

  const handleScrollProgress = <T extends string>(
    offsetY: number,
    originalData: readonly T[],
    setter: (val: T) => void
  ) => {
    const validOffsetY = Math.max(0, offsetY);
    const index = Math.round(validOffsetY / REMINDER_ITEM_HEIGHT);
    const safeIndex = Math.min(Math.max(0, index), originalData.length - 1);
    setter(originalData[safeIndex]);
  };

  const renderPickerItem = (item: string, currentValue: string) => {
    if (item === '') return <View style={{ height: REMINDER_ITEM_HEIGHT }} />;
    const isSelected = item === currentValue;
    return (
      <View style={styles.reminderPickerItem}>
        <Text style={[styles.reminderPickerText, isSelected && styles.reminderPickerTextSelected]}>
          {item}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='fade'
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.reminderWindowCardContainer}>
          <View style={styles.reminderCardHeader}>
            <Text style={styles.reminderCardTitle}>{t('time')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.reminderCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.reminderPickerWrapper}>
            <FlatList
              ref={hourFlatListRef}
              style={{ height: CONTAINER_HEIGHT, width: 60 }}
              data={PADDED_HOURS}
              keyExtractor={(_, index) => `h-${index}`}
              showsVerticalScrollIndicator={false}
              snapToInterval={REMINDER_ITEM_HEIGHT}
              snapToAlignment="start"
              decelerationRate="normal"
              disableIntervalMomentum={false}
              bounces={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              getItemLayout={(_, index) => ({
                length: REMINDER_ITEM_HEIGHT,
                offset: REMINDER_ITEM_HEIGHT * index,
                index,
              })}
              scrollEventThrottle={16}
              onScroll={(e) => handleScrollProgress(e.nativeEvent.contentOffset.y, INFINITE_HOURS, setHour)}
              onMomentumScrollEnd={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y, INFINITE_HOURS, setHour, hourFlatListRef)}
              onScrollEndDrag={(e) => {
                const validOffsetY = Math.max(0, e.nativeEvent.contentOffset.y);
                const index = Math.round(validOffsetY / REMINDER_ITEM_HEIGHT);
                const safeIndex = Math.min(Math.max(0, index), INFINITE_HOURS.length - 1);
                setHour(INFINITE_HOURS[safeIndex]);
              }}
              extraData={hour}
              renderItem={({ item }) => <MemorizedPickerItem item={item} isSelected={item === hour} />}
            />

            <View style={{ height: CONTAINER_HEIGHT, width: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.reminderTimeSeparator}>:</Text>
            </View>

            <FlatList
              ref={minuteFlatListRef}
              style={{ height: CONTAINER_HEIGHT, width: 60 }}
              data={PADDED_MINUTES}
              keyExtractor={(_, index) => `m-${index}`}
              showsVerticalScrollIndicator={false}
              snapToInterval={REMINDER_ITEM_HEIGHT}
              snapToAlignment="start"
              decelerationRate="normal"
              disableIntervalMomentum={false}
              bounces={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              getItemLayout={(_, index) => ({
                length: REMINDER_ITEM_HEIGHT,
                offset: REMINDER_ITEM_HEIGHT * index,
                index,
              })}
              scrollEventThrottle={16}
              onScroll={(e) => handleScrollProgress(e.nativeEvent.contentOffset.y, INFINITE_MINUTES, setMinute)}
              onMomentumScrollEnd={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y, INFINITE_MINUTES, setMinute, minuteFlatListRef)}
              onScrollEndDrag={(e) => {
                const validOffsetY = Math.max(0, e.nativeEvent.contentOffset.y);
                const index = Math.round(validOffsetY / REMINDER_ITEM_HEIGHT);
                const safeIndex = Math.min(Math.max(0, index), INFINITE_MINUTES.length - 1);
                setMinute(INFINITE_MINUTES[safeIndex]);
              }}
              extraData={minute}
              renderItem={({ item }) => <MemorizedPickerItem item={item} isSelected={item === minute} />}
            />
            <View style={{ width: 16 }} />
            <FlatList
              ref={periodFlatListRef}
              data={PADDED_PERIODS}
              style={{ height: CONTAINER_HEIGHT, width: 60 }}
              contentContainerStyle={{ paddingBottom: REMINDER_ITEM_HEIGHT * 1.1 }}
              keyExtractor={(item, index) => `p-${index}-${item}`}
              showsVerticalScrollIndicator={false}
              snapToInterval={REMINDER_ITEM_HEIGHT}
              snapToAlignment="start"
              decelerationRate="normal"
              disableIntervalMomentum={false}
              bounces={false}
              getItemLayout={(_, index) => ({
                length: REMINDER_ITEM_HEIGHT,
                offset: REMINDER_ITEM_HEIGHT * index,
                index,
              })}
              scrollEventThrottle={16}
              onScroll={(e) => handleScrollProgress(e.nativeEvent.contentOffset.y, REMINDER_PERIODS, setPeriod)}
              onMomentumScrollEnd={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y, REMINDER_PERIODS, setPeriod, periodFlatListRef)}
              onScrollEndDrag={(e) => {
                const validOffsetY = Math.max(0, e.nativeEvent.contentOffset.y);
                const index = Math.round(validOffsetY / REMINDER_ITEM_HEIGHT);
                const safeIndex = Math.min(Math.max(0, index), REMINDER_PERIODS.length - 1);
                setPeriod(REMINDER_PERIODS[safeIndex]);
              }}
              extraData={period}
              renderItem={({ item }) => <MemorizedPickerItem item={item} isSelected={item === period} />}
            />
          </View>

          <TouchableOpacity
            style={styles.reminderSaveButton}
            onPress={() => onConfirm(hour, minute, period)}
          >
            <Text style={styles.reminderSaveButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
/*
export async function scheduleHabitReminders(
  habitID: string,
  habitTitle: string,
  hourStr: string,
  minuteStr: string,
  period: 'AM' | 'PM',
  frequencyType: string,
  selectedWeekDays?: boolean[],
  selectedMonthDays?: number[]
) {
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  if (frequencyType === 'days_of_week' && selectedWeekDays) {
    for (let dayIndex = 0; dayIndex < selectedWeekDays.length; dayIndex++) {
      if (selectedWeekDays[dayIndex]) {
        const weekdayForExpo = dayIndex + 1;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '¡Hora de tu hábito!',
            body: `Es momento de completar: ${habitTitle}`,
            sound: true,
            data: { habitID },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekdayForExpo,
            hour: hour,
            minute: minute,
          },
        });
      }
    }
  }
}
*/
interface SwipeableHabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  isFailed: boolean;
  onToggle: (habitId: string) => void;
  onRelapse?: (habitId: string) => void;
  displayDescription?: string;
  streak?: number;
  isEditMode?: boolean;
  onLongPress?: () => void;
  onMoveUp?: (habitId: string) => void;
  onMoveDown?: (habitId: string) => void;
  isMenuOpen?: boolean;
  onToggleMenu?: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  index?: number;
  totalItems?: number;
}

const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const RELAPSE_THRESHOLD = SCREEN_WIDTH * 0.4;
const SwipeableHabitCard: React.FC<SwipeableHabitCardProps> = ({
  habit,
  isCompleted,
  isFailed = false,
  onToggle,
  onRelapse,
  displayDescription,
  streak,
  isEditMode = false,
  onLongPress,
  onMoveUp,
  onMoveDown,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  index = 0,
  totalItems = 1
}) => {
  const { t, i18n } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const activeDragY = useSharedValue(0);
  const maxUp = useSharedValue(0);
  const maxDown = useSharedValue(0);
  const CARD_HEIGHT = 93;
  const SWAP_THRESHOLD = CARD_HEIGHT * 0.65;
  const isQuitHabit = habit.type === 'Quit a habit';

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .onStart(() => {
      runOnJS(setIsDragging)(true);
      activeDragY.value = 0;
      maxUp.value = -index * CARD_HEIGHT;
      maxDown.value = (totalItems - 1 - index) * CARD_HEIGHT;
    })
    .onUpdate((event) => {
      if (isEditMode) {
        const rawY = event.translationY - activeDragY.value;
        const boundedY = Math.max(maxUp.value, Math.min(rawY, maxDown.value));
        translateY.value = boundedY;
        if (boundedY > SWAP_THRESHOLD && onMoveDown) {
          runOnJS(onMoveDown)(habit.id);
          activeDragY.value += CARD_HEIGHT;
          maxUp.value -= CARD_HEIGHT;
          maxDown.value -= CARD_HEIGHT;
        } else if (boundedY < -SWAP_THRESHOLD && onMoveUp) {
          runOnJS(onMoveUp)(habit.id);
          activeDragY.value -= CARD_HEIGHT;
          maxUp.value += CARD_HEIGHT;
          maxDown.value += CARD_HEIGHT; 
        }
      } else if (!isCompleted && !isFailed) {
        if (event.translationX > 0) {
          translateX.value = event.translationX;
        } else if (event.translationX < 0 && isQuitHabit) {
          translateX.value = event.translationX;
        }
      }
    })
    .onEnd((event) => {
      if (isEditMode) {
        translateY.value = withSpring(0);
      } else if (!isCompleted && !isFailed) {
        if (event.translationX > SWIPE_THRESHOLD) {
          translateX.value = withTiming(SCREEN_WIDTH,{}, () => {
            runOnJS(onToggle)(habit.id);
            translateX.value = 0;
          });
        }
      } else if (isQuitHabit && event.translationX < -RELAPSE_THRESHOLD) {
        translateX.value = withSpring(0);
        if (onRelapse) {
          runOnJS(onRelapse)(habit.id);
        }
      } else {
        translateX.value = withSpring(0);
      }
    })
    .onFinalize(() => {
      runOnJS(setIsDragging)(false);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (!isEditMode && onLongPress) {
        runOnJS(onLongPress)();
      }
    });

  const composedGestures = Gesture.Simultaneous(panGesture, longPressGesture);
  const rStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
    zIndex: translateY.value !== 0 ? 3 : 1,
    elevation: translateY.value !== 0 ? 3 : 1,
  }));
  const rBackgroundRightStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(translateX.value / SWIPE_THRESHOLD, 1) : 0,
    zIndex: translateX.value > 0 ? 1 : -1,
  }));
  const rBackgroundLeftStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(Math.abs(translateX.value) / RELAPSE_THRESHOLD, 1) : 0,
    zIndex: translateX.value < 0 ? 1 : -1,
  }));
  return (
    <Animated.View 
      layout={isDragging ? undefined : LinearTransition.duration(200)} 
      entering={FadeIn} 
      style={[styles.swipeableContainer, isMenuOpen ? { zIndex: 10, elevation: 3 } : { zIndex: 1, elevation: 0 }]}>
      {!isCompleted && (
        <>
          <Animated.View style={[styles.swipeBackground, { backgroundColor: habit.color }, rBackgroundRightStyle]}>
            <Ionicons name={isQuitHabit ? "trophy-outline" : "checkmark-circle-outline"} size={32} color="#FFFFFF" />
          </Animated.View>
          {isQuitHabit && (
            <Animated.View style={[styles.swipeBackgroundLeft, rBackgroundLeftStyle]}>
              <Ionicons name="close-circle-outline" size={34} color="#FFFFFF" />
            </Animated.View>
          )}
        </>
      )}

      <GestureDetector gesture={composedGestures}>
        <Animated.View style={[
          styles.habitCardGestural,
          rStyle,
          isCompleted && styles.habitCardCompletedGestural,
          isFailed && styles.habitCardFailedGestural,
        ]}>
          <View style={[
            styles.iconContainerGesture,
            { backgroundColor: isCompleted ? '#F3F4F6' : (isFailed ? '#FEE2E2' : habit.color + '15') }]}>
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : (habit.icon as any)}
              size={24}
              color={isCompleted ? '#9CA3AF' : (isFailed ? '#DC2626' : habit.color)}
            />
          </View>
          <View style={styles.habitInfo}>
            <Text style={[
              styles.habitTitleGestural,
              isCompleted && styles.habitTitleCompleted,
              isFailed && styles.habitTitleFailed
            ]}>
              {habit.title}
            </Text>
            {displayDescription ? <Text style={styles.habitDescription}>{displayDescription}</Text> : null}
          </View>

          {isEditMode && !isCompleted && !isFailed ? (
            <Animated.View entering={FadeIn} style={styles.reorderControls}>
              <Ionicons name="menu-outline" size={26} color="#9CA3AF" />
            </Animated.View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
              {isQuitHabit && !isFailed && streak !== undefined && (
                <View style={[styles.streakBadgeMini, { backgroundColor: habit.color }]}>
                  <Ionicons name="flame" size={12} color="#FFFFFF" />
                  <Text style={styles.streakBadgeMiniText}>{streak}</Text>
                </View>
              )}

              {!isEditMode && onToggleMenu && (
                <View style={{ position: 'relative', zIndex: 100 }}>
                  <TouchableOpacity style={styles.optionsButton} onPress={() => onToggleMenu(habit.id)}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                  {isMenuOpen && (
                    <TouchableOpacity activeOpacity={1} style={{ position: 'absolute', right: 0 }}>
                      <View style={styles.inlineMenuPopup}>
                        <TouchableOpacity style={styles.inlinePopupItem} onPress={() => onEdit && onEdit(habit.id)}>
                          <Ionicons name="pencil-outline" size={18} color="#1F2937" />
                          <Text style={styles.inlinePopupText}>{t('edit')}</Text>
                        </TouchableOpacity>
                        <View style={styles.inlinePopupDivider} />
                        <TouchableOpacity style={styles.inlinePopupItem} onPress={() => onDelete && onDelete(habit.id)}>
                          <Ionicons name="trash-outline" size={18} color="#DC2626" />
                          <Text style={[styles.inlinePopupText, { color: '#DC2626' }]}>{t('delete')}</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

export default function App() {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'es' ? 'es-ES' : i18n.language === 'jp' ? 'ja-JP' : 'en-US';
  const WEEK_DAYS = useMemo(() => [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')], [t]);
  const QUIT_QUOTES_KEYS = useMemo(() => [
    t('youCanDoItSoldier'),
    t('stayStrongOneDayAtATime'),
    t('focusOnYourProgressNotOnPerfection'),
    t('everySecondIsAVictory'),
    t('youAreStrongerThanYourUrges'),
    t('keepGoingYoureDoingGreat')
  ], [t]);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(new Date().getDay());
  const [headerDateText, setHeaderDateText] = useState<string>('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLogs>({});
  const [relapseLogs, setRelapseLogs] = useState<Record<string, string[]>>({});
  const [isRelapseModalVisible, setIsRelapseModalVisible] = useState(false);
  const [relapsingHabitId, setRelapsingHabitId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStreaksModalVisible, setIsStreaksModalVisible] = useState(false);

  const [habitType, setHabitType] = useState<'Build a habit' | 'Quit a habit' | 'Task'>('Build a habit');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(() => getRandomItem(ICON_CATEGORIES.All));
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [activeIconCategory, setActiveIconCategory] = useState<keyof typeof ICON_CATEGORIES>('All');

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(() => getRandomItem(AVAILABLE_COLORS));
  const [isFrequencyModalOpen, setIsFrequencyModalOpen] = useState(false);
  const [frequencyType, setFrequencyType] = useState<'days_of_week' | 'days_of_month' | 'some_days'>('days_of_week');
  const [timeOfDay, setTimeOfDay] = useState<'Morning' | 'Afternoon' | 'Evening' | undefined>(undefined);
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderSelectedHour, setRemiderSelectedHour] = useState('08');
  const [reminderSelectedMinute, setReminderSelectedMinute] = useState('00');
  const [reminderPeriod, setReminderPeriod] = useState<'AM' | 'PM'>('AM');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [isReminderPickerVisible, setIsReminderPickerVisible] = useState(false);
  const [taskDate, setTaskDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  const [selectedWeekDays, setSelectedWeekDays] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [frequencyDisplay, setFrequencyDisplay] = useState(t('everyday'));
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());


  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);

  const updateFrequencyDisplay = (daysArr: boolean[]) => {
    const [sun, mon, tue, wed, thu, fri, sat] = daysArr;
    const count = daysArr.filter(Boolean).length;
    const dayNames = [t('Sunday'), t('Monday'), t('Tuesday'), t('Wednesday'), t('Thursday'), t('Friday'), t('Saturday')];
    if (count === 7) {
      setFrequencyDisplay(t('everyday'));
      return;
    } else if (count === 6) {
      const missingIndex = daysArr.findIndex((val) => !val);
      setFrequencyDisplay(`${t('everydayBut')} ${dayNames[missingIndex]}`);
      return;
    } else if (count === 5 && mon && tue && wed && thu && fri && !sun && !sat) {
      setFrequencyDisplay(t('weekdays'));
      return;
    } else if (count === 3 && tue && wed && thu && !sun && !mon && !fri && !sat) {
      setFrequencyDisplay(t('midweek'));
      return;
    } else if (count === 2 && sun && sat && !mon && !tue && !wed && !thu && !fri) {
      setFrequencyDisplay(t('weekend'));
      return;
    } else if (count === 4 || count === 5) {
      const extendedDays = [...daysArr, ...daysArr];
      let startIdx = -1;
      for (let i = 0; i < 7; i++) {
        let isConsecutive = true;
        for (let j = 0; j < count; j++) {
          if (!extendedDays[i + j]) {
            isConsecutive = false;
            break;
          }
        }
        if (isConsecutive) {
          startIdx = i;
          break;
        }
      }

      if (startIdx !== -1) {
        const endIdx = (startIdx + count - 1) % 7;
        setFrequencyDisplay(`${t('from')}${dayNames[startIdx]} ${t('to')} ${dayNames[endIdx]}`);
        return;
      }
    } else if (count === 0) {
      setFrequencyDisplay(t('selectAtLeast1Day'));
      return;
    }
    const selectedNames = daysArr
      .map((isSelected, index) => (isSelected ? dayNames[index] : null))
      .filter(Boolean);

    setFrequencyDisplay(selectedNames.join(', '));
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}${t('first')}`;
      case 2: return `${day}${t('second')}`;
      case 3: return `${day}${t('third')}`;
      default: return `${day}${t('th')}`;
    }
  };

  const formatMonthDaysDisplay = (days: number[]): string => {
    if (days.length === 0) return t('selectAtLeast1Day');

    const sorted = [...days].sort((a, b) => a - b);
    const ranges: string[] = [];
    let rangeStart = sorted[0];
    let prevDay = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      const currentDay = sorted[i];
      if (currentDay !== prevDay + 1) {
        if (rangeStart === prevDay) {
          ranges.push(getOrdinalSuffix(rangeStart));
        } else if (prevDay === rangeStart + 1) {
          ranges.push(`${getOrdinalSuffix(rangeStart)}, ${getOrdinalSuffix(prevDay)}`);
        } else {
          ranges.push(`${getOrdinalSuffix(rangeStart)} - ${getOrdinalSuffix(prevDay)}`);
        }
        rangeStart = currentDay;
      }
      prevDay = currentDay;
    }
    return `${ranges.join(', ')} ${t('ofEachMonth')}`;
  };

  const handleCloseFrequencyModal = () => {
    if (frequencyType === 'days_of_week') {
      const count = selectedWeekDays.filter(Boolean).length;
      if (count === 0) return;
    } else if (frequencyType === 'days_of_month') {
      if (selectedMonthDays.length === 0) return;
    }
    setIsFrequencyModalOpen(false);
  };

  const handleMonthCurrent = () => {
    const now = new Date();
    const isSameMonth =
      currentCalendarDate.getMonth() === now.getMonth() &&
      currentCalendarDate.getFullYear() === now.getFullYear();
    if (isSameMonth) return;
    const isFuture = now > currentCalendarDate;
    calendarFlatListRef.current?.scrollToIndex({
      index: isFuture ? 2 : 0,
      animated: true
    });
    setTimeout(() => {
      setCalendarMonth(now);
      setCurrentCalendarDate(now);
      calendarFlatListRef.current?.scrollToIndex({ index: 1, animated: false });
    }, 300);
  }

  const handleHeaderDatePress = () => {
    const today = new Date();
    const todayStr = formatDateKey(today);
    const activeStr = formatDateKey(activeDate);
    const now = new Date();
    setCalendarMonth(now);
    setCurrentCalendarDate(now);
    setActiveMenuHabitId(null);
    if (activeStr !== todayStr) {
      setWeekOffset(0);
      setSelectedDayIndex(today.getDay());
    } else {
      setIsStreaksModalVisible(true);
    }
  };

  const activeDate = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek + weekOffset * 7);

    const selectedDate = new Date(startOfWeek);
    selectedDate.setDate(startOfWeek.getDate() + selectedDayIndex);
    return selectedDate;
  }, [weekOffset, selectedDayIndex]);
  const activeDateKey = useMemo(() => formatDateKey(activeDate), [activeDate]);

  useEffect(() => {
    const todayStr = formatDateKey(new Date());
    const activeStr = formatDateKey(activeDate);
    const isToday = todayStr === activeStr;
    const dayName = activeDate.toLocaleDateString(currentLocale, { weekday: 'short' });
    const monthName = activeDate.toLocaleDateString(currentLocale, { month: 'short' });
    const dayNum = activeDate.getDate();

    setHeaderDateText(`${isToday ? t('today') + ', ' : ''}${dayName} ${monthName} ${dayNum}`);
  }, [activeDate, i18n.language, t]);

  const toggleHabitCompletion = (habitId: string) => {
    const todayStr = formatDateKey(new Date());
    if (activeDateKey > todayStr) return;
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

  const handleRelapse = (habitId: string) => {
    setRelapsingHabitId(habitId);
    setIsRelapseModalVisible(true);
  };

  const confirmRelapse = () => {
    if (relapsingHabitId) {
      setRelapseLogs((prevLogs) => {
        const currentRelapsed = prevLogs[activeDateKey] || [];
        if (!currentRelapsed.includes(relapsingHabitId)) {
          return { ...prevLogs, [activeDateKey]: [...currentRelapsed, relapsingHabitId] };
        }
        return prevLogs;
      });
    }
    setIsRelapseModalVisible(false);
    setRelapsingHabitId(null);
  };

  const getQuitStreak = (habit: Habit) => {
    if (!habit.createdAt) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentActiveDate = new Date(activeDate);
    currentActiveDate.setHours(0, 0, 0, 0);
    let checkDate = currentActiveDate > today ? new Date(today) : new Date(currentActiveDate);
    const [startYear, startMonth, startDay] = habit.createdAt.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);

    while (checkDate >= startDate) {
      const key = formatDateKey(checkDate);
      const relapses = relapseLogs[key] || [];
      if (relapses.includes(habit.id)) {
        break;
      }
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };

  const getDisplayDescription = (habit: Habit) => {
    let displayDescription = habit.description;

    if (habit.type === 'Quit a habit' && habit.quoteOrder && habit.createdAt) {
      const [startYear, startMonth, startDay] = habit.createdAt.split('-').map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const [currYear, currMonth, currDay] = activeDateKey.split('-').map(Number);
      const currentDate = new Date(currYear, currMonth - 1, currDay);
      let diffDays = Math.round((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) diffDays = 0;
      const currentQuoteIndex = habit.quoteOrder[diffDays % 6];
      displayDescription = QUIT_QUOTES_KEYS[currentQuoteIndex];
    }

    return displayDescription;
  };

  const QuitSettings = () => {
    setFrequencyDisplay(t('everyday'));
    setSelectedWeekDays([true, true, true, true, true, true, true]);
    setFrequencyType('days_of_week');
  };

  const handleTaskDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setIsDatePickerVisible(false);
    if (selectedDate) setTaskDate(selectedDate);
  };

  const handleTaskDateDismiss = () => {
    setIsDatePickerVisible(false);
  };

  const handleCreateHabit = async () => {
    if (!newTitle.trim()) return;
    const isQuit = habitType === 'Quit a habit';
    const isTask = habitType === 'Task';

    if (editingHabitId) {
      setHabits((prev) => prev.map((h) => {
        if (h.id === editingHabitId) {
          return {
            ...h,
            title: newTitle,
            description: isQuit ? '' : newDescription,
            icon: selectedIcon,
            color: selectedColor,
            type: habitType,
            frequency: frequencyDisplay,
            timeOfDay: isQuit ? undefined : timeOfDay,
            selectedWeekDays: isQuit ? [true, true, true, true, true, true, true] : frequencyType === 'days_of_week' ? [...selectedWeekDays] : undefined,
            selectedMonthDays: isQuit ? undefined : frequencyType === 'days_of_month' ? [...selectedMonthDays] : undefined,
          };
        }
        return h;
      }));
    } else {
      const newId = Date.now().toString();
      const randomizedOrder = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
      const newHabit: Habit = {
        id: newId,
        title: newTitle,
        description: isQuit ? '' : newDescription,
        icon: selectedIcon,
        color: selectedColor,
        frequency: isQuit ? frequencyDisplay : frequencyDisplay,
        selectedWeekDays: isQuit ? [true, true, true, true, true, true, true] : frequencyType === 'days_of_week' ? [...selectedWeekDays] : undefined,
        selectedMonthDays: isQuit ? undefined : frequencyType === 'days_of_month' ? [...selectedMonthDays] : undefined,
        type: habitType,
        createdAt: activeDateKey,
        quoteOrder: isQuit ? randomizedOrder : undefined,
        targetDate: isTask ? formatDateKey(taskDate) : undefined,
        timeOfDay: isQuit ? undefined : timeOfDay,
        order: habits.length,
      };
      /*
      if (isQuit) {
        setHabitLogs((prevLogs) => {
          const currentCompleted = prevLogs[activeDateKey] || [];
          return {
            ...prevLogs,
            [activeDateKey]: [...currentCompleted, newId],
          };
        });
      }
      */
      /*
      if (isReminderEnabled) {
        await scheduleHabitReminders(
          newId,
          newTitle,
          reminderSelectedHour,
          reminderSelectedMinute,
          reminderPeriod,
          frequencyType,
          selectedWeekDays,
          selectedMonthDays
        );
      }
    */
      setHabits([...habits, newHabit]);
    }
    resetForm();
    setIsModalVisible(false);
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleSwitch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsReminderEnabled((previousState) => !previousState);
  };

  const handleReminderSaveTime = (hour: string, minute: string, period: 'AM' | 'PM') => {
    setRemiderSelectedHour(hour);
    setReminderSelectedMinute(minute);
    setReminderPeriod(period);
    setIsReminderPickerVisible(false);
  };

  const handleStartEdit = (habitId: string) => {
    const habitToEdit = habits.find((h) => h.id === habitId);
    if (habitToEdit) {
      setEditingHabitId(habitToEdit.id);
      setNewTitle(habitToEdit.title);
      setNewDescription(habitToEdit.description || '');
      setSelectedIcon(habitToEdit.icon);
      setSelectedColor(habitToEdit.color);
      setHabitType(habitToEdit.type || 'Build a habit');

      if (habitToEdit.frequency) setFrequencyDisplay(habitToEdit.frequency);
      if (habitToEdit.timeOfDay) setTimeOfDay(habitToEdit.timeOfDay);
      if (habitToEdit.selectedWeekDays) {
        setFrequencyType('days_of_week');
        setSelectedWeekDays([...habitToEdit.selectedWeekDays]);
      } else if (habitToEdit.selectedMonthDays) {
        setFrequencyType('days_of_month');
        setSelectedMonthDays([...habitToEdit.selectedMonthDays]);
      } else {
        setFrequencyType('days_of_week');
        setSelectedWeekDays([true, true, true, true, true, true, true]);
      }
      setIsModalVisible(true);
    }
    setActiveMenuHabitId(null);
  };

  const handleDeleteHabit = () => {
    if (activeMenuHabitId) {
      setHabits((prev) => prev.filter((h) => h.id !== activeMenuHabitId));
    }
    setActiveMenuHabitId(null);
  };

  const triggerHaptic = () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const triggerButtonHaptics = () => {
    if (Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setSelectedIcon(getRandomItem(ICON_CATEGORIES.All));
    setSelectedColor(getRandomItem(AVAILABLE_COLORS));
    setHabitType('Build a habit');
    setIsDropdownOpen(false);
    setSelectedWeekDays([true, true, true, true, true, true, true]);
    setSelectedMonthDays([]);
    setFrequencyType('days_of_week');
    setFrequencyDisplay(t('everyday'));
    setTimeOfDay(undefined);
    setTaskDate(new Date());
    setRemiderSelectedHour('05');
    setReminderSelectedMinute('00');
    setReminderPeriod(('AM'));
    setIsReminderEnabled(false);
    setEditingHabitId(null);
    setActiveMenuHabitId(null);
  };

  const resetFormWhenSetHabitType = () => {
    setNewTitle('');
    setNewDescription('');
    setIsDropdownOpen(false);
    setSelectedWeekDays([true, true, true, true, true, true, true]);
    setSelectedMonthDays([]);
    setFrequencyType('days_of_week');
    setFrequencyDisplay(t('everyday'));
    setTimeOfDay(undefined);
    setTaskDate(new Date());
    setRemiderSelectedHour('05');
    setReminderSelectedMinute('00');
    setReminderPeriod('AM');
    setIsReminderEnabled(false);
    setActiveMenuHabitId(null)
  };

  const toggleWeekDaySelection = (index: number) => {
    const updated = [...selectedWeekDays];
    updated[index] = !updated[index];
    setSelectedWeekDays(updated);
    updateFrequencyDisplay(updated);
  };

  const toggleMonthDaySelection = (day: number) => {
    let updated: number[];
    if (selectedMonthDays.includes(day)) {
      updated = selectedMonthDays.filter((d) => d !== day);
    } else {
      updated = [...selectedMonthDays, day];
    }
    setSelectedMonthDays(updated);
    setFrequencyDisplay(formatMonthDaysDisplay(updated));
  };

  const visibleHabits = useMemo(() => {
    const currentDayOfWeek = activeDate.getDay();
    const currentDayOfMonth = activeDate.getDate();

    return habits.filter((habit) => {
      if (habit.type === 'Task') {
        return habit.targetDate === activeDateKey;
      }
      if (habit.selectedWeekDays) {
        return habit.selectedWeekDays[currentDayOfWeek];
      }
      if (habit.selectedMonthDays) {
        return habit.selectedMonthDays.includes(currentDayOfMonth);
      }
      return true;
    });
  }, [habits, activeDate, activeDateKey]);

  const flatListRef = React.useRef<FlatList>(null);
  const calendarFlatListRef = React.useRef<FlatList>(null);
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

  const handleCalendarScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = SCREEN_WIDTH - 64;
    const pageIndex = Math.round(contentOffsetX / cardWidth);

    if (pageIndex === 0) {
      changeMonth('prev');
      calendarFlatListRef.current?.scrollToIndex({ index: 1, animated: false });
    } else if (pageIndex == 2) {
      changeMonth('next');
      calendarFlatListRef.current?.scrollToIndex({ index: 1, animated: false });
    }
  };

  const getHabitsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    return habits.filter((habit) => {
      if (habit.type === 'Task') {
        return habit.targetDate === dateKey;
      }
      if (habit.selectedWeekDays) {
        return habit.selectedWeekDays[dayOfWeek];
      }
      if (habit.selectedMonthDays) {
        return habit.selectedMonthDays.includes(dayOfMonth);
      }
      return true;
    });
  };

  const streakStats = useMemo(() => {
    if (habits.length === 0) {
      return { loggedCurrent: 0, loggedBest: 0, perfectCurrent: 0, perfectBest: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = formatDateKey(today);
    const todayCompletedCount = (habitLogs[todayKey] || []).length;
    const habitsToday = getHabitsForDate(today);
    const isTodayPerfect = habitsToday.length > 0 && todayCompletedCount >= habitsToday.length;

    let countPerfect = 0;
    let checkDate = new Date(today);

    if (isTodayPerfect) {
      countPerfect++;
    }
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const key = formatDateKey(checkDate);
      const completedCount = (habitLogs[key] || []).length;
      const habitsOnCheckDate = getHabitsForDate(checkDate);
      const isPerfect = habitsOnCheckDate.length > 0 && completedCount >= habitsOnCheckDate.length;

      if (isPerfect) {
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
      const habitsOnHistoricDate = getHabitsForDate(historicDate);
      const isPerfectHistoric = habitsOnHistoricDate.length > 0 && completedCount >= habitsOnHistoricDate.length;

      if (completedCount > 0) {
        tempLogged++;
        if (tempLogged > loggedBest) loggedBest = tempLogged;
      } else {
        tempLogged = 0;
      }
      if (isPerfectHistoric) {
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

  const getCalendarDaysForMonth = (baseDate: Date, monthOffset: number) => {
    const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
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
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentCalendarDate(newDate);
  };

  const handleCalendarScrollEndWithArrows = (movement: 'prev' | 'next') => {
    if (movement === 'prev') {
      calendarFlatListRef.current?.scrollToIndex({ index: 0, animated: true });
    } else if (movement == 'next') {
      calendarFlatListRef.current?.scrollToIndex({ index: 2, animated: true });
    }
    setTimeout(() => {
      changeMonth(movement);
      calendarFlatListRef.current?.scrollToIndex({ index: 1, animated: false });
    }, 300);
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
    setActiveMenuHabitId(null)
  };

  const moveHabit = (habitId: string, direction: 'up' | 'down') => {
    setHabits(prevHabits => {
      const habitToMove = prevHabits.find(h => h.id === habitId);
      if (!habitToMove) return prevHabits;
      const groupHabits = prevHabits.filter(h => {
        const targetIsNoTime = !habitToMove.timeOfDay || habitToMove.type == 'Quit a habit';
        if (targetIsNoTime) {
          return !h.timeOfDay || h.type === 'Quit a habit';
        }
        return h.timeOfDay === habitToMove.timeOfDay && h.type !== 'Quit a habit';
      }).sort((a, b) => (a.order || 0) - (b.order || 0));

      const currentIndex = groupHabits.findIndex(h => h.id === habitId);
      if (direction === 'up' && currentIndex > 0) {
        const neighbor = groupHabits[currentIndex - 1];
        return prevHabits.map(h => {
          if (h.id === habitId) return { ...h, order: neighbor.order };
          if (h.id === neighbor.id) return { ...h, order: habitToMove.order };
          return h;
        });
      } else if (direction === 'down' && currentIndex < groupHabits.length - 1) {
        const neighbor = groupHabits[currentIndex + 1];
        return prevHabits.map(h => {
          if (h.id === habitId) return { ...h, order: neighbor.order };
          if (h.id === neighbor.id) return { ...h, order: habitToMove.order };
          return h;
        });
      }
      return prevHabits;
    });
  };

  const getLocale = (languageCode: string) => {
    switch (languageCode) {
      case 'es': return 'es-ES';
      case 'jp': return 'ja-JP';
      case 'en':
      default: return 'en-US';
    }
  };

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9f9f7" />
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => activeMenuHabitId && setActiveMenuHabitId(null)}
        >
          <View style={styles.navbar}>
            <TouchableOpacity style={styles.dateSelector} onPress={handleHeaderDatePress}>
              <Text style={styles.dateText}>{headerDateText}</Text>
              <Ionicons name="chevron-down" size={18} color="#1F2937" />
            </TouchableOpacity>

            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.streakBadge} onPress={() => [setIsStreaksModalVisible(true), setActiveMenuHabitId(null)]}>
                {(() => {
                  const today = new Date();
                  const todayStr = formatDateKey(today);
                  const todayLogs = habitLogs[todayStr] || [];
                  const habitsForToday = getHabitsForDate(today);
                  const isTodayCompleted = habits.length > 0 && todayLogs.length >= habitsForToday.length && habitsForToday.length > 0;
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
          <ScrollView
            style={styles.mainContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isEditMode}
            onScrollBeginDrag={() => activeMenuHabitId && setActiveMenuHabitId(null)}>
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
                          const habitsForThisDay = getHabitsForDate(dayItem.fullDate);

                          if (count > 0) {
                            dotColor = habitsForThisDay.length > 0 && count >= habitsForThisDay.length ? '#10B981' : '#F59E0B';
                          }
                          return (
                            <TouchableOpacity
                              key={index}
                              style={styles.dayCard}
                              onPress={() => [setSelectedDayIndex(index), setActiveMenuHabitId(null)]}
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
              {isEditMode && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.editModeOverlay} />
              )}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('yourHabits')}</Text>
                {isEditMode && (
                  <TouchableOpacity onPress={() => [setIsEditMode(false), setActiveMenuHabitId(null)]} style={styles.doneEditButton}>
                    <Text style={styles.doneEditText}>{t('done')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {visibleHabits.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('youDontHaveAnyHabitsYet')}</Text>
                  <Text style={styles.emptySubtext}>{t('createOneToStartTracking')}</Text>
                </View>
              ) : (
                (() => {
                  const todayStr = formatDateKey(new Date());
                  const isPastDay = activeDateKey < todayStr;
                  const isHabitCompleted = (h: Habit) => {
                    if (h.type === 'Quit a habit' && isPastDay && h.createdAt && activeDateKey >= h.createdAt) {
                      return true;
                    }
                    return completedIds.includes(h.id);
                  };
                  const completedIds = habitLogs[activeDateKey] || [];
                  const relapsedIds = relapseLogs[activeDateKey] || [];
                  const sortedHabits = [...visibleHabits].sort((a, b) => (a.order || 0) - (b.order || 0));
                  const relapsedHabits = sortedHabits.filter(h => relapsedIds.includes(h.id));
                  const activeHabits = sortedHabits.filter(h => !relapsedIds.includes(h.id));
                  const renderGroup = (title: string | null, groupHabits: Habit[]) => {
                    if (groupHabits.length === 0) return null;
                    const pending = groupHabits.filter(h => !isHabitCompleted(h));
                    const completed = groupHabits.filter(h => isHabitCompleted(h));
                    const hasActiveMenu = groupHabits.some(h => h.id === activeMenuHabitId);

                    return (
                      <Animated.View
                        key={title || 'no-time'}
                        style={hasActiveMenu ? { zIndex: 100, elevation: 100 } : { zIndex: 10, elevation: 10 }}
                      >
                        {title && <Text style={styles.timeOfDayHeader}>{title}</Text>}
                        {pending.map((habit, index) => (
                          <SwipeableHabitCard
                            key={`pending-${habit.id}`}
                            habit={habit}
                            isCompleted={false}
                            isFailed={false}
                            onToggle={toggleHabitCompletion}
                            onRelapse={handleRelapse}
                            displayDescription={getDisplayDescription(habit)}
                            streak={habit.type === 'Quit a habit' ? getQuitStreak(habit) : undefined}
                            isEditMode={isEditMode}
                            onLongPress={() => {
                              setIsEditMode(true);
                              triggerHaptic();
                            }}
                            onMoveUp={(id) => moveHabit(id, 'up')}
                            onMoveDown={(id) => moveHabit(id, 'down')}
                            isMenuOpen={activeMenuHabitId === habit.id}
                            onToggleMenu={(id) => setActiveMenuHabitId(prev => prev === id ? null : id)}
                            onEdit={handleStartEdit}
                            onDelete={handleDeleteHabit}
                            index={index}
                            totalItems={pending.length}
                          />
                        ))}

                        {completed.length > 0 && (
                          <View style={{ marginTop: pending.length > 0 ? 10 : 0 }}>
                            {completed.map((habit) => (
                              <TouchableOpacity
                                key={`completed-${habit.id}`}
                                onPress={() => toggleHabitCompletion(habit.id)}
                                activeOpacity={0.8}
                              >
                                <SwipeableHabitCard
                                  habit={habit}
                                  isCompleted={true}
                                  isFailed={false}
                                  onToggle={toggleHabitCompletion}
                                  displayDescription={getDisplayDescription(habit)}
                                  streak={habit.type === 'Quit a habit' ? getQuitStreak(habit) : undefined}
                                  isMenuOpen={activeMenuHabitId === habit.id}
                                  onToggleMenu={(id) => setActiveMenuHabitId(prev => prev === id ? null : id)}
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
                          onToggle={toggleHabitCompletion}
                          displayDescription={getDisplayDescription(relapsedHabit)}
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
              <TouchableOpacity style={styles.createHabitButton} onPress={() => { setIsModalVisible(true); resetForm(); triggerButtonHaptics(); }}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>


          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.bottomTab}>
              <Ionicons name="grid-outline" size={22} color="#00B763" />
              <Text style={[styles.bottomTabText, { color: '#00B763' }]}>{t('menu')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomTab} onPress={() => { setIsModalVisible(true), resetForm() }}>
              <Ionicons name="add-circle" size={22} color="#6B7280" />
              <Text style={styles.bottomTabText}>{t('newHabit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomTab}>
              <Ionicons name="bar-chart-outline" size={22} color="#6B7280" />
              <Text style={styles.bottomTabText}>{t('analytics')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomTab}>
              <Ionicons name="person-outline" size={22} color="#6B7280" />
              <Text style={styles.bottomTabText}>{t('me')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        <Modal visible={isModalVisible} animationType="slide" transparent={false} statusBarTranslucent={true}>
          <SafeAreaView style={styles.createHabitModalContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.createHabitHeader}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={26} color="#1F2937" />
              </TouchableOpacity>

              <View style={styles.dropdownWrapper}>
                <Text style={styles.dropdownTitle}>{t(habitType)}</Text>
              </View>

              <View style={{ width: 26 }} />
            </View>

            <ScrollView style={styles.createHabitBody} showsVerticalScrollIndicator={false}>
              <View style={styles.iconSelectionSection}>
                <View style={[styles.iconBoxBackground, { backgroundColor: selectedColor + '15' }]}>
                  <TouchableOpacity
                    style={[styles.iconCircleButton, { backgroundColor: selectedColor }]}
                    onPress={() => setIsIconPickerOpen(true)}
                  >
                    <Ionicons name={selectedIcon as any} size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.typeSelectorContainer}>
                {(['Build a habit', 'Quit a habit', 'Task'] as const).map((type) => {
                  const isSelected = habitType === type;
                  const displayLabel = type === 'Build a habit' ? t('build') : type === 'Quit a habit' ? t('quit') : t('task');

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeSelectorButton,
                        isSelected && styles.typeSelectorButtonSelected
                      ]}
                      onPress={() => [setHabitType(type), resetFormWhenSetHabitType()]}
                    >
                      <Text style={[styles.typeSelectorText, isSelected && { color: selectedColor }]}>
                        {displayLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  {habitType === 'Task' ? t('taskName') : t('newHabit')}
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              {habitType !== 'Quit a habit' && (
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>{t('description')}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newDescription}
                    onChangeText={setNewDescription}
                    multiline={true}
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>{t('color')}</Text>
                <View style={styles.colorGrid}>
                  {AVAILABLE_COLORS.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[styles.colorOption, { backgroundColor: color }, isSelected && styles.colorOptionSelected]}
                        onPress={() => setSelectedColor(color)}
                      >
                        {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {habitType !== 'Task' && (
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>{t('frequency')}</Text>
                  {habitType === 'Quit a habit' ? (
                    <TouchableOpacity style={[styles.frequencyInputSelector, { backgroundColor: '#E5E7EB' }]}>
                      <Text style={styles.frequencyValueText}>{frequencyDisplay}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.frequencyInputSelector} onPress={() => setIsFrequencyModalOpen(true)}>
                      <Text style={styles.frequencyValueText}>{frequencyDisplay}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {habitType !== 'Quit a habit' && (
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>{t('timeOfDay')}</Text>
                  <View style={styles.timeOfDayContainer}>
                    {(['Morning', 'Afternoon', 'Evening'] as const).map((time) => {
                      const isSelected = timeOfDay === time;
                      const displayTime = time === 'Morning' ? (t('morning')) :
                        time === 'Afternoon' ? (t('afternoon')) :
                          (t('evening'));
                      return (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOfDayButton,
                            isSelected && { backgroundColor: selectedColor, borderColor: selectedColor }
                          ]}
                          onPress={() => setTimeOfDay(isSelected ? undefined : time)}
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

              {habitType === 'Task' && (
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>{t('when')}</Text>
                  <TouchableOpacity
                    style={styles.frequencyInputSelector}
                    onPress={() => setIsDatePickerVisible(true)}
                  >
                    <Text style={styles.frequencyValueText}>
                      {t('doItOn')}: {taskDate.toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>

                  {isDatePickerVisible && (
                    <DateTimePicker
                      value={taskDate}
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
                      <Text style={{ color: selectedColor, fontWeight: '600' }}>{t('done')}</Text>
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
                      trackColor={{ false: '#767577', true: selectedColor + '10' }}
                      thumbColor={isReminderEnabled ? selectedColor : '#F4F3F4'}
                      ios_backgroundColor="#3E3E3E"
                      onValueChange={toggleSwitch}
                      value={isReminderEnabled}
                    />
                  </View>

                  {isReminderEnabled && (
                    <Animated.View
                      entering={FadeInUp.duration(200)}
                      style={styles.reminderExpandedContent}>
                      <View style={styles.reminderDivider} />
                      <TouchableOpacity style={styles.reminderTimeButton} onPress={() => setIsReminderPickerVisible(true)}>
                        <Text style={styles.reminderTimeButtonText}>
                          {`${reminderSelectedHour}:${reminderSelectedMinute} ${reminderPeriod}`}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                  <CustomTimePickerModal
                    visible={isReminderPickerVisible}
                    reminderSelectedHour={reminderSelectedHour}
                    reminderSelectedMinute={reminderSelectedMinute}
                    reminderSelectedPeriod={reminderPeriod}
                    onConfirm={(h, m, p) => handleReminderSaveTime(h, m, p)}
                    onClose={() => setIsReminderPickerVisible(false)}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.createHabitFooter}>
              <TouchableOpacity style={[styles.saveHabitButton, { backgroundColor: selectedColor }]} onPress={handleCreateHabit}>
                <Text style={styles.saveButtonText}>{t('saveHabit')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal visible={isIconPickerOpen} transparent={false} animationType="slide" statusBarTranslucent={true}>
          <SafeAreaView style={styles.fullscreenModalContainer}>
            <View style={styles.fullscreenModalHeader}>
              <TouchableOpacity onPress={() => setIsIconPickerOpen(false)}>
                <Ionicons name="close" size={26} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.fullscreenModalTitle}>Select Icon</Text>
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
                  const isSelected = selectedIcon === iconName;
                  return (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconTile,
                        isSelected && { borderColor: selectedColor, backgroundColor: selectedColor + '15' }]}
                      onPress={() => {
                        setSelectedIcon(iconName)
                      }}
                    >
                      <Ionicons name={iconName as any} size={30} color={isSelected ? selectedColor : '#374151'} />
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
                  setFrequencyType('days_of_week');
                  updateFrequencyDisplay(selectedWeekDays);
                }}
              >
                <View style={styles.frequencyOptionHeader}>
                  <Ionicons
                    name={frequencyType === 'days_of_week' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={frequencyType === 'days_of_week' ? selectedColor : '#9CA3AF'}
                  />
                  <Text style={styles.frequencyOptionTitle}>{t('specificDaysOfTheWeek')}</Text>
                </View>

                {frequencyType === 'days_of_week' && (
                  <View style={styles.weekDaysPickerRow} >
                    {WEEK_DAYS.map((day, idx) => {
                      const isSelected = selectedWeekDays[idx];
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.weekDayCircle,
                            isSelected && { backgroundColor: selectedColor }
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
                  setFrequencyType('days_of_month');
                  setFrequencyDisplay(formatMonthDaysDisplay(selectedMonthDays));
                }}
              >
                <View style={styles.frequencyOptionHeader}>
                  <Ionicons
                    name={frequencyType === 'days_of_month' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={frequencyType === 'days_of_month' ? selectedColor : '#9CA3AF'}
                  />
                  <Text style={styles.frequencyOptionTitle}>{t('specificDaysOfTheMonth')}</Text>
                </View>

                {frequencyType === 'days_of_month' && (
                  <View style={styles.monthDaysGridContainer}>
                    <View style={[styles.monthDaysRow, styles.monthDaysRowFirst]}>
                      {[1, 2, 3, 4, 5].map((day) => {
                        const isSelected = selectedMonthDays.includes(day);
                        return (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.monthDayCircle,
                              isSelected && { backgroundColor: selectedColor }
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
                          const isSelected = selectedMonthDays.includes(day);
                          return (
                            <TouchableOpacity
                              key={day}
                              style={[
                                styles.monthDayCircle,
                                isSelected && { backgroundColor: selectedColor },
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
                        const isSelected = selectedMonthDays.includes(day);
                        return (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.monthDayCircle,
                              isSelected && { backgroundColor: selectedColor },
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

        <Modal visible={isStreaksModalVisible} animationType="fade" transparent={false} statusBarTranslucent={true}>
          <SafeAreaView style={styles.streaksContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.streaksHeader}>
              <TouchableOpacity onPress={() => setIsStreaksModalVisible(false)}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.streaksTitle}>{t('myStreaks')}</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.streaksTopBox}>
              <View style={styles.streakCard}>
                <Ionicons name="flame" size={56} color="#F59E0B" />
                <Text style={styles.streakLabel}>{t('loggedDays')}</Text>
                <Text style={[styles.streakNumber, { color: '#F59E0B' }]}>{streakStats.loggedCurrent}</Text>
                <Text style={styles.streakSubtext}>{t('currentStreak')}</Text>
                <View style={styles.bestBadge}>
                  <Ionicons name="trophy-outline" size={16} color="#F59E0B" />
                  <Text style={styles.bestText}>{t('best')}: {streakStats.loggedBest}</Text>
                </View>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakCard}>
                <Ionicons name="flame" size={56} color="#10B981" />
                <Text style={styles.streakLabel}>{t('perfectDays')}</Text>
                <Text style={[styles.streakNumber, { color: '#10B981' }]}>{streakStats.perfectCurrent}</Text>
                <Text style={styles.streakSubtext}>{t('currentStreak')}</Text>
                <View style={styles.bestBadge}>
                  <Ionicons name="trophy-outline" size={16} color="#10B981" />
                  <Text style={styles.bestText}>{t('best')}: {streakStats.perfectBest}</Text>
                </View>
              </View>
            </View>

            <View style={styles.calendarSectionBox}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => handleCalendarScrollEndWithArrows('prev')} style={styles.monthNavButton}>
                  <Ionicons name="chevron-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.calendarMonthText} onPress={handleMonthCurrent}>
                    {currentCalendarDate.toLocaleDateString(currentLocale, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCalendarScrollEndWithArrows('next')} style={styles.monthNavButton}>
                  <Ionicons name="chevron-forward" size={22} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <View style={styles.weekDaysHeader}>
                {WEEK_DAYS.map((day, idx) => (
                  <View key={idx} style={styles.weekDayCell}>
                    <Text style={styles.weekDayText}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              <FlatList
                ref={calendarFlatListRef}
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
                onMomentumScrollEnd={handleCalendarScrollEnd}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => {
                  const days = getCalendarDaysForMonth(currentCalendarDate, item);
                  return (
                    <View style={[styles.calendarGrid, { width: SCREEN_WIDTH - 32 }]}  >
                      {days.map((dayItem, index) => {
                        const dateKey = formatDateKey(dayItem.date);
                        const todayStr = formatDateKey(new Date());
                        const isToday = dateKey === todayStr;
                        const completedList = habitLogs[dateKey] || [];
                        const count = completedList.length;
                        const habitsForCell = getHabitsForDate(dayItem.date);
                        let dotColor = '#CBD5E1';
                        if (count > 0) {
                          dotColor = habitsForCell.length > 0 && count >= habitsForCell.length ? '#10B981' : '#F59E0B';
                        }
                        return (
                          <TouchableOpacity
                            key={index}
                            style={styles.calendarCell}
                            onPress={() => handleSelectedCalendarDay(dayItem.date)}
                          >
                            <Text style={[styles.calendarDayNum, !dayItem.isCurrentMonth && { color: '#9CA3AF' }, isToday && styles.calendarDayNumToday]}>
                              {dayItem.date.getDate()}
                            </Text>
                            <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                }}
              >
              </FlatList>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={isRelapseModalVisible}
          transparent={true}
          animationType='fade'
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp.duration(300)} style={styles.relapseModalCard}>
              <View style={styles.relapseIconWrapper}>
                <Ionicons name="warning" size={36} color="#DC2626" />
              </View>
              <Text style={styles.relapseModalTitle}>
                {t('relapseWarningTitle')}
              </Text>
              <Text style={styles.relapseModalText}>
                {t('relapseWarningBody')}
              </Text>
              <View style={styles.relapseModalButtons}>
                <TouchableOpacity
                  style={[styles.relapseButton, styles.relapseButtonCancel]}
                  onPress={() => {
                    setIsRelapseModalVisible(false);
                    setRelapsingHabitId(null);
                  }}
                >
                  <Text style={styles.relapseButtonCancelText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.relapseButton, styles.relapseButtonConfirm]}
                  onPress={confirmRelapse}
                >
                  <Text style={styles.relapseButtonConfirmText}>{t('confirmRelapse')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView >
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
    backgroundColor: '#000',
    borderWidth: 1.5,
    borderRadius: 14,
    borderColor: '#000',
  },
  fixedDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  fixedDayTextSelected: {
    color: '#FFFFFF',
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
    color: '#00B763',
    fontWeight: '800',
  },
  dateNumberSelected: { color: '#FFFFFF' },
  habitsSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
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
  doneEditButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  doneEditText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  reorderButton: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
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
  optionsButton: {
    padding: 6,
    marginLeft: 4,
  },
  inlineMenuPopup: {
    position: 'absolute',
    top: 30,
    right: -17,
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  inlinePopupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  inlinePopupText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  inlinePopupDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
  },
  invisibleOverlay: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    zIndex: 90,
    elevation: 90,
  },
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
  createHabitText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
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
  saveButton: { backgroundColor: '#00B763' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },

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
    fontWeight: '700',
    color: '#1F2937',
  },
  dropdownMenu: {
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
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  dropdownOptionSelected: {
    color: '#00B763',
    fontWeight: '700',
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
    fontWeight: '600',
    color: '#6B7280'
  },
  formGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
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
  frequencyValueText: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
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
    fontWeight: '600',
    color: '#1F2937'
  },
  timeOfDayHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 10
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
  saveHabitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  fullscreenModalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  headerDoneText: { fontSize: 16, fontWeight: '700', color: '#00B763' },

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
  categoryTabText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  categoryTabTextActive: { color: '#FFFFFF' },
  iconScrollContainer: { flex: 1, padding: 16 },
  iconCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
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
  frequencyOptionTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  weekDaysPickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  weekDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayCircleText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },

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
    fontWeight: '700',
    color: '#4B5563'
  },

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
  streaksTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },

  streaksTopBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 12,
    paddingBottom: 40
  },

  streaksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  streakCard: { alignItems: 'center', flex: 1 },
  streakDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  streakLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginTop: 8 },
  streakNumber: { fontSize: 32, fontWeight: '800', marginVertical: 2 },
  streakSubtext: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
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
  bestText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  calendarSectionBox: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    paddingBottom: 200
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
  },
  monthNavButton: {
    padding: 6,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginBottom: 12,
  },
  weekDayCell: {
    width: CELL_WIDTH,
    alignItems: 'center',

  },
  weekDayText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  calendarGrid: { paddingLeft: 2, flexDirection: 'row', flexWrap: 'wrap', width: SCREEN_WIDTH, },
  calendarCell: { width: CELL_WIDTH, justifyContent: 'center', alignItems: 'center', paddingVertical: 8, },
  calendarDayNum: { color: '#1F2937', fontSize: 16, fontWeight: '600' },
  calendarDayNumToday: { color: '#00B763', fontSize: 16, fontWeight: '800' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },

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
    fontWeight: '600',
    color: '#1F2937',
  },
  reminderSaveButton: {
    width: '100%',
    backgroundColor: '#00B763',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  reminderSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reminderWindowCardContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reminderCardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  reminderCloseButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  reminderPickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: CONTAINER_HEIGHT,
    width: '100%',
    marginVertical: 15,
  },
  reminderPickerItem: {
    height: REMINDER_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  reminderPickerItemSelected: {
    backgroundColor: 'transparent',
  },
  reminderPickerText: {
    fontSize: 18,
    color: '#D1D5DB',
    fontWeight: '400',
    lineHeight: REMINDER_ITEM_HEIGHT,
    textAlign: 'center',
  },
  reminderPickerTextSelected: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '600',
    lineHeight: REMINDER_ITEM_HEIGHT,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  reminderTimeSeparator: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: REMINDER_ITEM_HEIGHT,
    textAlign: 'center',
  },
  swipeableContainer: {
    marginBottom: 10,
    borderRadius: 16,
    justifyContent: 'center',
  },
  swipeBackground: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
  },
  swipeBackgroundLeft: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 20,
    backgroundColor: '#DC2626',
  },
  habitCardGestural: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  habitCardCompletedGestural: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    elevation: 0,
    shadowOpacity: 0,
  },
  iconContainerGesture: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitleGestural: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937'
  },
  habitCardFailedGestural: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    elevation: 0,
    shadowOpacity: 0
  },
  habitTitleFailed: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through'
  },
  relapseModalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  relapseIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  relapseModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  relapseModalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  relapseModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12
  },
  relapseButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  relapseButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  relapseButtonCancelText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '700',
  },
  relapseButtonConfirm: {
    backgroundColor: '#DC2626'
  },
  relapseButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  streakBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  streakBadgeMiniText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});