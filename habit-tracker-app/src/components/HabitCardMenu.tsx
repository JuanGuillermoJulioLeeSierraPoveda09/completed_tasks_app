import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS } from '../../fonts';

const HabitCardMenu: React.FC<{
  habitId: string;
  isMenuOpen?: boolean;
  onToggleMenu: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}> = ({ habitId, isMenuOpen, onToggleMenu, onEdit, onDelete }) => {
  const { t } = useTranslation();
  return (
    <View style={{ position: 'relative', zIndex: 100 }}>
      <TouchableOpacity style={styles.optionsButton} onPress={() => onToggleMenu(habitId)}>
        <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {isMenuOpen && (
        <TouchableOpacity activeOpacity={1} style={{ position: 'absolute', right: 0 }}>
          <View style={styles.inlineMenuPopup}>
            <TouchableOpacity style={styles.inlinePopupItem} onPress={() => onEdit && onEdit(habitId)}>
              <Ionicons name="pencil-outline" size={18} color="#1F2937" />
              <Text style={styles.inlinePopupText}>{t('edit')}</Text>
            </TouchableOpacity>
            <View style={styles.inlinePopupDivider} />
            <TouchableOpacity style={styles.inlinePopupItem} onPress={() => onDelete && onDelete(habitId)}>
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
              <Text style={[styles.inlinePopupText, { color: '#DC2626' }]}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default HabitCardMenu;
