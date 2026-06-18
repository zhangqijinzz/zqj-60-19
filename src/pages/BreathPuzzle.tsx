import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wind, Ship, Flower2, Sparkles, Mic, MicOff, Play, Pause, Circle } from 'lucide-react';
import { AuroraBackground } from '@/components/common/AuroraBackground';
import { GazeButton } from '@/components/common/GazeButton';
import { useBreathDetector, BreathState } from '@/hooks/useBreathDetector';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { cn } from '@/lib/utils';

interface Petal {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  swayOffset: number;
  color: string;
}

const PETAL_COLORS = [
  'rgba(251, 113, 133, 0.8)',
  'rgba(244, 114, 182, 0.8)',
  'rgba(192, 132, 252, 0.8)',
  'rgba(251, 191, 36, 0.7)',
  'rgba(34, 211, 238, 0.7)',
];

const BREATH_PHASE_TEXT: Record<BreathState, string> = {
  inhale: '吸气',
  hold: '屏息',
  exhale: '呼气',
  rest: '放松',
  idle: '准备',
};

const FOUR_SEVEN_EIGHT_PHASES = [
  { state: 'inhale' as BreathState, text: '吸气 4秒', duration: 4 },
  { state: 'hold' as BreathState, text: '屏息 7秒', duration: 7 },
  { state: 'exhale' as BreathState, text: '呼气 8秒', duration: 8 },
];

