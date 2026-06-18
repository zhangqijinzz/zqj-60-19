import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserSettingsStore } from '@/stores/userSettingsStore';

export type BreathState = 'inhale' | 'hold' | 'exhale' | 'rest' | 'idle';

interface UseBreathDetectorOptions {
  simulate?: boolean;
}

interface BreathPatternConfig {
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
}

const BREATH_PATTERNS: Record<string, BreathPatternConfig> = {
  '4-7-8': { inhale: 4000, hold: 7000, exhale: 8000, rest: 0 },
  '4-4-4-4': { inhale: 4000, hold: 4000, exhale: 4000, rest: 4000 },
  '5-2-5-2': { inhale: 5000, hold: 2000, exhale: 5000, rest: 2000 },
  'custom': { inhale: 4000, hold: 4000, exhale: 4000, rest: 4000 },
};

const SENSITIVITY_THRESHOLDS: Record<string, { inhale: number; exhale: number }> = {
  low: { inhale: 0.15, exhale: 0.1 },
  medium: { inhale: 0.08, exhale: 0.05 },
  high: { inhale: 0.04, exhale: 0.02 },
};

export function useBreathDetector(options: UseBreathDetectorOptions = {}) {
  const { simulate = true } = options;
  const breathPattern = useUserSettingsStore((s) => s.breathPattern);
  const breathSensitivity = useUserSettingsStore((s) => s.breathSensitivity);

  const [isActive, setIsActive] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [breathState, setBreathState] = useState<BreathState>('idle');
  const [breathIntensity, setBreathIntensity] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number>(0);
  const baselineRmsRef = useRef<number>(0);
  const calibrationSamplesRef = useRef<number[]>([]);
  const isCalibratingRef = useRef(false);

  const patternConfig = BREATH_PATTERNS[breathPattern];
  const sensitivityThreshold = SENSITIVITY_THRESHOLDS[breathSensitivity];

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const runSimulation = useCallback(() => {
    const phaseSequence: BreathState[] = [];
    if (patternConfig.inhale > 0) phaseSequence.push('inhale');
    if (patternConfig.hold > 0) phaseSequence.push('hold');
    if (patternConfig.exhale > 0) phaseSequence.push('exhale');
    if (patternConfig.rest > 0) phaseSequence.push('rest');

    if (phaseSequence.length === 0) {
      setBreathState('idle');
      return;
    }

    const getPhaseDuration = (state: BreathState): number => {
      switch (state) {
        case 'inhale':
          return patternConfig.inhale;
        case 'hold':
          return patternConfig.hold;
        case 'exhale':
          return patternConfig.exhale;
        case 'rest':
          return patternConfig.rest;
        default:
          return 1000;
      }
    };

    let currentPhaseIndex = 0;
    phaseStartTimeRef.current = Date.now();

    const tick = () => {
      if (!isActive) return;

      const currentPhase = phaseSequence[currentPhaseIndex];
      const phaseDuration = getPhaseDuration(currentPhase);
      const elapsed = Date.now() - phaseStartTimeRef.current;
      const progress = Math.min(elapsed / phaseDuration, 1);

      setBreathState(currentPhase);
      setPhaseProgress(progress);

      let intensity = 0;
      if (currentPhase === 'inhale') {
        intensity = easeInOutSine(progress);
      } else if (currentPhase === 'exhale') {
        intensity = easeInOutSine(1 - progress);
      } else if (currentPhase === 'hold') {
        intensity = 0.9;
      } else {
        intensity = 0.1;
      }
      setBreathIntensity(intensity);

      if (progress >= 1) {
        currentPhaseIndex = (currentPhaseIndex + 1) % phaseSequence.length;
        phaseStartTimeRef.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, [isActive, patternConfig]);

  const easeInOutSine = (t: number): number => {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  };

  const runRealDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      isCalibratingRef.current = true;
      calibrationSamplesRef.current = [];
      setIsCalibrated(false);

      const dataArray = new Float32Array(analyser.fftSize);

      let localPhase = 0;
      let lastState: BreathState = 'idle';
      let stateStartTime = Date.now();

      const tick = () => {
        if (!isActive || !analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        if (isCalibratingRef.current) {
          calibrationSamplesRef.current.push(rms);
          if (calibrationSamplesRef.current.length > 100) {
            const avg =
              calibrationSamplesRef.current.reduce((a, b) => a + b, 0) /
              calibrationSamplesRef.current.length;
            baselineRmsRef.current = avg;
            isCalibratingRef.current = false;
            setIsCalibrated(true);
          }
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const normalizedRms = Math.max(0, rms - baselineRmsRef.current) * 20;
        const intensity = Math.min(normalizedRms, 1);
        setBreathIntensity(intensity);

        let newState: BreathState;
        if (intensity > sensitivityThreshold.inhale) {
          newState = 'inhale';
        } else if (intensity > sensitivityThreshold.exhale) {
          newState = 'exhale';
        } else {
          newState = 'rest';
        }

        if (newState !== lastState) {
          lastState = newState;
          stateStartTime = Date.now();
        }

        const phaseElapsed = Date.now() - stateStartTime;
        const phaseDurationMap: Record<BreathState, number> = {
          inhale: patternConfig.inhale || 4000,
          hold: patternConfig.hold || 4000,
          exhale: patternConfig.exhale || 4000,
          rest: patternConfig.rest || 4000,
          idle: 1000,
        };
        const progress = Math.min(phaseElapsed / phaseDurationMap[newState], 1);

        setBreathState(newState);
        setPhaseProgress(progress);

        if (progress >= 1) {
          localPhase = (localPhase + 1) % 4;
          stateStartTime = Date.now();
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch (error) {
      console.warn('麦克风不可用，切换到模拟模式:', error);
      runSimulation();
    }
  }, [isActive, patternConfig, sensitivityThreshold, runSimulation]);

  useEffect(() => {
    if (isActive) {
      if (simulate) {
        runSimulation();
      } else {
        runRealDetection();
      }
    }

    return () => {
      cleanupAudio();
    };
  }, [isActive, simulate, runSimulation, runRealDetection, cleanupAudio]);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setBreathState('idle');
    setBreathIntensity(0);
    setPhaseProgress(0);
    setIsCalibrated(false);
    isCalibratingRef.current = false;
    calibrationSamplesRef.current = [];
    baselineRmsRef.current = 0;
    cleanupAudio();
  }, [cleanupAudio]);

  return {
    breathState,
    breathIntensity,
    phaseProgress,
    start,
    stop,
    isActive,
    isCalibrated,
  };
}
