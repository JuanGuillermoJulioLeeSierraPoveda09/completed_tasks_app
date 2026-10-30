import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
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
  AppState,
  Vibration,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent
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
  runOnUI,
  cancelAnimation,
  useAnimatedReaction,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  Directions,
  ScrollView,
} from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import './i18n';
import * as Haptics from 'expo-haptics';
import {
  useHabitsStore,
  formatDateKey,
  parseDateKey,
  getHabitsForDate as habitsForDate,
  getDayProgress as dayProgress,
  isHabitDone,
  getQuitQuoteIndex,
  getQuitStreak as computeQuitStreak,
  computeStreakStats,
} from './habitsStore';
import type { Habit, HabitDraft, HabitType } from './habitsStore';
import {
  ensureReminderChannel,
  shouldShowNotificationPrompt,
  snoozeNotificationPrompt,
  requestNotificationPermission,
  scheduleHabitReminder,
  cancelHabitReminders,
  rescheduleAllHabitReminders,
  areNotificationsEnabled,
  openNotificationSettings,
} from './notifications';
import NotificationPermissionModal from './src/components/NotificationPermissionModal';
import WeekStrip from './src/components/WeekStrip';
import MonthCalendar from './src/components/MonthCalendar';
import { FONTS } from './fonts';
interface CustomTimePickerModalProps {
  visible: boolean;
  reminderSelectedHour: string;
  reminderSelectedMinute: string;
  reminderSelectedPeriod: 'AM' | 'PM';
  onConfirm: (hour: string, minute: string, period: 'AM' | 'PM') => void;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
    'fitness-outline', 'book-outline', 'water-outline', 'walk-outline', 'barbell-outline',
    'code-slash-outline', 'restaurant-outline', 'bed-outline', 'heart-outline',
    'bicycle-outline', 'musical-notes-outline', 'cafe-outline', 'pizza-outline', 'fast-food-outline',
    'nutrition-outline', 'game-controller-outline', 'camera-outline', 'brush-outline', 'laptop-outline',
    'beer-outline', 'wine-outline', 'ice-cream-outline', 'egg-outline',
    'fish-outline', 'pint-outline', 'basket-outline', 'cart-outline', 'cafe',
    'medkit-outline', 'sunny-outline', 'alarm-outline', 'airplane-outline',
    'bag-outline', 'balloon-outline', 'boat-outline', 'body-outline', 'briefcase-outline',
    'build-outline', 'bulb-outline', 'bus-outline', 'car-outline', 'cash-outline',
    'hourglass', 'cloud-outline', 'compass-outline', 'earth-outline',
    'flask-outline', 'glasses-outline', 'globe-outline',
    'hammer-outline', 'home-outline', 'key-outline', 'library-outline', 'map-outline',
    'moon-outline', 'partly-sunny-outline', 'paw-outline', 'planet-outline', 'rainy-outline',
    'rose-outline', 'school-outline', 'shirt-outline', 'stopwatch-outline',
    'time-outline', 'train-outline', 'trophy-outline',
    'umbrella-outline', 'wallet-outline', 'watch-outline', 'headset-outline', 'tv-outline',
    'american-football-outline', 'baseball-outline', 'basketball-outline', 'desktop-outline', 'dice-outline',
    'easel-outline', 'film-outline', 'golf-outline', 'hardware-chip-outline', 'images-outline',
    'journal-outline', 'mic-outline', 'color-palette-outline', 'radio-outline', 'reader-outline',
    'ticket-outline', 'videocam-outline', 'tennisball-outline', 'football-outline', 'chatbubbles-outline',
    'people-outline', 'person-outline', 'star-outline', 'happy-outline', 'leaf-outline',
    'flame-outline', 'thermometer-outline', 'timer-outline', 'cut-outline', 'snow-outline',
    'storefront-outline', 'bag-check-outline', 'beaker-outline', 'color-fill-outline', 'cube-outline',
    'trash-bin-outline', 'flower-outline', 'receipt-outline', 'bonfire-outline'
  ],
  Food: [
    'restaurant-outline', 'cafe-outline', 'pizza-outline', 'fast-food-outline',
    'nutrition-outline', 'beer-outline', 'wine-outline', 'ice-cream-outline',
    'egg-outline', 'fish-outline', 'pint-outline',
    'basket-outline', 'cart-outline', 'water-outline', 'leaf-outline',
    'flame-outline', 'thermometer-outline', 'timer-outline', 'snow-outline',
    'storefront-outline', 'bag-check-outline', 'beaker-outline', 'color-fill-outline', 'cube-outline',
    'trash-bin-outline', 'flower-outline', 'receipt-outline', 'bonfire-outline'
  ],
  Lifestyle: [
    'fitness-outline', 'walk-outline', 'barbell-outline', 'bed-outline',
    'leaf-outline', 'heart-outline', 'bicycle-outline', 'medkit-outline',
    'sunny-outline', 'alarm-outline', 'airplane-outline', 'bag-outline',
    'balloon-outline', 'boat-outline', 'body-outline', 'briefcase-outline',
    'build-outline', 'bulb-outline', 'bus-outline', 'car-outline',
    'cash-outline', 'hourglass', 'cloud-outline', 'compass-outline',
    'cut-outline', 'earth-outline', 'flame-outline', 'flask-outline',
    'flower-outline', 'glasses-outline', 'globe-outline', 'hammer-outline',
    'home-outline', 'key-outline', 'library-outline', 'map-outline',
    'moon-outline', 'partly-sunny-outline', 'paw-outline', 'planet-outline',
    'rainy-outline', 'rose-outline', 'school-outline', 'shirt-outline',
    'snow-outline', 'stopwatch-outline', 'thermometer-outline', 'time-outline',
    'train-outline', 'trophy-outline', 'umbrella-outline',
    'wallet-outline', 'watch-outline'
  ],
  Hobby: [
    'book-outline', 'code-slash-outline', 'musical-notes-outline',
    'game-controller-outline', 'camera-outline', 'brush-outline', 'laptop-outline',
    'headset-outline', 'tv-outline', 'american-football-outline', 'baseball-outline',
    'basketball-outline', 'desktop-outline', 'dice-outline', 'easel-outline',
    'film-outline', 'golf-outline', 'hardware-chip-outline', 'images-outline',
    'journal-outline', 'mic-outline', 'color-palette-outline', 'radio-outline',
    'reader-outline', 'ticket-outline', 'videocam-outline', 'tennisball-outline',
    'football-outline', 'chatbubbles-outline', 'people-outline', 'person-outline',
    'star-outline', 'happy-outline'
  ],
};

