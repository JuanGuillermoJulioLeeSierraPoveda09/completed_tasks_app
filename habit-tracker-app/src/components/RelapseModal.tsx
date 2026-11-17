import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS } from '../../fonts';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

const RelapseModal = React.memo<{
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>(({ visible, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='fade'
      statusBarTranslucent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.relapseModalCard}>
          <View style={styles.relapseIconWrapper}>
            <Ionicons name="warning" size={36} color={colors.danger} />
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
              onPress={onCancel}
            >
              <Text style={styles.relapseButtonCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.relapseButton, styles.relapseButtonConfirm]}
              onPress={onConfirm}
            >
              <Text style={styles.relapseButtonConfirmText}>{t('confirmRelapse')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    relapseModalCard: {
      width: '85%',
      backgroundColor: colors.surfaceElevated,
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10
    },
    relapseIconWrapper: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16
    },
    relapseModalTitle: {
      fontSize: 20,
      fontFamily: FONTS.extraBold,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    relapseModalText: {
      fontSize: 14,
      fontFamily: FONTS.regular,
      color: colors.textSecondary,
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
      backgroundColor: colors.fill,
    },
    relapseButtonCancelText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontFamily: FONTS.bold,
    },
    relapseButtonConfirm: {
      backgroundColor: colors.danger
    },
    relapseButtonConfirmText: {
      color: colors.onDanger,
      fontSize: 15,
      fontFamily: FONTS.bold
    },
  });

export default RelapseModal;