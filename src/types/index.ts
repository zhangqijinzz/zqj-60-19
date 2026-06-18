export type BreathState = 'idle' | 'inhale' | 'hold' | 'exhale' | 'rest';

export type BreathSensitivity = 'low' | 'medium' | 'high';

export type BreathPattern = '4-7-8' | '4-4-4-4' | '5-2-5-2' | 'custom';

export type ThemeMode = 'aurora' | 'ocean' | 'forest' | 'sunset';

export type EmotionType = 'warm' | 'miss' | 'encourage' | 'peaceful';

export interface DriftBottle {
  id: string;
  voiceBlobUrl: string;
  duration: number;
  createdAt: number;
  fromAnonymous: string;
  emotion?: EmotionType;
  isSentByMe?: boolean;
  isCollected?: boolean;
  content?: string;
}

export interface MemoryNode {
  id: string;
  position: [number, number, number];
  label: string;
  imageUrl?: string;
  voiceBlobUrl?: string;
}

export interface MemoryScene {
  type: 'indoor' | 'outdoor' | 'mixed';
  lighting: 'sunrise' | 'sunset' | 'noon' | 'night';
  memoryNodes: MemoryNode[];
}

export interface MemoryPalace {
  id: string;
  name: string;
  description: string;
  voiceBlobUrl: string;
  sceneData: MemoryScene;
  createdAt: number;
  isShared: boolean;
  shareCode?: string;
}

export interface UserSettings {
  gazeActivationTime: number;
  blinkMode: boolean;
  breathSensitivity: BreathSensitivity;
  breathPattern: BreathPattern;
  voiceWakeWord: string;
  theme: ThemeMode;
}

export interface AppState {
  isGazeReady: boolean;
  isMicReady: boolean;
  isVoiceReady: boolean;
  currentPage: string;
  breathState: BreathState;
  breathIntensity: number;
}
