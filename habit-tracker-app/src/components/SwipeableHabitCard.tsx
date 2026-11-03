import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform, type LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, runOnUI, cancelAnimation, useAnimatedReaction, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { type Habit } from '../../habitsStore';
import { CARD_GAP, CARD_FALLBACK_HEIGHT, type DragContext, groupIdsSorted, virtualOrder, topOf, stackHeight, dropIndex, GroupMeasureContext } from '../utils/dragLayout';
import HabitCardMenu from './HabitCardMenu';
import { cardStyles } from '../styles/habitCardStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
      onLayout={groupKey ? handleLayout : undefined}
      style={[
        cardStyles.swipeableContainer,
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
          cardStyles.habitCardGestural,
          rStyle,
          isCompleted && cardStyles.habitCardCompletedGestural,
          isFailed && styles.habitCardFailedGestural,
        ]}>
          <View style={[
            cardStyles.iconContainerGesture,
            { backgroundColor: isCompleted ? '#F3F4F6' : (isFailed ? '#FEE2E2' : habit.color + '15') }]}>
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : (habit.icon as any)}
              size={24}
              color={isCompleted ? '#9CA3AF' : (isFailed ? '#DC2626' : habit.color)}
            />
          </View>
          <View style={cardStyles.habitInfo}>
            <Text style={[
              cardStyles.habitTitleGestural,
              isCompleted && cardStyles.habitTitleCompleted,
              isFailed && styles.habitTitleFailed
            ]}>
              {habit.title}
            </Text>
            {displayDescription ? <Text style={cardStyles.habitDescription}>{displayDescription}</Text> : null}
          </View>

          {isEditMode && !isCompleted && !isFailed ? (
            <Animated.View entering={FadeIn} style={styles.reorderControls}>
              <Ionicons name="menu-outline" size={26} color="#9CA3AF" />
            </Animated.View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
              {isQuitHabit && !isFailed && streak !== undefined && (
                <View style={[cardStyles.streakBadgeMini, { backgroundColor: habit.color }]}>
                  <Ionicons name="flame" size={12} color="#FFFFFF" />
                  <Text style={cardStyles.streakBadgeMiniText}>{streak}</Text>
                </View>
              )}

              {!isEditMode && onToggleMenu && (
                <HabitCardMenu
                  habitId={habit.id}
                  isMenuOpen={isMenuOpen}
                  onToggleMenu={onToggleMenu}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

const SwipeableHabitCard = React.memo(SwipeableHabitCardBase);

const styles = StyleSheet.create({
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  positionedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    marginBottom: 0,
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
});

export default SwipeableHabitCard;