export default function BreathPuzzle() {
  const navigate = useNavigate();
  const theme = useUserSettingsStore((s) => s.theme);
  const [simulate, setSimulate] = useState(true);
  const [meditationMode, setMeditationMode] = useState(false);

  const { breathState, breathIntensity, phaseProgress, start, stop, isActive } =
    useBreathDetector({ simulate });

  const [shipProgress, setShipProgress] = useState(0);
  const [windmillRotation, setWindmillRotation] = useState(0);
  const [petals, setPetals] = useState<Petal[]>([]);
  const petalIdRef = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const baseSpeed = breathState === 'inhale' ? 3 : breathState === 'exhale' ? 0.5 : 1;
      const speedMultiplier = 1 + breathIntensity * 4;
      setWindmillRotation((prev) => prev + baseSpeed * speedMultiplier * delta * 60);

      if (breathState === 'exhale') {
        setShipProgress((prev) => Math.min(prev + breathIntensity * delta * 0.08, 1));
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [breathState, breathIntensity]);

  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const newPetals: Petal[] = [];
      const spawnCount = breathState === 'inhale' ? 2 : breathState === 'exhale' ? 1 : 0;
      for (let i = 0; i < spawnCount; i++) {
        newPetals.push({
          id: petalIdRef.current++,
          x: Math.random() * 100,
          y: -5 - Math.random() * 10,
          size: 12 + Math.random() * 18,
          rotation: Math.random() * 360,
          speed: 0.3 + Math.random() * 0.5 + breathIntensity * 0.5,
          swayOffset: Math.random() * Math.PI * 2,
          color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        });
      }
      setPetals((prev) => [...prev, ...newPetals].slice(-80));
    }, 300);

    const moveInterval = setInterval(() => {
      setPetals((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + p.speed * (breathState === 'inhale' ? 0.6 : 1),
            x: p.x + Math.sin(p.y * 0.02 + p.swayOffset) * 0.3,
            rotation: p.rotation + p.speed * 2,
          }))
          .filter((p) => p.y < 110)
      );
    }, 30);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [breathState, breathIntensity]);

  const orbColor = useMemo(() => {
    if (breathState === 'inhale') return `rgba(59, 130, 246, ${0.6 + breathIntensity * 0.3})`;
    if (breathState === 'exhale') return `rgba(244, 114, 182, ${0.6 + breathIntensity * 0.3})`;
    if (breathState === 'hold') return `rgba(168, 85, 247, ${0.5 + breathIntensity * 0.2})`;
    return 'rgba(148, 163, 184, 0.4)';
  }, [breathState, breathIntensity]);

  const orbScale = useMemo(() => {
    if (breathState === 'inhale') return 1 + phaseProgress * 0.4;
    if (breathState === 'exhale') return 1.4 - phaseProgress * 0.4;
    if (breathState === 'hold') return 1.4;
    return 1;
  }, [breathState, phaseProgress]);

  const meditationPhaseIndex = useMemo(() => {
    const totalDuration = FOUR_SEVEN_EIGHT_PHASES.reduce((a, b) => a + b.duration, 0);
    const fullCycleProgress = FOUR_SEVEN_EIGHT_PHASES.slice(0, 3).some(p => p.state === breathState)
      ? (() => {
          let acc = 0;
          for (let i = 0; i < 3; i++) {
            const phase = FOUR_SEVEN_EIGHT_PHASES[i];
            const phaseStartRatio = acc / totalDuration;
            const phaseEndRatio = (acc + phase.duration) / totalDuration;
            const currentRatio = phaseStartRatio + (phaseEndRatio - phaseStartRatio) * (breathState === phase.state ? phaseProgress : (breathState === phase.state ? 0 : 1));
            if (breathState === phase.state) return { index: i, ratio: currentRatio };
            acc += phase.duration;
          }
          return { index: 0, ratio: 0 };
        })()
      : { index: 0, ratio: 0 };
    return fullCycleProgress;
  }, [breathState, phaseProgress]);

  const toggleDetectionMode = () => {
    setSimulate((prev) => !prev);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AuroraBackground theme={theme} intensity={0.8} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {petals.map((petal) => (
          <motion.div
            key={petal.id}
            className="absolute"
            style={{
              left: `${petal.x}%`,
              top: `${petal.y}%`,
              width: petal.size,
              height: petal.size,
              transform: `rotate(${petal.rotation}deg)`,
            }}
          >
            <Flower2
              style={{
                width: '100%',
                height: '100%',
                color: petal.color,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            />
          </motion.div>
        ))}
      </div>

      <div className="relative z-20 flex flex-col min-h-screen p-6">
        <div className="flex items-center justify-between mb-6">
          <GazeButton
            variant="ghost"
            icon={<ArrowLeft className="w-5 h-5" />}
            onActivate={() => navigate('/')}
          >
            返回首页
          </GazeButton>

          <div className="flex items-center gap-3">
            <GazeButton
              variant={meditationMode ? 'primary' : 'ghost'}
              icon={<Sparkles className="w-5 h-5" />}
              onActivate={() => setMeditationMode((prev) => !prev)}
            >
              {meditationMode ? '冥想中' : '冥想模式'}
            </GazeButton>
            <GazeButton
              variant={simulate ? 'ghost' : 'primary'}
              icon={simulate ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              onActivate={toggleDetectionMode}
            >
              {simulate ? '模拟模式' : '麦克风'}
            </GazeButton>
            <GazeButton
              variant="ghost"
              icon={isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              onActivate={() => (isActive ? stop() : start())}
            >
              {isActive ? '暂停' : '开始'}
            </GazeButton>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center">
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
            <AnimatePresence mode="wait">
              {meditationMode ? (
                <motion.div
                  key="meditation"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-80 h-80 flex items-center justify-center"
                >
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="4"
                    />
                    {FOUR_SEVEN_EIGHT_PHASES.map((_, i) => {
                      const totalDuration = FOUR_SEVEN_EIGHT_PHASES.reduce((a, b) => a + b.duration, 0);
                      let offset = 0;
                      for (let j = 0; j < i; j++) offset += FOUR_SEVEN_EIGHT_PHASES[j].duration;
                      const circumference = 2 * Math.PI * 45;
                      const dashLength = (FOUR_SEVEN_EIGHT_PHASES[i].duration / totalDuration) * circumference;
                      const dashOffset = circumference - (offset / totalDuration) * circumference;
                      return (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={
                            i === 0
                              ? 'rgba(59, 130, 246, 0.6)'
                              : i === 1
                              ? 'rgba(168, 85, 247, 0.6)'
                              : 'rgba(244, 114, 182, 0.6)'
                          }
                          strokeWidth="4"
                          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                        />
                      );
                    })}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 45}
                      initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 45 * (1 - (meditationPhaseIndex.ratio || 0)),
                      }}
                      transition={{ ease: 'linear', duration: 0.1 }}
                    />
                  </svg>

                  <motion.div
                    animate={{
                      scale: orbScale,
                      backgroundColor: orbColor,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    className="relative w-48 h-48 rounded-full flex items-center justify-center"
                    style={{
                      boxShadow: `0 0 80px ${orbColor}, 0 0 120px ${orbColor}`,
                    }}
                  >
                    <div className="text-center">
                      <motion.div
                        key={breathState}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-4xl font-bold text-white mb-2"
                      >
                        {BREATH_PHASE_TEXT[breathState]}
                      </motion.div>
                      <div className="text-white/80 text-lg">
                        {FOUR_SEVEN_EIGHT_PHASES[meditationPhaseIndex.index]?.text || ''}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="orb"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-64 h-64 flex items-center justify-center"
                >
                  {[0.85, 0.92, 1].map((s, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      animate={{
                        scale: orbScale * s,
                        backgroundColor: orbColor,
                        opacity: 0.3 + i * 0.15,
                      }}
                      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: i * 0.05 }}
                      style={{
                        width: `${220 + i * 20}px`,
                        height: `${220 + i * 20}px`,
                        boxShadow: `0 0 ${40 + i * 20}px ${orbColor}`,
                      }}
                    />
                  ))}

                  <motion.div
                    animate={{
                      scale: orbScale,
                      backgroundColor: orbColor,
                    }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, ${orbColor} 50%, ${orbColor} 100%)`,
                      boxShadow: `0 0 60px ${orbColor}, inset 0 0 30px rgba(255,255,255,0.3)`,
                    }}
                  >
                    <motion.span
                      key={breathState}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-white font-bold text-xl drop-shadow-lg"
                    >
                      {BREATH_PHASE_TEXT[breathState]}
                    </motion.span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <div className="relative bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Wind className="w-5 h-5 text-emerald-300" />
                <h3 className="text-white font-semibold">风车之境</h3>
              </div>
              <div className="relative h-48 flex items-end justify-center overflow-hidden rounded-2xl bg-gradient-to-t from-emerald-900/30 to-sky-900/30">
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-emerald-800/50 to-transparent" />
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <line x1="100" y1="180" x2="100" y2="90" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                  <g style={{ transform: `rotate(${windmillRotation}deg)`, transformOrigin: '100px 85px' }}>
                    <path d="M100 85 Q80 50 60 30 Q90 70 100 85" fill="rgba(59, 130, 246, 0.7)" />
                    <path d="M100 85 Q130 50 150 30 Q110 70 100 85" fill="rgba(168, 85, 247, 0.7)" />
                    <path d="M100 85 Q50 100 20 110 Q80 100 100 85" fill="rgba(52, 211, 153, 0.7)" />
                    <path d="M100 85 Q150 100 180 110 Q120 100 100 85" fill="rgba(251, 191, 36, 0.7)" />
                  </g>
                  <circle cx="100" cy="85" r="8" fill="white" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                </svg>
                <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                    style={{ width: `${breathIntensity * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-white/50 text-sm mt-3 text-center">吸气加速风车转动</p>
            </div>

            <div className="relative bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Ship className="w-5 h-5 text-blue-300" />
                <h3 className="text-white font-semibold">远航之舟</h3>
              </div>
              <div className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-t from-blue-900/50 via-indigo-900/30 to-slate-900/50">
                <div className="absolute inset-0">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-1 bg-white/20 rounded-full"
                      style={{
                        left: `${i * 25 - 10}%`,
                        bottom: `${15 + i * 8}%`,
                        width: '30%',
                      }}
                      animate={{
                        x: [0, 10, 0, -10, 0],
                      }}
                      transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
                <div className="absolute top-6 right-8 w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-orange-400 shadow-[0_0_40px_rgba(251,191,36,0.5)]" />

                <motion.div
                  className="absolute bottom-16"
                  style={{ left: `${5 + shipProgress * 75}%` }}
                  animate={{
                    y: [0, -3, 0, 3, 0],
                    rotate: [0, -1, 0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <svg width="70" height="60" viewBox="0 0 70 60">
                    <path d="M5 45 Q35 55 65 45 L55 50 Q35 58 15 50 Z" fill="rgba(139, 90, 43, 0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <rect x="33" y="15" width="4" height="30" fill="rgba(100, 60, 30, 0.9)" />
                    <path d="M37 18 Q55 30 37 42 Z" fill="rgba(255, 255, 255, 0.9)" />
                    <path d="M33 20 Q18 32 33 40 Z" fill="rgba(251, 191, 36, 0.85)" />
                  </svg>
                </motion.div>

                <div className="absolute top-3 left-3 right-3 flex gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-1.5 rounded-full transition-all duration-300',
                        i / 10 < shipProgress ? 'bg-gradient-to-r from-blue-400 to-indigo-400' : 'bg-white/10'
                      )}
                    />
                  ))}
                </div>
                <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/60 text-xs">
                  {Math.round(shipProgress * 100)}%
                </div>
              </div>
              <p className="text-white/50 text-sm mt-3 text-center">呼气推动船只航行</p>
            </div>
          </div>
        </div>

        <div className="mt-6 max-w-4xl mx-auto w-full">
          <div className="bg-gradient-to-r from-slate-800/50 via-purple-800/30 to-slate-800/50 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="text-white/50 text-sm">状态</div>
                  <div className={cn(
                    'px-4 py-1.5 rounded-full font-medium text-sm border',
                    breathState === 'inhale' && 'bg-blue-500/20 border-blue-400/40 text-blue-200',
                    breathState === 'hold' && 'bg-purple-500/20 border-purple-400/40 text-purple-200',
                    breathState === 'exhale' && 'bg-pink-500/20 border-pink-400/40 text-pink-200',
                    breathState === 'rest' && 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200',
                    breathState === 'idle' && 'bg-slate-500/20 border-slate-400/40 text-slate-200'
                  )}>
                    {BREATH_PHASE_TEXT[breathState]}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-white/50 text-sm">强度</div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${breathIntensity * 100}%`,
                          background: breathState === 'inhale'
                            ? 'linear-gradient(to right, #60a5fa, #3b82f6)'
                            : breathState === 'exhale'
                            ? 'linear-gradient(to right, #f472b6, #ec4899)'
                            : 'linear-gradient(to right, #a78bfa, #8b5cf6)',
                        }}
                      />
                    </div>
                    <span className="text-white/70 text-sm w-10">{Math.round(breathIntensity * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-white/50 text-sm">阶段</div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-10 h-10">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                        <motion.circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="url(#gradProgress)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 15}
                          style={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - phaseProgress) }}
                        />
                        <defs>
                          <linearGradient id="gradProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="50%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#f472b6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Circle className="w-2 h-2 text-white/80" />
                      </div>
                    </div>
                    <span className="text-white/70 text-sm w-10">{Math.round(phaseProgress * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white/40 text-xs">
                <div className={cn('w-2 h-2 rounded-full', isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500')} />
                {isActive ? (simulate ? '模拟呼吸中' : '麦克风检测中') : '已暂停'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
