import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS } from '../../fonts';

const BottomBar = React.memo<{ onCreate: () => void; onMe: () => void}>(({ onCreate, onMe }) => {
  const { t } = useTranslation();
  const tabs: { key: string; icon: React.ComponentProps<typeof Ionicons>['name']; label: string; active?: boolean; onPress?: () => void }[] = [
    { key: 'menu', icon: 'grid', label: t('menu'), active: true },
    { key: 'new', icon: 'add-circle-outline', label: t('newHabit'), onPress: onCreate },
    { key: 'analytics', icon: 'bar-chart-outline', label: t('analytics') },
    { key: 'me', icon: 'person-outline', label: t('me') },
  ];
  return (
    <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
      {tabs.map((tab) => (
        <TouchableOpacity key={tab.key} style={styles.bottomTab} onPress={tab.onPress} activeOpacity={0.7}>
          <View style={[styles.bottomTabPill, tab.active && styles.bottomTabPillActive]}>
            <Ionicons name={tab.icon} size={21} color="#111111" />
            <Text style={[styles.bottomTabText, tab.active && styles.bottomTabTextActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomTab: { flex: 1, alignItems: 'center', paddingBottom: 8 },
  bottomTabPill: {
    minWidth: 72,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabPillActive: { backgroundColor: '#ECECEC' },
  bottomTabText: { fontSize: 11, fontFamily: FONTS.medium, color: '#111111', marginTop: 2, letterSpacing: 0.2 },
  bottomTabTextActive: { fontFamily: FONTS.semiBold },
});

export default BottomBar;
