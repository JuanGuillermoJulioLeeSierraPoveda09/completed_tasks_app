import {useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
    targetDate: string;
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
    return new Date(y, m -1, d);
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

    if (isTodayPerfect){
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
            if ( tempLogged > loggedBest) loggedBest = tempLogged;
        } else {
            tempLogged= 0;
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