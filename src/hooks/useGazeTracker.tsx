import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { cn } from '@/lib/utils';

interface GazePosition {
  x: number;
  y: number;
}

interface UseGazeTrackerOptions {
  onGazeActivate?: (element: HTMLElement) => void;
  activationTime?: number;
}

interface GazeCursorProps {
  position: GazePosition;
  progress: number;
  isActive: boolean;
}

function GazeCursor({ position, progress, isActive }: GazeCursorProps) {
  if (!isActive) return null;

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return createPortal(
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative w-10 h-10">
        <div
          className={cn(
            'absolute inset-0 rounded-full transition-opacity duration-300',
            'bg-gradient-to-br from-cyan-400/40 to-purple-500/40 blur-sm'
          )}
        />
        <div
          className={cn(
            'absolute inset-1 rounded-full',
            'bg-gradient-to-br from-cyan-300/80 to-purple-400/80',
            'shadow-[0_0_10px_rgba(34,211,238,0.6)]'
          )}
        />
        <svg
          className="absolute inset-0 w-10 h-10 -rotate-90"
          viewBox="0 0 50 50"
        >
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
          />
          <circle
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke="url(#gazeGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100 ease-linear"
          />
          <defs>
            <linearGradient id="gazeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>,
    document.body
  );
}

export function useGazeTracker(options: UseGazeTrackerOptions = {}) {
  const { onGazeActivate } = options;
  const storeActivationTime = useUserSettingsStore((s) => s.gazeActivationTime);
  const activationTime = options.activationTime ?? storeActivationTime;

  const [isActive, setIsActive] = useState(false);
  const [gazePosition, setGazePosition] = useState<GazePosition>({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);

  const gazeStartTimeRef = useRef<number | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activatedRef = useRef<Set<string>>(new Set());

  const findGazeElement = useCallback((x: number, y: number): HTMLElement | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      if (el instanceof HTMLElement && el.dataset.gaze === 'true') {
        return el;
      }
    }
    return null;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return;
    setGazePosition({ x: e.clientX, y: e.clientY });
  }, [isActive]);

  const resetGazeState = useCallback(() => {
    gazeStartTimeRef.current = null;
    currentTargetRef.current = null;
    setProgress(0);
  }, []);

  const updateGazeProgress = useCallback(() => {
    if (!isActive) return;

    const target = findGazeElement(gazePosition.x, gazePosition.y);

    if (!target) {
      resetGazeState();
      animationFrameRef.current = requestAnimationFrame(updateGazeProgress);
      return;
    }

    if (currentTargetRef.current !== target) {
      currentTargetRef.current = target;
      gazeStartTimeRef.current = Date.now();
      setProgress(0);
    }

    if (gazeStartTimeRef.current !== null) {
      const elapsed = Date.now() - gazeStartTimeRef.current;
      const newProgress = Math.min(elapsed / activationTime, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        const targetId = target.getAttribute('data-gaze-id') || target.id;
        if (!activatedRef.current.has(targetId || String(target))) {
          activatedRef.current.add(targetId || String(target));
          onGazeActivate?.(target);
        }
        gazeStartTimeRef.current = null;
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateGazeProgress);
  }, [isActive, gazePosition, findGazeElement, resetGazeState, activationTime, onGazeActivate]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('mousemove', handleMouseMove);
      animationFrameRef.current = requestAnimationFrame(updateGazeProgress);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, handleMouseMove, updateGazeProgress]);

  useEffect(() => {
    if (!isActive) return;

    const resetActivated = () => {
      activatedRef.current.clear();
    };

    window.addEventListener('click', resetActivated);
    return () => window.removeEventListener('click', resetActivated);
  }, [isActive]);

  const start = useCallback(() => {
    activatedRef.current.clear();
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    resetGazeState();
    activatedRef.current.clear();
  }, [resetGazeState]);

  const GazeCursorComponent = () => (
    <GazeCursor position={gazePosition} progress={progress} isActive={isActive} />
  );

  return {
    start,
    stop,
    isActive,
    gazePosition,
    GazeCursor: GazeCursorComponent,
  };
}
