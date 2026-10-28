import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const BRAND = '#00B763';
const BRAND_SOFT = '#E6F8EF';

const BENEFITS = [
  { icon: 'alarm-outline', key: 'notifPromptBenefitReminders' },
  { icon: 'flame-outline', key: 'notifPromptBenefitStreaks' },
  { icon: 'shield-checkmark-outline', key: 'notifPromptBenefitControl' },
] as const;

interface NotificationPermissionModalProps {
  visible: boolean;
  onEnable: () => void;
  onLater: () => void;
}

export default function NotificationPermissionModal({ visible, onEnable, onLater }: NotificationPermissionModalProps) {
  const { t } = useTranslation();
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    tilt.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-16, { duration: 80 }),
          withTiming(16, { duration: 80 }),
          withTiming(-10, { duration: 80 }),
          withTiming(10, { duration: 80 }),
          withTiming(0, { duration: 80 }),
          withTiming(0, { duration: 1800 })
        ),
        -1
      )
    );
    return () => {
      cancelAnimation(tilt);
      tilt.value = 0;
    };
  }, [visible]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt.value}deg` }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onLater}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInDown.duration(350)} style={styles.card}>
          <View style={styles.hero}>
            <View style={[styles.blob, styles.blobLeft]} />
            <View style={[styles.blob, styles.blobRight]} />

            <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.bellHalo}>
              <Animated.View style={[styles.bellCircle, bellStyle]}>
                <Ionicons name="notifications" size={34} color="#FFFFFF" />
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.preview}>
              <View style={styles.previewIcon}>
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.previewTextBlock}>
                <View style={styles.previewHeaderRow}>
                  <Text style={styles.previewApp}>{t('notifPreviewApp')}</Text>
                  <Text style={styles.previewTime}>{t('notifPreviewNow')}</Text>
                </View>
                <Text style={styles.previewTitle} numberOfLines={1}>{t('notifPreviewTitle')}</Text>
                <Text style={styles.previewBody} numberOfLines={1}>{t('notifPreviewBody')}</Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{t('notifPromptTitle')}</Text>
            <Text style={styles.body}>{t('notifPromptBody')}</Text>

            <View style={styles.benefits}>
              {BENEFITS.map((benefit, index) => (
                <Animated.View
                  key={benefit.key}
                  entering={FadeIn.delay(450 + index * 100).duration(300)}
                  style={styles.benefitRow}
                >
                  <View style={styles.benefitIcon}>
                    <Ionicons name={benefit.icon} size={18} color={BRAND} />
                  </View>
                  <Text style={styles.benefitText}>{t(benefit.key)}</Text>
                </Animated.View>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={onEnable}>
              <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{t('notifPromptEnable')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onLater}>
              <Text style={styles.secondaryButtonText}>{t('notifPromptLater')}</Text>
            </TouchableOpacity>

            <Text style={styles.footnote}>{t('notifPromptFootnote')}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  hero: {
    backgroundColor: BRAND_SOFT,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#C9F0DC',
  },
  blobLeft: { width: 140, height: 140, top: -50, left: -40 },
  blobRight: { width: 110, height: 110, bottom: -40, right: -30 },
  bellHalo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(0,183,99,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  bellCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  previewIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTextBlock: { flex: 1 },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  previewApp: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  previewTime: { fontSize: 11, color: '#9CA3AF' },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  previewBody: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 18,
  },
  benefits: { gap: 12, marginBottom: 22 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: BRAND_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  secondaryButtonText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  footnote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
});
