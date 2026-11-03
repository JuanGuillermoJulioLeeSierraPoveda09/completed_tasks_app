import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS } from '../../fonts';

const RelapseModal = React.memo<{
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>(({ visible, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
});

export default RelapseModal;
