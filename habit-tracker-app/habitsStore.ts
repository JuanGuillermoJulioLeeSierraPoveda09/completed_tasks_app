import { reloadAppAsync } from 'expo';
import { useEffect, useState } from 'react';
import { date } from 'react-i18next/icu.macro';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
//MMKV

export type HabitType = 'Build a habit' | 'Quit a habit' | 'Task';
export interface HabitReminder {
    hour: string;
    minute: string;
    period: 'AM' | 'PM';
}

export interface Habit {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    frequency: string;
    selectedWeekDays?: boolean[];
    selectedMonthDays?: number[];
    type?: HabitType;
    createdAt?: string;
    quoteOrder?: number[];
    targetDate?: string;
    timeOfDay?: 'Morning' | 'Afternoon' | 'Evening';
    order?: number;
    reminder?: HabitReminder;
}

export type HabitDraft = Omit<Habit, 'id' | 'createdAt' | 'quoteOrder' | 'order'>;
export type HabitLogs = Record<string, string[]>;
export type RelapseLogs = Record<string, string[]>;

export const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const parseDateKey = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const QUIT_QUOTE_COUNT = 6;
const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const shuffledQuoteOrder = () =>
    Array.from({ length: QUIT_QUOTE_COUNT }, (_, i) => i).sort(() => Math.random() - 0.5);
export const getHabitsForDate = (habits: Habit[], date: Date): Habit[] => {
    const dateKey = formatDateKey(date);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    return habits.filter((habit) => {
        if (habit.type === 'Task') {
            return habit.targetDate === dateKey;
        }
        if (habit.selectedWeekDays) {
            return habit.selectedWeekDays[dayOfWeek];
        }
        if (habit.selectedMonthDays) {
            return habit.selectedMonthDays.includes(dayOfMonth);
        }
        return true;
    });
};

export const getQuitQuoteIndex = (habit: Habit, dateKey: string): number | null => {
    if (habit.type !== 'Quit a habit' || !habit.quoteOrder || !habit.createdAt) return null;
    const startDate = parseDateKey(habit.createdAt);
    const currentDate = parseDateKey(dateKey);
    let diffDays = Math.round((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 42));
    if (diffDays < 0) diffDays = 0;
    return habit.quoteOrder[diffDays % QUIT_QUOTE_COUNT];
};

