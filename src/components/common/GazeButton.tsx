import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GazeButtonProps {
  children: React.ReactNode;
  onActivate?: () => void;
  activationTime?: number;
  className?: string;
  variant?: 'primary' | 'ghost' | 'glow';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function GazeButton({
  children,
  onActivate,
  className,
  variant = 'primary',
  icon,
  disabled = false,
}: GazeButtonProps) {
  const [progress, setProgress] = useState(0);
  const gazeStartTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const activationTime = 1500;

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleGazeEnter = () => {
    if (disabled) return;
    gazeStartTimeRef.current = Date.now();
    const tick = () => {
      if (gazeStartTimeRef.current === null) return;
      const elapsed = Date.now() - gazeStartTimeRef.current;
      const newProgress = Math.min(elapsed / activationTime, 1);
      setProgress(newProgress);
      if (newProgress >= 1) {
        onActivate?.();
        gazeStartTimeRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const handleGazeLeave = () => {
    gazeStartTimeRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    setProgress(0);
  };

  const baseClasses = cn(
    'relative select-none flex items-center justify-center gap-3',
    'min-w-[80px] min-h-[80px] px-8 py-4 rounded-full',
    'transition-all duration-300 cursor-pointer',
    disabled && 'opacity-40 pointer-events-none',
    variant === 'primary' && [
      'bg-gradient-to-br from-cyan-500/20 to-purple-500/20',
      'border border-cyan-400/30',
      'hover:from-cyan-500/30 hover:to-purple-500/30',
    ],
    variant === 'ghost' && [
      'bg-white/5 border border-white/10',
      'hover:bg-white/10',
    ],
    variant === 'glow' && [
      'bg-gradient-to-br from-amber-400/20 to-rose-400/20',
      'border border-amber-300/30',
      'shadow-[0_0_30px_rgba(251,191,36,0.2)]',
    ],
    className
  );

  return (
    <motion.div
      data-gaze="true"
      data-gaze-id={String(Math.random())}
      className={baseClasses}
      onMouseEnter={handleGazeEnter}
      onMouseLeave={handleGazeLeave}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="url(#gazeBtnGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 48}
          strokeDashoffset={2 * Math.PI * 48 * (1 - progress)}
          className="transition-all duration-75"
        />
        <defs>
          <linearGradient id="gazeBtnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      {progress > 0 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(34,211,238,${progress * 0.15}) 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      <div className="relative z-10 flex items-center gap-3 text-white/90">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="text-xl font-medium whitespace-nowrap">{children}</span>
      </div>
    </motion.div>
  );
}