const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
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
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

const PADDED_HOURS = ['', ...INFINITE_HOURS, ''];
const PADDED_MINUTES = ['', ...INFINITE_MINUTES, ''];
const PADDED_PERIODS = ['', ...REMINDER_PERIODS, ''];

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

const PERIOD_MAX_OFFSET = (REMINDER_PERIODS.length - 1) * REMINDER_ITEM_HEIGHT;

const PeriodWheel: React.FC<{
  visible: boolean;
  initialPeriod: 'AM' | 'PM';
  period: 'AM' | 'PM';
  onChange: (period: 'AM' | 'PM') => void;
}> = ({ visible, initialPeriod, period, onChange }) => {
  const offset = useSharedValue(REMINDER_PERIODS.indexOf(initialPeriod) * REMINDER_ITEM_HEIGHT);
  const startOffset = useSharedValue(0);
  const lastIndex = useSharedValue(REMINDER_PERIODS.indexOf(initialPeriod));

  useEffect(() => {
    if (!visible) return;
    const index = REMINDER_PERIODS.indexOf(initialPeriod);
    cancelAnimation(offset);
    offset.value = index * REMINDER_ITEM_HEIGHT;
    lastIndex.value = index;
  }, [visible, initialPeriod]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      cancelAnimation(offset);
      startOffset.value = offset.value;
    })
    .onUpdate((e) => {
      offset.value = Math.min(Math.max(startOffset.value - e.translationY, 0), PERIOD_MAX_OFFSET);
      const index = Math.round(offset.value / REMINDER_ITEM_HEIGHT);
      if (index !== lastIndex.value) {
        lastIndex.value = index;
        runOnJS(onChange)(REMINDER_PERIODS[index]);
      }
    })
    .onFinalize((e) => {
      const projected = Math.min(Math.max(offset.value - e.velocityY * 0.1, 0), PERIOD_MAX_OFFSET);
      const index = Math.round(projected / REMINDER_ITEM_HEIGHT);
      lastIndex.value = index;
      offset.value = withTiming(index * REMINDER_ITEM_HEIGHT, { duration: 180 });
      runOnJS(onChange)(REMINDER_PERIODS[index]);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ height: CONTAINER_HEIGHT, width: 60, overflow: 'hidden' }}>
        <Animated.View style={animatedStyle}>
          {PADDED_PERIODS.map((item, index) => (
            <MemorizedPickerItem key={`p-${index}-${item}`} item={item} isSelected={item === period} />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

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
  const hourFlatListRef = useRef<FlatList>(null);
  const minuteFlatListRef = useRef<FlatList>(null);

  const baseHour = parseInt(reminderSelectedHour, 10) || 5;
  const initialHourIndex = (LOOP_FACTOR / 2) * 12 + (baseHour - 1);
  const baseMinute = parseInt(reminderSelectedMinute, 10) || 0;
  const initialMinuteIndex = (LOOP_FACTOR / 2) * 60 + baseMinute;

  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setHour(String(baseHour));
      setMinute(reminderSelectedMinute);
      setPeriod(reminderSelectedPeriod);
    }
  }

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
      <GestureHandlerRootView style={{ flex: 1 }}>
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
              initialScrollIndex={initialHourIndex}
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
              initialScrollIndex={initialMinuteIndex}
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
            <PeriodWheel
              visible={visible}
              initialPeriod={reminderSelectedPeriod}
              period={period}
              onChange={setPeriod}
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
      </GestureHandlerRootView>
    </Modal>
  );
};

