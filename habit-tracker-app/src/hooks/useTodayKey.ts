import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { formatDateKey } from '../../habitsStore';

const MIDNIGHT_MARGIN_MS = 1000;

const msUntilNextMidnight = () => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    return nextMidnight.getTime() - now.getTime();
};

export function useTodayKey() {
    const [todayKey, setTodayKey] = useState(() => formatDateKey(new Date()));

    useEffect(() => {
        const refresh = () => setTodayKey(formatDateKey(new Date()));
        const timer = setTimeout(refresh, msUntilNextMidnight() + MIDNIGHT_MARGIN_MS);
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') refresh();
        });
        return () => {
            clearTimeout(timer);
            subscription.remove();
        };
    }, [todayKey]);

    return todayKey;
}
