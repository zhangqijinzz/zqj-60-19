import { create } from 'zustand';

export interface MemoryShard {
  id: string;
  x: number;
  y: number;
  content: string;
  collectedAt: number;
}

interface AppState {
  currentPage: string;
  isGazeTrackerActive: boolean;
  isBreathDetectorActive: boolean;
  isVoiceRecognitionActive: boolean;
  collectedShards: MemoryShard[];
  showRestReminder: boolean;
  setCurrentPage: (page: string) => void;
  setIsGazeTrackerActive: (active: boolean) => void;
  setIsBreathDetectorActive: (active: boolean) => void;
  setIsVoiceRecognitionActive: (active: boolean) => void;
  addShard: (shard: Omit<MemoryShard, 'id' | 'collectedAt'>) => void;
  removeShard: (id: string) => void;
  clearShards: () => void;
  setShowRestReminder: (show: boolean) => void;
}

export const useAppStateStore = create<AppState>((set) => ({
  currentPage: 'home',
  isGazeTrackerActive: false,
  isBreathDetectorActive: false,
  isVoiceRecognitionActive: false,
  collectedShards: [],
  showRestReminder: false,
  setCurrentPage: (page) => set({ currentPage: page }),
  setIsGazeTrackerActive: (active) => set({ isGazeTrackerActive: active }),
  setIsBreathDetectorActive: (active) => set({ isBreathDetectorActive: active }),
  setIsVoiceRecognitionActive: (active) => set({ isVoiceRecognitionActive: active }),
  addShard: (shard) =>
    set((state) => ({
      collectedShards: [
        ...state.collectedShards,
        {
          ...shard,
          id: `shard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          collectedAt: Date.now(),
        },
      ],
    })),
  removeShard: (id) =>
    set((state) => ({
      collectedShards: state.collectedShards.filter((s) => s.id !== id),
    })),
  clearShards: () => set({ collectedShards: [] }),
  setShowRestReminder: (show) => set({ showRestReminder: show }),
}));