export const getQuitStreak = (habit: Habit, relapseLogs: RelapseLogs, activeDate: Date): number => {
    if (!habit.createdAt) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentActiveDate = new Date(activeDate);
    currentActiveDate.setHours(0, 0, 0, 0);
    const checkDate = currentActiveDate > today ? new Date(today) : new Date(currentActiveDate);
    const startDate = parseDateKey(habit.createdAt);

    while (checkDate >= startDate) {
        const key = formatDateKey(checkDate);
        const relapses = relapseLogs[key] || [];
        if (relapses.includes(habit.id)) {
            break;
        }
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
};

export const computeStreakStats = (habits: Habit[], habitLogs: HabitLogs) => {
    if (habits.length === 0) {
        return { loggedCurrent: 0, loggedBest: 0, perfectCurrent: 0, perfectBest: 0 };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = formatDateKey(today);
    const todayCompletedCount = (habitLogs[todayKey] || []).length;
    const habitsToday = getHabitsForDate(habits, today);
    const isTodayPerfect = habitsToday.length > 0 && todayCompletedCount >= habitsToday.length;
    let countPerfect = 0;
    let checkDate = new Date(today);

    if (isTodayPerfect) {
        countPerfect++;
    }
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
        const key = formatDateKey(checkDate);
        const completedCount = (habitLogs[key] || []).length
        const habitsOnCheckDate = getHabitsForDate(habits, checkDate);
        const isPerfect = habitsOnCheckDate.length > 0 && completedCount >= habitsOnCheckDate.length;

        if (isPerfect) {
            countPerfect++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    let countLogged = 0;
    checkDate = new Date(today);
    const isTodayLogged = todayCompletedCount > 0;

    if (isTodayLogged) {
        countLogged++;
    }
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
        const key = formatDateKey(checkDate);
        const completedCount = (habitLogs[key] || []).length;
        if (completedCount > 0) {
            countLogged++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    let loggedBest = 0;
    let perfectBest = 0;
    let tempLogged = 0;
    let tempPerfect = 0;
    const historicDate = new Date(today);

    for (let i = 0; i < 365; i++) {
        const key = formatDateKey(historicDate);
        const completedCount = (habitLogs[key] || []).length;
        const habitsOnHistoricDate = getHabitsForDate(habits, historicDate);
        const isPerfectHistoric = habitsOnHistoricDate.length > 0 && completedCount >= habitsOnHistoricDate.length;

        if (completedCount > 0) {
            tempLogged++;
            if (tempLogged > loggedBest) loggedBest = tempLogged;
        } else {
            tempLogged = 0;
        }
        if (isPerfectHistoric) {
            tempPerfect++;
            if (tempPerfect > perfectBest) perfectBest = tempPerfect;
        } else {
            tempPerfect = 0;
        }
        historicDate.setDate(historicDate.getDate() - 1);
    }
    return {
        loggedCurrent: countLogged,
        loggedBest,
        perfectCurrent: countPerfect,
        perfectBest,
    };
};

let hydrationFailed = false;
const hydrationListeners = new Set<() => void>();

interface HabitsState {
    habits: Habit[];
    habitLogs: HabitLogs;
    relapseLogs: RelapseLogs;
    toggleCompletion: (habitId: string, dateKey: string) => void;
    confirmRelapse: (habitId: string, dateKey: string) => void;
    createHabit: (draft: HabitDraft, dateKey: string) => Habit;
    updateHabit: (habitId: string, draft: HabitDraft, dateKey: string) => void;
    deleteHabit: (habitId: string) => void;
    reorderHabit: (habitId: string, toIndex: number, orderedIds: string[]) => void;
}

export const useHabitsStore = create<HabitsState>()(
    persist(
        (set, get) => ({
            habits: [],
            habitLogs: {},
            relapseLogs: {},
            toggleCompletion: (habitId, dateKey) => {
                if (dateKey > formatDateKey(new Date())) return;
                set((s) => {
                    const currentCompleted = s.habitLogs[dateKey] || [];
                    const exists = currentCompleted.includes(habitId);
                    const updated = exists ? currentCompleted.filter((id) => id !== habitId) : [...currentCompleted, habitId];
                    return { habitLogs: { ...s.habitLogs, [dateKey]: updated } };
                });
            },
            confirmRelapse: (habitId, dateKey) => {
                set((s) => {
                    const currentRelapsed = s.relapseLogs[dateKey] || [];
                    if (currentRelapsed.includes(habitId)) return s;
                    return {
                        relapseLogs: { ...s.relapseLogs, [dateKey]: [...currentRelapsed, habitId] }
                    };
                });
            },

            createHabit: (draft, dateKey) => {
                const habit: Habit = {
                    ...draft,
                    id: makeId(),
                    createdAt: dateKey,
                    quoteOrder: draft.type === 'Quit a habit' ? shuffledQuoteOrder() : undefined,
                    order: get().habits.length,
                };
                set((s) => ({ habits: [...s.habits, habit] }));
                return habit;
            },

            updateHabit: (habitId, draft, dateKey) => {
                set((s) => ({
                    habits: s.habits.map((h) => {
                        if (h.id !== habitId) return h;
                        return {
                            ...h,
                            ...draft,
                            createdAt: h.createdAt ?? dateKey,
                            quoteOrder: draft.type === 'Quit a habit' ? h.quoteOrder ?? shuffledQuoteOrder() : undefined,
                        };
                    }),
                }));
            },

            deleteHabit: (habitId) => {
                set((s) => {
                    const prune = (logs: Record<string, string[]>) => {
                        const next: Record<string, string[]> = {};
                        for (const key in logs) {
                            next[key] = logs[key].filter((id) => id !== habitId);
                        }
                        return next;
                    };
                    return {
                        habits: s.habits.filter((h) => h.id !== habitId),
                        habitLogs: prune(s.habitLogs),
                        relapseLogs: prune(s.relapseLogs),
                    };
                });
            },

            reorderHabit: (habitId, toIndex, orderedIds) => {
                set((s) => {
                    const prev = s.habits;
                    const fromIndex = orderedIds.indexOf(habitId);
                    if (fromIndex === -1) return { habits: [...prev] };
                    const ids = [...orderedIds];
                    ids.splice(fromIndex, 1);
                    ids.splice(Math.max(0, Math.min(toIndex, ids.length)), 0, habitId);
                    const byId = new Map(prev.map((h) => [h.id, h]));
                    const groupIds = new Set(ids);
                    const sortedAll = [...prev].sort((a, b) => (a.order || 0) - (b.order || 0));
                    let k = 0;
                    return {
                        habits: sortedAll.map((h, i) => {
                            const source = groupIds.has(h.id) ? byId.get(ids[k++])! : h;
                            return { ...source, order: i };
                        }),
                    };
                });
            },
        }),
        {
            name: 'habits-store-v1',
            version: 1,
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (s) => ({
                habits: s.habits,
                habitLogs: s.habitLogs,
                relapseLogs: s.relapseLogs,
            }),
            onRehydrateStorage: () => (_state, error) => {
                if (error) {
                    hydrationFailed = true;
                    hydrationListeners.forEach((l) => l());
                }
            },
        }
    )
);

export const useHabitsHydrated = () => {
    const isReady = () => useHabitsStore.persist.hasHydrated() || hydrationFailed;
    const [hydrated, setHydrated] = useState(isReady);
    useEffect(() => {
        const update = () => setHydrated(isReady());
        const unsub = useHabitsStore.persist.onFinishHydration(update);
        hydrationListeners.add(update);
        update();
        return () => {
            unsub();
            hydrationListeners.delete(update);
        };
    }, []);
    return hydrated;
};