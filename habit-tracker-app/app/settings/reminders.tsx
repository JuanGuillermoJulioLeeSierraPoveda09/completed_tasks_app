import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';;
import SettingsSection from '../../src/components/settings/SettingSection';
import SettingsRow from '../../src/components/settings/SettingsRow';
import SwitchRow from '../../src/components/settings/SwitchRow';
import CustomTimePickerModal from '../../src/components/CustomTimePickerModal';
import { useSettingsStore, REMINDER_SLOTS, type ReminderSlot } from '../../src/stores/settingsStore';
import {
  openNotificationSettings,
  requestNotificationPermission,
  rescheduleSlotReminders,
  scheduleSlotReminder,
} from '../../notifications';
import type { HabitReminder } from '../../habitsStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SLOT_ICONS: Record<ReminderSlot, IoniconName> = {
  morning: 'sunny-outline',
  afternoon: 'partly-sunny-outline',
  evening: 'moon-outline',
};

const formatTime = (time: HabitReminder) => `${time.hour}:${time.minute} ${time.period}`;

export default function RemindersScreen() {
  const { t } = useTranslation();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const slotReminders = useSettingsStore((s) => s.slotReminders);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setSlotEnabled = useSettingsStore((s) => s.setSlotEnabled);
  const setSlotTime = useSettingsStore((s) => s.setSlotTime);
  const [editingSlot, setEditingSlot] = useState<ReminderSlot | null>(null);

  const warnIfPermissionMissing = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(t('remindersBlockedTitle'), t('remindersBlockedBody'), [
        { text: t('notNow'), style: 'cancel' },
        { text: t('openSettings'), onPress: openNotificationSettings },
      ]);
    }
  };

  const handleToggleSlot = async (slot: ReminderSlot, enabled: boolean) => {
    setSlotEnabled(slot, enabled);
    if (enabled) await warnIfPermissionMissing();
    await scheduleSlotReminder(slot);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    const anySlotEnabled = REMINDER_SLOTS.some((slot) => slotReminders[slot].enabled);
    if (enabled && anySlotEnabled) await warnIfPermissionMissing();
    await rescheduleSlotReminders();
  };

  const handleConfirmTime = (hour: string, minute: string, period: 'AM' | 'PM') => {
    if (!editingSlot) return;
    const slot = editingSlot;
    setSlotTime(slot, { hour, minute, period });
    setEditingSlot(null);
    scheduleSlotReminder(slot);
  };

  const pickerTime = slotReminders[editingSlot ?? 'morning'].time;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {REMINDER_SLOTS.map((slot) => {
          const reminder = slotReminders[slot];
          return (
            <SettingsSection key={slot} title={t(slot)}>
              <SwitchRow
                icon={SLOT_ICONS[slot]}
                label={t('reminder')}
                value={reminder.enabled}
                disabled={!notificationsEnabled}
                onValueChange={(enabled) => handleToggleSlot(slot, enabled)}
              />
              <SettingsRow
                icon="time-outline"
                label={t('time')}
                value={formatTime(reminder.time)}
                disabled={!notificationsEnabled || !reminder.enabled}
                onPress={() => setEditingSlot(slot)}
              />
            </SettingsSection>
          );
        })}

        <SettingsSection title={t('general')}>
          <SwitchRow
            icon="notifications-outline"
            label={t('notifications')}
            description={t('notificationsDescription')}
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />
        </SettingsSection>
      </ScrollView>

      <CustomTimePickerModal
        visible={editingSlot !== null}
        reminderSelectedHour={pickerTime.hour}
        reminderSelectedMinute={pickerTime.minute}
        reminderSelectedPeriod={pickerTime.period}
        onConfirm={handleConfirmTime}
        onClose={() => setEditingSlot(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});