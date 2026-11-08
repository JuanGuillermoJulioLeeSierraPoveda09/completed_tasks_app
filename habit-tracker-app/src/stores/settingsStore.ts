import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage} from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { HabitReminder } from '../../habitsStore';

const mmkv = createMMKV({ id: 'settings-storage' });

const mmkvStorage: StateStorage = {
    setItem: (name, value) => mmkv.set(name, value),
    getItem: (name) => mmkv.getString(name) ?? null,
    removeItem: (name) => {
        mmkv.remove(name);
    },
};

export type AppLanguage = 'en' | 'es' | 'ja';
export type ThemePreference = 'system' | 'light' | 'dark';
export type WeekStart = 0 | 1;
export type ReminderSlot = 'morning' | 'afternoon' | 'evening';

export interface SlotReminder {
    enabled: boolean;
    time: HabitReminder;
}

interface SettingsState {
    language: AppLanguage | null;
    theme: ThemePreference;
    weekStartsOn: WeekStart;
    notificationsEnabled: boolean;
    slotReminders: Record<ReminderSlot, SlotReminder>;

    setLanguage: (language: AppLanguage) => void;
    setTheme: (theme: ThemePreference) => void;
    setWeekStartsOn: (day: WeekStart) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setSlotEnabled: (slot: ReminderSlot, enabled: boolean) => void;
    setSlotTime: (slot: ReminderSlot, time: HabitReminder) => void;
}

const DEFAULT_SLOT_REMINDERS: Record<ReminderSlot, SlotReminder> = {
    morning: { enabled: false, time: { hour: '5', minute: '30', period: 'AM' } },
    afternoon: { enabled: false, time: { hour: '1', minute: '00', period: 'PM' } },
    evening: { enabled: false, time: { hour: '6', minute: '00', period: 'PM' } },
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: null,
            theme: 'system',
            weekStartsOn: 0,
            notificationsEnabled: true,
            slotReminders: DEFAULT_SLOT_REMINDERS,

            setLanguage: (language) => set({ language }),
            setTheme: (theme) => set({ theme }),
            setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
            setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
            setSlotEnabled: (slot, enabled) => 
                set ((s) => ({
                    slotReminders: {
                        ...s.slotReminders,
                        [slot]: { ...s.slotReminders[slot], enabled },
                    },
                })),
            setSlotTime: (slot, time) =>
                set((s) => ({
                    slotReminders: {
                        ...s.slotReminders,
                        [slot]: { ...s.slotReminders[slot], time},
                    },
                })),
        }),
        {
            name: 'settings-store-v1',
            version: 1,
            storage: createJSONStorage(() => mmkvStorage),
            partialize: (s) => ({
                language: s.language,
                theme: s.theme,
                weekStartsOn: s.weekStartsOn,
                notificationsEnabled: s.notificationsEnabled,
                slotReminders: s.slotReminders,
            }),
        }
    )
);