const CARD_GAP = 10;
const CARD_FALLBACK_HEIGHT = 83;

type CardInfo = { g: string; i: number; h: number };
type InfoMap = Record<string, CardInfo>;

interface DragContext {
  info: SharedValue<InfoMap>;
  dragId: SharedValue<string>;
  dragTo: SharedValue<number>;
  committing: SharedValue<boolean>;
}

const hOf = (info: InfoMap, k: string): number => {
  'worklet';
  const h = info[k].h;
  return h > 0 ? h : CARD_FALLBACK_HEIGHT;
};

const groupIdsSorted = (info: InfoMap, g: string): string[] => {
  'worklet';
  const ids: string[] = [];
  for (const k in info) {
    if (info[k].g === g) ids.push(k);
  }
  ids.sort((a, b) => info[a].i - info[b].i);
  return ids;
};

const virtualOrder = (info: InfoMap, g: string, dragId: string, to: number): string[] => {
  'worklet';
  const ids = groupIdsSorted(info, g);
  const from = dragId ? ids.indexOf(dragId) : -1;
  if (from === -1) return ids;
  ids.splice(from, 1);
  ids.splice(Math.max(0, Math.min(to, ids.length)), 0, dragId);
  return ids;
};

const topOf = (info: InfoMap, ids: string[], id: string): number => {
  'worklet';
  let y = 0;
  for (let n = 0; n < ids.length; n++) {
    if (ids[n] === id) return y;
    y += hOf(info, ids[n]) + CARD_GAP;
  }
  return y;
};

const stackHeight = (info: InfoMap, ids: string[]): number => {
  'worklet';
  let y = 0;
  for (let n = 0; n < ids.length; n++) {
    y += hOf(info, ids[n]) + CARD_GAP;
  }
  return Math.max(0, y - CARD_GAP);
};

const dropIndex = (info: InfoMap, g: string, id: string, centerY: number): number => {
  'worklet';
  const others = groupIdsSorted(info, g).filter((k) => k !== id);
  const H = hOf(info, id);
  let best = 0;
  let bestDist = Infinity;
  let y = 0;
  for (let t = 0; t <= others.length; t++) {
    const d = Math.abs(y + H / 2 - centerY);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
    if (t < others.length) y += hOf(info, others[t]) + CARD_GAP;
  }
  return best;
};

