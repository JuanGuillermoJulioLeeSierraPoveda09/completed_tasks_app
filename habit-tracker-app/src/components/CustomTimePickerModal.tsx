import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, cancelAnimation } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { FONTS } from '../../fonts';

interface CustomTimePickerModalProps {
  visible: boolean;
  reminderSelectedHour: string;
  reminderSelectedMinute: string;
  reminderSelectedPeriod: 'AM' | 'PM';
  onConfirm: (hour: string, minute: string, period: 'AM' | 'PM') => void;
  onClose: () => void;
}

const REMINDER_ITEM_HEIGHT = 45;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = REMINDER_ITEM_HEIGHT * VISIBLE_ITEMS;
const REMINDER_PERIODS = ["AM", "PM"] as const;
const LOOP_FACTOR = 100;
const INFINITE_HOURS = Array.from({ length: 12 * LOOP_FACTOR }, (_, i) => String((i % 12) + 1));
const INFINITE_MINUTES = Array.from({ length: 60 * LOOP_FACTOR }, (_, i) => String(i % 60).padStart(2, '0'));

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

const CustomTimePickerModal: React.FC<CustomTimePickerModalProps> = ({
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
});

export default CustomTimePickerModal;
