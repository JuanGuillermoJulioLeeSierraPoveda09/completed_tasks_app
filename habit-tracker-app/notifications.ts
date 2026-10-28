import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createMMKV } from 'react-native-mmkv';
import i18n from './i18n';
import { parseDateKey} from './habitsStore';
import type { HabitDraft } from './habitsStore';

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

export async function cancelHabitReminders(habitId: string) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const HabitReminders = scheduled.filter((n) => n.content.data?.habitId === habitId);
    await Promise.all(HabitReminders.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

function buildReminderTriggers(habit: HabitDraft, hour: number, minute: number): Notifications.SchedulableNotificationTriggerInput[] {
    const channelId = REMINDERS_CHANNEL_ID;
    const { DAILY, WEEKLY, MONTHLY, DATE } = Notifications.SchedulableTriggerInputTypes;

    if (habit.type === 'Task') {
        if (!habit.targetDate) return [];
        const date = parseDateKey(habit.targetDate);
        date.setHours(hour, minute, 0, 0);
        return date.getTime() > Date.now() ? [{ type: DATE, date, channelId}] : [];
    }
    if (habit.selectedWeekDays) {
        if (habit.selectedWeekDays.every(Boolean)) return [{ type: DAILY, hour, minute, channelId }];
        return habit.selectedWeekDays.flatMap((isSelected, dayIndex) =>
            isSelected ? [{ type: WEEKLY, weekday: dayIndex + 1, hour, minute, channelId }] : []
        );
    }
    if  (habit.selectedMonthDays) {
        return habit.selectedMonthDays.map((day) => ({ type: MONTHLY, day, hour, minute, channelId }));
    }
    return [{ type: DAILY, hour, minute, channelId }];
}

export async function scheduleHabitReminder(habitId: string, habit: HabitDraft) {
    await cancelHabitReminders(habitId);
    if (!habit.reminder) return;
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;

    await ensureReminderChannel();
    const hour = (parseInt(habit.reminder.hour, 10) % 12) + (habit.reminder.period === 'PM' ? 12 : 0);
    const minute = parseInt(habit.reminder.minute, 10);
    const content = {
        title: i18n.t('reminderNotifTitle', { habit: habit.title }),
        body: i18n.t('reminderNotifBody'),
        sound: true,
        data: {habitId },
    };

    await Promise.all(
        buildReminderTriggers(habit, hour, minute).map((trigger) => Notifications.scheduleNotificationAsync({ content, trigger }))
    )
}
