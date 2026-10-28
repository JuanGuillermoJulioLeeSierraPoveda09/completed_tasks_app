import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createMMKV } from 'react-native-mmkv';
import i18n from './i18n';
import type { HabitReminder } from './habitsStore';

const prefs = createMMKV({ id: 'notification-prefs' });
const PROMPT_SNOOZED_AT = 'promptSnoozedAt';
const REPROMPT_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export const REMINDERS_CHANNEL_ID = 'habit-reminders';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function ensureReminderChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
        name: 'Habit reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00B763',
    });
}

export async function shouldShowNotificationPrompt() {
    const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    if (granted || !canAskAgain) return false;
    const snoozedAt = prefs.getNumber(PROMPT_SNOOZED_AT);
    return snoozedAt === undefined || Date.now() - snoozedAt > REPROMPT_AFTER_MS;
}

export function snoozeNotificationPrompt() {
    prefs.set(PROMPT_SNOOZED_AT, Date.now());
}

export async function requestNotificationPermission() {
    await ensureReminderChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) {
        await Linking.openSettings();
        return false;
    }
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
}

const reminderIdFor = (habitId: string) => `habit-reminder-${habitId}`;

export async function scheduleHabitReminder(habitId: string, habitTitle: string, reminder?: HabitReminder) {
    if (!reminder) {
        await Notifications.cancelScheduledNotificationAsync(reminderIdFor(habitId));
        return;
    }
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;

    await ensureReminderChannel();
    const hour = (parseInt(reminder.hour, 10) % 12) + (reminder.period === 'PM' ? 12 : 0);
    await Notifications.scheduleNotificationAsync({
        identifier: reminderIdFor(habitId),
        content: {
            title: i18n.t('reminderNotifTitle', { habit: habitTitle }),
            body: i18n.t('reminderNotifBody'),
            sound: true,
            data: { habitId },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute: parseInt(reminder.minute, 10),
            channelId: REMINDERS_CHANNEL_ID,
        },
    });
}
