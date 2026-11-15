import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Habit } from '../../habitsStore';
import HabitCardMenu from './HabitCardMenu';
import { createCardStyles } from '../styles/habitCardStyles';
import { useTheme } from '../theme/useTheme';

const CompletedHabitCard = React.memo<{
  habit: Habit;
  displayDescription?: string;
  streak?: number;
  isMenuOpen: boolean;
  onToggleMenu: (habitId: string) => void;
  onEdit: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}>(({ habit, displayDescription, streak, isMenuOpen, onToggleMenu, onEdit, onDelete }) => {
  const { colors } = useTheme();
  const cardStyles = useMemo(() => createCardStyles(colors), [colors]);

  return (
    <View style={[cardStyles.swipeableContainer, { zIndex: isMenuOpen ? 10 : 1, elevation: 0 }]}>
      <View style={[cardStyles.habitCardGestural, cardStyles.habitCardCompletedGestural]}>
        <View style={[cardStyles.iconContainerGesture, { backgroundColor: colors.fill }]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.textMuted} />
        </View>
        <View style={cardStyles.habitInfo}>
          <Text style={[cardStyles.habitTitleGestural, cardStyles.habitTitleCompleted]}>{habit.title}</Text>
          {displayDescription ? <Text style={cardStyles.habitDescription}>{displayDescription}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
          {habit.type === 'Quit a habit' && streak !== undefined && (
            <View style={[cardStyles.streakBadgeMini, { backgroundColor: habit.color }]}>
              <Ionicons name="flame" size={12} color={colors.onPrimary} />
              <Text style={cardStyles.streakBadgeMiniText}>{streak}</Text>
            </View>
          )}
          <HabitCardMenu
            habitId={habit.id}
            isMenuOpen={isMenuOpen}
            onToggleMenu={onToggleMenu}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </View>
      </View>
    </View>
  );
});

export default CompletedHabitCard;