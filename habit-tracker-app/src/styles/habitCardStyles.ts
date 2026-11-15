import { StyleSheet } from 'react-native';
import { FONTS } from '../../fonts';
import type { ThemeColors } from '../theme/colors';

export const createCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    habitInfo: { flex: 1, marginLeft: 12 },
    habitTitleCompleted: { textDecorationLine: 'line-through', color: colors.textSecondary },
    habitDescription: { fontSize: 12, fontFamily: FONTS.regular, color: colors.textSecondary, marginTop: 2 },
    swipeableContainer: {
      marginBottom: 10,
      borderRadius: 16,
      justifyContent: 'center',
    },
    habitCardGestural: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    habitCardCompletedGestural: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.fill,
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
      color: colors.text,
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
      color: colors.onPrimary,
      fontSize: 12,
      fontFamily: FONTS.extraBold,
    },
  });