import React, { memo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatDateKey } from '../../habitsStore';

import { FONTS } from '../../fonts';
const MONTHS_EACH_SIDE = 240;
const CENTER_INDEX = MONTHS_EACH_SIDE;
const MONTH_OFFSETS = Array.from({ length: MONTHS_EACH_SIDE * 2 + 1 }, (_, i) => i - MONTHS_EACH_SIDE);
const DAYS_PER_ROW = 7;
const ROWS_PER_MONTH = 6;
const CELLS_PER_MONTH = DAYS_PER_ROW * ROWS_PER_MONTH;

type DayProgress = { total: number; done: number };

const monthStart = (monthOffset: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
};

const getMonthCells = (monthOffset: number) => {
  const first = monthStart(monthOffset);
  const month = first.getMonth();
  return Array.from({ length: CELLS_PER_MONTH }, (_, i) => {
    const date = new Date(first.getFullYear(), month, 1 - first.getDay() + i);
    return { date, isCurrentMonth: date.getMonth() === month };
  });
};

const statusColor = ({ total, done }: DayProgress) => {
  if (done === 0) return '#CBD5E1';
  return total > 0 && done >= total ? '#10B981' : '#F59E0B';
};
const progressCaches = new WeakMap<(date: Date) => DayProgress, Map<string, DayProgress>>();
const getCachedProgress = (getDayProgress: (date: Date) => DayProgress, date: Date, dateKey: string, todayKey: string) => {
  let cache = progressCaches.get(getDayProgress);
  if (!cache) {
    cache = new Map();
    progressCaches.set(getDayProgress, cache);
  }
  const key = `${todayKey}|${dateKey}`;
  let progress = cache.get(key);
  if (!progress) {
    progress = getDayProgress(date);
    cache.set(key, progress);
  }
  return progress;
};

interface MonthPageProps {
  monthOffset: number;
  width: number;
  cellWidth: number;
  todayKey: string;
  getDayProgress: (date: Date) => DayProgress;
  onSelectDate: (date: Date) => void;
}

const MonthPage = memo(({ monthOffset, width, cellWidth, todayKey, getDayProgress, onSelectDate }: MonthPageProps) => {
  const cells = getMonthCells(monthOffset);
  const gridHeight = useRef(0);
  const handlePress = (e: GestureResponderEvent) => {
    if (gridHeight.current === 0 || cellWidth === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    const column = Math.min(Math.max(Math.floor(locationX / cellWidth), 0), DAYS_PER_ROW - 1);
    const row = Math.min(Math.max(Math.floor(locationY / (gridHeight.current / ROWS_PER_MONTH)), 0), ROWS_PER_MONTH - 1);
    onSelectDate(cells[row * DAYS_PER_ROW + column].date);
  };

  return (
    <Pressable onPress={handlePress} onLayout={(e) => { gridHeight.current = e.nativeEvent.layout.height; }}>
      <View pointerEvents="none" style={[styles.monthGrid, { width }]}>
        {cells.map(({ date, isCurrentMonth }) => {
          const dateKey = formatDateKey(date);
          const isToday = dateKey === todayKey;
          return (
            <View key={dateKey} style={[styles.dayCell, { width: cellWidth }]}>
              <Text style={[styles.dayNumber, !isCurrentMonth && styles.dayNumberOutside, isToday && styles.dayNumberToday]}>
                {date.getDate()}
              </Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isCurrentMonth ? statusColor(getCachedProgress(getDayProgress, date, dateKey, todayKey)) : 'transparent' },
                ]}
              />
            </View>
          );
        })}
      </View>
    </Pressable>
  );
});

interface MonthCalendarProps {
  weekDayLabels: string[];
  locale: string;
  getDayProgress: (date: Date) => DayProgress;
  onSelectDate: (date: Date) => void;
}

function MonthCalendar({ weekDayLabels, locale, getDayProgress, onSelectDate }: MonthCalendarProps) {
  const [width, setWidth] = useState(0);
  const [visibleOffset, setVisibleOffset] = useState(0);
  const visibleOffsetRef = useRef(0);
  const listRef = useRef<FlatList<number>>(null);
  const cellWidth = width / 7;
  const todayKey = formatDateKey(new Date());

  const title = monthStart(visibleOffset).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const handleLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const goToMonth = (offset: number, animated: boolean) => {
    const clamped = Math.max(-MONTHS_EACH_SIDE, Math.min(MONTHS_EACH_SIDE, offset));
    listRef.current?.scrollToIndex({ index: CENTER_INDEX + clamped, animated });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const offset = Math.round(e.nativeEvent.contentOffset.x / width) - CENTER_INDEX;
    if (offset === visibleOffsetRef.current) return;
    visibleOffsetRef.current = offset;
    setVisibleOffset(offset);
    Haptics.selectionAsync();
  };

  const handleTitlePress = () => {
    if (visibleOffsetRef.current === 0) return;
    goToMonth(0, Math.abs(visibleOffsetRef.current) <= 4);
  };

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goToMonth(visibleOffsetRef.current - 1, true)} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleTitlePress}>
          <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goToMonth(visibleOffsetRef.current + 1, true)} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysRow} onLayout={handleLayout}>
        {weekDayLabels.map((label, index) => (
          <View key={index} style={[styles.weekDayCell, { width: cellWidth || undefined }]}>
            <Text style={styles.weekDayText}>{label}</Text>
          </View>
        ))}
      </View>

      {width > 0 && (
        <FlatList
          ref={listRef}
          data={MONTH_OFFSETS}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={CENTER_INDEX}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          keyExtractor={(item) => String(item)}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <MonthPage
              monthOffset={item}
              width={width}
              cellWidth={cellWidth}
              todayKey={todayKey}
              getDayProgress={getDayProgress}
              onSelectDate={onSelectDate}
            />
          )}
        />
      )}
    </View>
  );
}
export default memo(MonthCalendar);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  navButton: {
    padding: 6,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayCell: {
    alignItems: 'center',
  },
  weekDayText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dayNumber: {
    color: '#1F2937',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  dayNumberOutside: {
    color: '#9CA3AF',
  },
  dayNumberToday: {
    color: '#00B763',
    fontFamily: FONTS.extraBold,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
  },
});
