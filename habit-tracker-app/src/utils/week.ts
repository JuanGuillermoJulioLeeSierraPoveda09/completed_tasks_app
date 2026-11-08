import type { WeekStart } from "../stores/settingsStore";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export const getDayColumn = (date: Date, weekStartsOn: WeekStart): number => 
    (date.getDay() - weekStartsOn + 7) % 7;

export const getStartOfWeek = (date: Date, weekStartsOn: WeekStart): Date => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - getDayColumn(start, weekStartsOn));
    return start;
};

export const getDateAt = (weekOffset: number, column: number, weekStartsOn: WeekStart): Date => {
    const date = getStartOfWeek(new Date(), weekStartsOn);
    date.setDate(date.getDate() + weekOffset * 7 + column);
    return date;
};

export const getWeekOffset = (date: Date, weekStartsOn: WeekStart): number => {
    const diff = getStartOfWeek(date, weekStartsOn).getTime() - getStartOfWeek(new Date(), weekStartsOn).getTime();
    return Math.round(diff / MS_PER_WEEK);
};

export const rotateWeekDays = <T>(sundayFirst: T[], weekStartsOn: WeekStart): T[] => [
    ...sundayFirst.slice(weekStartsOn),
    ...sundayFirst.slice(0, weekStartsOn),
];