const GroupMeasureContext = React.createContext<(id: string, h: number) => void>(() => {});

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
  onReorder?: (habitId: string, toIndex: number, groupKey: string) => void;
  isMenuOpen?: boolean;
  onToggleMenu?: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  index?: number;
  positioned?: boolean;
  groupKey?: string;
  drag: DragContext;
  onDragCancel?: () => void;
}

const NEVER_OFFSET = 100000;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const RELAPSE_THRESHOLD = SCREEN_WIDTH * 0.4;
const SwipeableHabitCardBase: React.FC<SwipeableHabitCardProps> = ({
  habit,
  isCompleted,
  isFailed = false,
  onToggle,
  onRelapse,
  displayDescription,
  streak,
  isEditMode = false,
  onLongPress,
  onReorder,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  index = 0,
  positioned = false,
  groupKey = '',
  drag,
  onDragCancel
}) => {
  const { t } = useTranslation();
  const { info, dragId, dragTo, committing } = drag;
  const reportHeight = React.useContext(GroupMeasureContext);
  const habitId = habit.id;
  const translateX = useSharedValue(0);
  const animTop = useSharedValue(index * (CARD_FALLBACK_HEIGHT + CARD_GAP));
  const dragStartTop = useSharedValue(0);
  const isDragged = useSharedValue(false);
  const settling = useSharedValue(false);
  const menuOpen = useSharedValue(false);
  const isQuitHabit = habit.type === 'Quit a habit';

  useEffect(() => {
    menuOpen.value = !!isMenuOpen;
  }, [isMenuOpen]);

  useAnimatedReaction(
    () => {
      if (!positioned) return -1;
      const m = info.value;
      if (!m[habitId]) return -1;
      return topOf(m, virtualOrder(m, groupKey, dragId.value, dragTo.value), habitId);
    },
    (target, previous) => {
      if (target < 0 || target === previous || isDragged.value) return;
      animTop.value = withTiming(target, { duration: 150 });
    }
  );

  useAnimatedReaction(
    () => dragId.value === '' && !committing.value,
    (idle) => {
      if (idle && isDragged.value) isDragged.value = false;
    }
  );

  const triggerSwapHaptics = () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  const canReorder = isEditMode && positioned;
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .activeOffsetY(canReorder ? [-10, 10] : [-NEVER_OFFSET, NEVER_OFFSET])
    .failOffsetY(canReorder ? [-NEVER_OFFSET, NEVER_OFFSET] : [-15, 15])
    .onStart(() => {
      if (isEditMode && positioned) {
        if (committing.value || dragId.value !== '') return;
        const m = info.value;
        const from = groupIdsSorted(m, groupKey).indexOf(habitId);
        if (from === -1) return;
        cancelAnimation(animTop);
        settling.value = false;
        dragStartTop.value = animTop.value;
        isDragged.value = true;
        dragTo.value = from;
        dragId.value = habitId;
      }
    })
    .onUpdate((event) => {
      if (isEditMode && positioned) {
        if (!isDragged.value || dragId.value !== habitId) return;
        const m = info.value;
        const me = m[habitId];
        if (!me) return;
        const maxTop = Math.max(0, stackHeight(m, groupIdsSorted(m, groupKey)) - me.h);
        const top = Math.max(0, Math.min(dragStartTop.value + event.translationY, maxTop));
        animTop.value = top;
        const target = dropIndex(m, groupKey, habitId, top + me.h / 2);
        if (target !== dragTo.value) {
          dragTo.value = target;
          runOnJS(triggerSwapHaptics)();
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
      if (isEditMode && positioned) {
        if (!isDragged.value) return;
        const m = info.value;
        const from = groupIdsSorted(m, groupKey).indexOf(habitId);
        const to = dragTo.value;
        const finalTop = topOf(m, virtualOrder(m, groupKey, habitId, to), habitId);
        settling.value = true;
        animTop.value = withSpring(finalTop, {}, (finished) => {
          if (finished) settling.value = false;
        });
        if (to === from) {
          isDragged.value = false;
          dragId.value = '';
          dragTo.value = -1;
          committing.value = false;
        } else {
          committing.value = true;
          if (onReorder) runOnJS(onReorder)(habit.id, to, groupKey);
        }
      } else if (!isCompleted && !isFailed) {
        if (event.translationX > SWIPE_THRESHOLD) {
          translateX.value = withTiming(SCREEN_WIDTH, {}, () => {
            runOnJS(onToggle)(habit.id);
            translateX.value = 0;
          });
        } else if (isQuitHabit && event.translationX < -RELAPSE_THRESHOLD) {
          translateX.value = withSpring(0);
          if (onRelapse) {
            runOnJS(onRelapse)(habit.id);
          }
        } else {
          translateX.value = withSpring(0);
        }
      }
    })
    .onFinalize((_event, success) => {
      if (onDragCancel) runOnJS(onDragCancel)();
      if (positioned && !success && isDragged.value && !committing.value) {
        const m = info.value;
        animTop.value = withSpring(topOf(m, groupIdsSorted(m, groupKey), habitId));
        isDragged.value = false;
        dragId.value = '';
        dragTo.value = -1;
      }
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
    transform: [{ translateX: translateX.value }],
  }));
  const rContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animTop.value }],
    zIndex: isDragged.value || settling.value ? 30 : menuOpen.value ? 10 : 1,
  }));
  const rBackgroundRightStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(translateX.value / SWIPE_THRESHOLD, 1) : 0,
    zIndex: translateX.value > 0 ? 1 : -1,
  }));
  const rBackgroundLeftStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(Math.abs(translateX.value) / RELAPSE_THRESHOLD, 1) : 0,
    zIndex: translateX.value < 0 ? 1 : -1,
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    reportHeight(habitId, h);
    runOnUI((id: string, g: string, i: number, height: number) => {
      'worklet';
      const m = info.value;
      const old = m[id];
      if (old && old.h === height && old.g === g) return;
      info.value = { ...m, [id]: { g, i: old ? old.i : i, h: height } };
    })(habitId, groupKey, index, h);
  };
  return (
    <Animated.View
      layout={positioned ? undefined : LinearTransition.duration(200)}
      onLayout={groupKey ? handleLayout : undefined}
      style={[
        styles.swipeableContainer,
        positioned
          ? [styles.positionedContainer, rContainerStyle]
          : { zIndex: isMenuOpen ? 10 : 1, elevation: 0 },
      ]}>
      {!isCompleted && (
        <>
          <Animated.View style={[styles.swipeBackground, { backgroundColor: habit.color }, rBackgroundRightStyle]}>
            <Ionicons name={"trophy-outline"} size={32} color="#FFFFFF" />
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
                <Animated.View entering={FadeIn} style={{ position: 'relative', zIndex: 100 }}>
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
                </Animated.View>
              )}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

const SwipeableHabitCard = React.memo(SwipeableHabitCardBase);
const PendingGroupList: React.FC<{
  groupKey: string;
  ids: string[];
  version: unknown;
  raised: boolean;
  drag: DragContext;
  onIdsChange?: (groupKey: string, ids: string[]) => void;
  children: React.ReactNode;
}> = ({ groupKey, ids, version, raised, drag, onIdsChange, children }) => {
  const { info, dragId, dragTo, committing } = drag;
  const [heights, setHeights] = useState<Record<string, number>>({});
  const idsKey = ids.join('|');
  const reportHeight = React.useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  useLayoutEffect(() => {
    onIdsChange?.(groupKey, ids);
    runOnUI((g: string, list: string[]) => {
      'worklet';
      const prev = info.value;
      const next: InfoMap = {};
      for (const k in prev) {
        if (prev[k].g !== g) next[k] = prev[k];
      }
      for (let n = 0; n < list.length; n++) {
        const old = prev[list[n]];
        next[list[n]] = { g, i: n, h: old ? old.h : 0 };
      }
      info.value = next;
      const dId = dragId.value;
      if (committing.value && dId !== '' && next[dId] && next[dId].g === g) {
        committing.value = false;
        dragId.value = '';
        dragTo.value = -1;
      }
    })(groupKey, ids);
  }, [groupKey, idsKey, version]);

  const total = ids.reduce((sum, id) => sum + (heights[id] ?? CARD_FALLBACK_HEIGHT) + CARD_GAP, 0);

  return (
    <GroupMeasureContext.Provider value={reportHeight}>
      <View style={{ height: total, zIndex: raised ? 5 : 1 }}>{children}</View>
    </GroupMeasureContext.Provider>
  );
};

type TFn = (key: string) => string;
type FrequencyType = 'days_of_week' | 'days_of_month' | 'some_days';
const everyWeekDay = () => [true, true, true, true, true, true, true];

const getOrdinalSuffix = (day: number, t: TFn) => {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}${t('first')}`;
    case 2: return `${day}${t('second')}`;
    case 3: return `${day}${t('third')}`;
    default: return `${day}${t('th')}`;
  }
};

const formatMonthDaysDisplay = (days: number[], t: TFn): string => {
  if (days.length === 0) return t('selectAtLeast1Day');

  const sorted = [...days].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let prevDay = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const currentDay = sorted[i];
    if (currentDay !== prevDay + 1) {
      if (rangeStart === prevDay) {
        ranges.push(getOrdinalSuffix(rangeStart, t));
      } else if (prevDay === rangeStart + 1) {
        ranges.push(`${getOrdinalSuffix(rangeStart, t)}, ${getOrdinalSuffix(prevDay, t)}`);
      } else {
        ranges.push(`${getOrdinalSuffix(rangeStart, t)} - ${getOrdinalSuffix(prevDay, t)}`);
      }
      rangeStart = currentDay;
    }
    prevDay = currentDay;
  }
  return `${ranges.join(', ')} ${t('ofEachMonth')}`;
};

const describeWeekDays = (daysArr: boolean[], t: TFn): string => {
  const [sun, mon, tue, wed, thu, fri, sat] = daysArr;
  const count = daysArr.filter(Boolean).length;
  const dayNames = [t('Sunday'), t('Monday'), t('Tuesday'), t('Wednesday'), t('Thursday'), t('Friday'), t('Saturday')];
  if (count === 7) {
    return t('everyday');
  } else if (count === 6) {
    const missingIndex = daysArr.findIndex((val) => !val);
    return `${t('everydayBut')} ${dayNames[missingIndex]}`;
  } else if (count === 5 && mon && tue && wed && thu && fri && !sun && !sat) {
    return t('weekdays');
  } else if (count === 3 && tue && wed && thu && !sun && !mon && !fri && !sat) {
    return t('midweek');
  } else if (count === 2 && sun && sat && !mon && !tue && !wed && !thu && !fri) {
    return t('weekend');
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
      return `${t('from')}${dayNames[startIdx]} ${t('to')} ${dayNames[endIdx]}`;
    }
  } else if (count === 0) {
    return t('selectAtLeast1Day');
  }
  return daysArr
    .map((isSelected, index) => (isSelected ? dayNames[index] : null))
    .filter(Boolean)
    .join(', ');
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
  const currentLocale = i18n.language === 'es' ? 'es-ES' : i18n.language === 'jp' ? 'ja-JP' : 'en-US';
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
              {AVAILABLE_COLORS.map((color) => {
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

const MainHeader = React.memo<{
  dateText: string;
  isTodayCompleted: boolean;
  streak: number;
  onDatePress: () => void;
  onStreakPress: () => void;
}>(({ dateText, isTodayCompleted, streak, onDatePress, onStreakPress }) => (
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

      <TouchableOpacity style={styles.settingsButton}>
        <Ionicons name="settings-outline" size={22} color="#1F2937" />
      </TouchableOpacity>
    </View>
  </View>
));

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
  const toggleCompletion = useHabitsStore((s) => s.toggleCompletion);
  const confirmRelapseInStore = useHabitsStore((s) => s.confirmRelapse);
  const createHabit = useHabitsStore((s) => s.createHabit);
  const updateHabit = useHabitsStore((s) => s.updateHabit);
  const deleteHabit = useHabitsStore((s) => s.deleteHabit);
  const reorderHabit = useHabitsStore((s) => s.reorderHabit);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(new Date().getDay());
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

  const headerDateText = useMemo(() => {
    const isToday = formatDateKey(new Date()) === formatDateKey(activeDate);
    const dayName = activeDate.toLocaleDateString(currentLocale, {weekday: 'short' });
    const monthName = activeDate.toLocaleDateString(currentLocale, { month: 'short' });
    return `${isToday ? t('today') + ', ' : ''}${dayName} ${monthName} ${activeDate.getDate()}`;
  }, [activeDate, currentLocale, t]);

  const handleHeaderDatePress = useCallback(() => {
    const today = new Date();
    const todayStr = formatDateKey(today);
    const activeStr = formatDateKey(activeDate);
    setActiveMenuHabitId(null);
    if (activeStr !== todayStr) {
      setWeekOffset(0);
      setSelectedDayIndex(today.getDay());
    } else {
      setIsStreaksModalVisible(true);
    }
  }, [activeDate]);

  const getDayProgress = useCallback(
    (date: Date) => dayProgress(habits, habitLogs, relapseLogs, date),
    [habits, habitLogs, relapseLogs]
  );
  const getQuitStreak = (habit: Habit) => computeQuitStreak(habit, relapseLogs, activeDate);

  const getDisplayDescription = (habit: Habit) => {
    const quoteIndex = getQuitQuoteIndex(habit, activeDateKey);
    return quoteIndex === null ? habit.description : QUIT_QUOTES_KEYS[quoteIndex];
  };

  const handleToggle = useCallback(
    (habitId: string) => toggleCompletion(habitId, activeDateKey),
    [toggleCompletion, activeDateKey]
  );

  const handleRelapse = useCallback((habitId: string) => {
    setRelapsingHabitId(habitId);
    setIsRelapseModalVisible(true);
  }, []);

  const confirmRelapse = () => {
    if (relapsingHabitId) {
      confirmRelapseInStore(relapsingHabitId, activeDateKey);
    }
    setIsRelapseModalVisible(false);
    setRelapsingHabitId(null);
  };

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

  const visibleHabits = useMemo(() => habitsForDate(habits, activeDate), [habits, activeDate]);

  const handleSelectWeekDay = useCallback((index: number) => {
    setSelectedDayIndex(index);
    setActiveMenuHabitId(null);
  }, []);

  const streakStats = useMemo(() => computeStreakStats(habits, habitLogs, relapseLogs), [habits, habitLogs, relapseLogs]);

  const handleSelectedCalendarDay = useCallback((targetDate: Date) => {
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
    setActiveMenuHabitId(null);
  }, []);

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

  const isTodayCompleted = useMemo(() => {
    const progress = getDayProgress(new Date());
    return progress.total > 0 && progress.done >= progress.total;
  }, [getDayProgress]);

  return (
    <GestureHandlerRootView>
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
          />
          <ScrollView
            style={styles.mainContent}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => activeMenuHabitId && setActiveMenuHabitId(null)}>
            <View style={styles.calendarShadowBox}>
              <View style={styles.calendarContainer}>
                <WeekStrip
                  weekOffset={weekOffset}
                  selectedDayIndex={selectedDayIndex}
                  weekDayLabels={WEEK_DAYS}
                  getDayProgress={getDayProgress}
                  onChangeWeek={setWeekOffset}
                  onSelectDay={handleSelectWeekDay}
                />
              </View>
            </View>

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
                  const todayStr = formatDateKey(new Date());
                  const isHabitCompleted = (h: Habit) =>
                    isHabitDone(h, activeDateKey, habitLogs, relapseLogs, todayStr);
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
                                <SwipeableHabitCard
                                  habit={habit}
                                  isCompleted={true}
                                  isFailed={false}
                                  onToggle={handleToggle}
                                  displayDescription={getDisplayDescription(habit)}
                                  streak={habit.type === 'Quit a habit' ? getQuitStreak(habit) : undefined}
                                  isMenuOpen={activeMenuHabitId === habit.id}
                                  onToggleMenu={handleToggleMenu}
                                  onEdit={handleStartEdit}
                                  onDelete={handleDeleteHabit}
                                  drag={dragCtx}
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
          </ScrollView>


          <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
            {([
              { key: 'menu', icon: 'grid', label: t('menu'), active: true },
              { key: 'new', icon: 'add-circle-outline', label: t('newHabit'), onPress: openCreateForm },
              { key: 'analytics', icon: 'bar-chart-outline', label: t('analytics') },
              { key: 'me', icon: 'person-outline', label: t('me'), onPress: handleMePress },
            ] as { key: string; icon: React.ComponentProps<typeof Ionicons>['name']; label: string; active?: boolean; onPress?: () => void }[]).map((tab) => (
              <TouchableOpacity key={tab.key} style={styles.bottomTab} onPress={tab.onPress} activeOpacity={0.7}>
                <View style={[styles.bottomTabPill, tab.active && styles.bottomTabPillActive]}>
                  <Ionicons name={tab.icon} size={21} color="#111111" />
                  <Text style={[styles.bottomTabText, tab.active && styles.bottomTabTextActive]} numberOfLines={1}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </SafeAreaView>
        </View>
        <HabitFormModal
          visible={isModalVisible}
          sessionKey={formSession}
          habit={editingHabitId ? habits.find((h) => h.id === editingHabitId) : undefined}
          onClose={handleCloseForm}
          onSave={handleSaveHabit}
        />

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
              <MonthCalendar
                weekDayLabels={WEEK_DAYS}
                locale={currentLocale}
                getDayProgress={getDayProgress}
                onSelectDate={handleSelectedCalendarDay}
              />
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

        <NotificationPermissionModal
          visible={isNotificationPromptVisible}
          onEnable={handleEnableNotifications}
          onLater={handleNotificationPromptLater}
        />
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
  doneEditButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  doneEditText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
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
  emptyText: { color: '#4B5563', fontFamily: FONTS.semiBold, fontSize: 14 },
  emptySubtext: { color: '#9CA3AF', fontSize: 12, fontFamily: FONTS.regular, marginTop: 4 },
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
  habitTitle: { fontSize: 15, fontFamily: FONTS.semiBold, color: '#1F2937' },
  habitTitleCompleted: { textDecorationLine: 'line-through', color: '#6B7280' },
  habitDescription: { fontSize: 12, fontFamily: FONTS.regular, color: '#6B7280', marginTop: 2 },
  optionsButton: {
    paddingLeft: 6,
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
    fontFamily: FONTS.semiBold,
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
    //elevation: 90,
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
  createHabitText: { color: '#FFFFFF', fontFamily: FONTS.semiBold, fontSize: 15 },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomTab: { flex: 1, alignItems: 'center', paddingBottom: 8 },
  bottomTabPill: {
    minWidth: 72,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabPillActive: { backgroundColor: '#ECECEC' },
  bottomTabText: { fontSize: 11, fontFamily: FONTS.medium, color: '#111111', marginTop: 2, letterSpacing: 0.2 },
  bottomTabTextActive: { fontFamily: FONTS.semiBold },

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
  modalTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 16, color: '#1F2937' },
  modalSubtitle: { fontSize: 14, fontFamily: FONTS.bold, marginBottom: 10, color: '#3b3b3b' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5D8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelButton: { backgroundColor: '#F3F4F6' },
  cancelButtonText: { color: '#4B5563', fontFamily: FONTS.semiBold },
  saveButton: { backgroundColor: '#00B763' },
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
    fontFamily: FONTS.medium,
  },
  dropdownOptionSelected: {
    color: '#00B763',
    fontFamily: FONTS.bold,
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
    fontFamily: FONTS.semiBold,
    color: '#1F2937'
  },
  timeOfDayHeader: {
    fontSize: 16,
    fontFamily: FONTS.bold,
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
    fontFamily: FONTS.bold,
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.regular,
    lineHeight: REMINDER_ITEM_HEIGHT,
    textAlign: 'center',
  },
  reminderPickerTextSelected: {
    fontSize: 20,
    color: '#000000',
    fontFamily: FONTS.semiBold,
    lineHeight: REMINDER_ITEM_HEIGHT,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  reminderTimeSeparator: {
    color: '#000000',
    fontSize: 24,
    fontFamily: FONTS.bold,
    lineHeight: REMINDER_ITEM_HEIGHT,
    textAlign: 'center',
  },
  positionedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    marginBottom: 0,
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
    borderRadius: 12,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitleGestural: {
    fontSize: 16,
    fontFamily: FONTS.bold,
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
    fontFamily: FONTS.extraBold,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  relapseModalText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.bold,
  },
  relapseButtonConfirm: {
    backgroundColor: '#DC2626'
  },
  relapseButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.bold
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
    fontFamily: FONTS.extraBold,
  },
});