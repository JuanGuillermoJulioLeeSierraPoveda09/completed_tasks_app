import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatDateKey } from '../../habitsStore';

const BRAND = '#00B763';
const HORIZONTAL_PADDING = 8;
const WEEKS_EACH_SIDE = 520;
const CENTER_INDEX = WEEKS_EACH_SIDE;
const WEEK_OFFSETS = Array.from({ length: WEEKS_EACH_SIDE * 2 + 1 }, (_, i) => i - WEEKS_EACH_SIDE);
const SPRING = { damping: 20, stiffness: 220, mass: 0.6 };

type DayProgress = { total: number; done: number };

const getWeekDates = (weekOffset: number) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const statusColor = ({ total, done }: DayProgress) => {
  if (total === 0) return 'transparent';
  if (done >= total) return '#10B981';
  if (done > 0) return '#F59E0B';
  return '#E5E7EB';
};

interface WeekPageProps {
  weekOffset: number;
  width: number;
  columnWidth: number;
  todayKey: string;
  getDayProgress: (date: Date) => DayProgress;
  onSelectDay: (index: number) => void;
}

const WeekPage = memo(({ weekOffset, width, columnWidth, todayKey, getDayProgress, onSelectDay }: WeekPageProps) => {
  const dates = getWeekDates(weekOffset);
  return (
    <View style={[styles.weekPage, { width }]}>
      {dates.map((date, index) => {
        const dateKey = formatDateKey(date);
        const isToday = dateKey === todayKey;
        const isFuture = dateKey > todayKey;
        return (
          <Pressable
            key={dateKey}
            style={[styles.dayCell, { width: columnWidth }]}
            onPress={() => onSelectDay(index)}
            hitSlop={4}
          >
            <Text style={[styles.dateNumber, isFuture && styles.dateNumberFuture, isToday && styles.dateNumberToday]}>
              {date.getDate()}
            </Text>
            <View
              style={[styles.statusDot, { backgroundColor: isFuture ? 'transparent' : statusColor(getDayProgress(date)) }]}
            />
          </Pressable>
        );
      })}
    </View>
  );
});

interface WeekStripProps {
  weekOffset: number;
  selectedDayIndex: number;
  weekDayLabels: string[];
  getDayProgress: (date: Date) => DayProgress;
  onChangeWeek: (weekOffset: number) => void;
  onSelectDay: (index: number) => void;
}

export default function WeekStrip({
  weekOffset,
  selectedDayIndex,
  weekDayLabels,
  getDayProgress,
  onChangeWeek,
  onSelectDay,
}: WeekStripProps) {
  const [width, setWidth] = useState(0);
  const listRef = useRef<FlatList<number>>(null);
  const visibleOffset = useRef(weekOffset);
  const columnWidth = width > 0 ? (width - HORIZONTAL_PADDING * 2) / 7 : 0;
  const todayKey = formatDateKey(new Date());

  const indicatorX = useSharedValue(0);
  useEffect(() => {
    if (columnWidth === 0) return;
    indicatorX.value = withSpring(HORIZONTAL_PADDING + selectedDayIndex * columnWidth, SPRING);
  }, [selectedDayIndex, columnWidth]);
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorX.value }] }));

  useEffect(() => {
    if (width === 0 || weekOffset === visibleOffset.current) return;
    const jump = Math.abs(weekOffset - visibleOffset.current);
    visibleOffset.current = weekOffset;
    listRef.current?.scrollToIndex({ index: CENTER_INDEX + weekOffset, animated: jump <= 4 });
  }, [weekOffset, width]);

  const handleLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const offset = index - CENTER_INDEX;
    if (offset === visibleOffset.current) return;
    visibleOffset.current = offset;
    Haptics.selectionAsync();
    onChangeWeek(offset);
  };

  const handleSelectDay = useCallback(
    (index: number) => {
      if (index !== selectedDayIndex) Haptics.selectionAsync();
      onSelectDay(index);
    },
    [selectedDayIndex, onSelectDay]
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {columnWidth > 0 && (
        <>
          <Animated.View pointerEvents="none" style={[styles.columnHighlight, { width: columnWidth }, indicatorStyle]} />
          <Animated.View pointerEvents="none" style={[styles.letterIndicatorTrack, { width: columnWidth }, indicatorStyle]}>
            <View style={styles.letterIndicator} />
          </Animated.View>
        </>
      )}

      <View style={styles.lettersRow}>
        {weekDayLabels.map((label, index) => (
          <Pressable
            key={index}
            style={[styles.letterCell, { width: columnWidth || undefined }]}
            onPress={() => handleSelectDay(index)}
            hitSlop={4}
          >
            <Text style={[styles.letterText, index === selectedDayIndex && styles.letterTextSelected]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {width > 0 && (
        <FlatList
          ref={listRef}
          data={WEEK_OFFSETS}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={CENTER_INDEX + weekOffset}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          keyExtractor={(item) => String(item)}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item }) => (
            <WeekPage
              weekOffset={item}
              width={width}
              columnWidth={columnWidth}
              todayKey={todayKey}
              getDayProgress={getDayProgress}
              onSelectDay={handleSelectDay}
            />
          )}
        />
      )}
    </View>
  );
}

const LETTER_SIZE = 30;
const LETTERS_ROW_TOP = 10;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  columnHighlight: {
    position: 'absolute',
    top: 4,
    bottom: 2,
    left: 0,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  letterIndicatorTrack: {
    position: 'absolute',
    top: LETTERS_ROW_TOP,
    left: 0,
    height: LETTER_SIZE,
    alignItems: 'center',
  },
  letterIndicator: {
    width: LETTER_SIZE,
    height: LETTER_SIZE,
    borderRadius: LETTER_SIZE / 2,
    backgroundColor: '#000000',
  },
  lettersRow: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: LETTERS_ROW_TOP,
    marginBottom: 6,
  },
  letterCell: {
    height: LETTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  letterTextSelected: {
    color: '#FFFFFF',
  },
  weekPage: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  dayCell: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateNumberFuture: {
    color: '#9CA3AF',
  },
  dateNumberToday: {
    color: BRAND,
    fontWeight: '800',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
});
