import type { HabitReminder } from '../../habitsStore';

export const formatReminderTime = ({ hour, minute, period }: HabitReminder): string =>
    `${parseInt(hour, 10)}:${minute.padStart(2, '0')} ${period}`;
