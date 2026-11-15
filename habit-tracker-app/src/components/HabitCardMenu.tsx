import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS } from '../../fonts';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

const HabitCardMenu: React.FC<{
  habitId: string;
  isMenuOpen?: boolean;
  onToggleMenu: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}> = ({ habitId, isMenuOpen, onToggleMenu, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={{ position: 'relative', zIndex: 100 }}>
      <TouchableOpacity style={styles.optionsButton} onPress={() => onToggleMenu(habitId)}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {isMenuOpen && (
        <TouchableOpacity activeOpacity={1} style={{ position: 'absolute', right: 0 }}>
          <View style={styles.inlineMenuPopup}>
            <TouchableOpacity style={styles.inlinePopupItem} onPress={() => onEdit && onEdit(habitId)}>
              <Ionicons name="pencil-outline" size={18} color={colors.text} />
              <Text style={styles.inlinePopupText}>{t('edit')}</Text>
            </TouchableOpacity>
            <View style={styles.inlinePopupDivider} />
            <TouchableOpacity style={styles.inlinePopupItem} onPress={() => onDelete && onDelete(habitId)}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.inlinePopupText, styles.inlinePopupTextDanger]}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    optionsButton: {
      paddingLeft: 6,
      marginLeft: 4,
    },
    inlineMenuPopup: {
      position: 'absolute',
      top: 30,
      right: -17,
      width: 160,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 10,
      paddingVertical: 6,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 10,
      zIndex: 100,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.text,
    },
    inlinePopupTextDanger: {
      color: colors.danger,
    },
    inlinePopupDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
  });

export default HabitCardMenu;