import { number } from "react-i18next/icu.macro";
import { formatDateKey  } from "../../habitsStore";
export type RelativeDay = 'yesterday' | 'today' | 'tomorrow';

const dateKeyWithOffset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDateKey(date);
};

export const getRelativeDay = (date: Date): RelativeDay | null => {
    const key = formatDateKey(date);
    if (key === dateKeyWithOffset(-1)) return 'yesterday';
    if (key === dateKeyWithOffset(0)) return 'today';
    if (key === dateKeyWithOffset(1)) return 'tomorrow';
    return null;
};