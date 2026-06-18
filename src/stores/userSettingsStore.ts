import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BreathSensitivity = 'low' | 'medium' | 'high';
export type BreathPattern = '4-7-8' | '4-4-4-4' | '5-2-5-2' | 'custom';
export type ThemeMode = 'aurora' | 'ocean' | 'forest' | 'sunset';

interface UserSettings {
  gazeActivationTime: number;
  blinkMode: boolean;
  breathSensitivity: BreathSensitivity;
  breathPattern: BreathPattern;
  voiceWakeWord: string;
  theme: ThemeMode;
  setGazeActivationTime: (time: number) => void;
  setBlinkMode: (enabled: boolean) => void;
  setBreathSensitivity: (sensitivity: BreathSensitivity) => void;
  setBreathPattern: (pattern: BreathPattern) => void;
  setVoiceWakeWord: (word: string) => void;
  setTheme: (theme: ThemeMode) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  gazeActivationTime: 1500,
  blinkMode: false,
  breathSensitivity: 'medium' as BreathSensitivity,
  breathPattern: '4-7-8' as BreathPattern,
  voiceWakeWord: '小灵小灵',
  theme: 'aurora' as ThemeMode,
};

export const useUserSettingsStore = create<UserSettings>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setGazeActivationTime: (time) => set({ gazeActivationTime: time }),
      setBlinkMode: (enabled) => set({ blinkMode: enabled }),
      setBreathSensitivity: (sensitivity) => set({ breathSensitivity: sensitivity }),
      setBreathPattern: (pattern) => set({ breathPattern: pattern }),
      setVoiceWakeWord: (word) => set({ voiceWakeWord: word }),
      setTheme: (theme) => set({ theme }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'user-settings',
    }
  )
);
