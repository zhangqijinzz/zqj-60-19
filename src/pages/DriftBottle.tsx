import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Waves,
  Send,
  Shell,
  Heart,
  Sparkles,
  Anchor,
  Play,
  Clock,
  Calendar,
  User,
  X,
  Check,
  Flower2,
  Leaf,
} from 'lucide-react';
import { VoiceRecorder } from '@/components/common/VoiceRecorder';
import { GazeButton } from '@/components/common/GazeButton';
import { cn } from '@/lib/utils';
import type { DriftBottle, EmotionType } from '@/types';
import { getRandomBottle, sendBottle, getMyBottles, collectBottle } from '@/utils/mockApi';

type TabType = 'ocean' | 'throw' | 'beach';

interface FloatingBottle {
  id: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  rotation: number;
  loading: boolean;
  gazeProgress: number;
  isGazing: boolean;
}

const EMOTION_CONFIG: Record<EmotionType, { label: string; color: string; bg: string }> = {
  warm: { label: '温暖', color: 'text-amber-300', bg: 'from-amber-400/20 to-orange-400/20' },
  miss: { label: '思念', color: 'text-rose-300', bg: 'from-rose-400/20 to-pink-400/20' },
  encourage: { label: '鼓励', color: 'text-cyan-300', bg: 'from-cyan-400/20 to-blue-400/20' },
  peaceful: { label: '宁静', color: 'text-emerald-300', bg: 'from-emerald-400/20 to-teal-400/20' },
};

function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars: { x: number; y: number; size: number; baseAlpha: number }[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.4,
        size: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.5 + 0.3,
      });
    }

    const render = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      const skyGradient = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      skyGradient.addColorStop(0, '#0a0e27');
      skyGradient.addColorStop(0.5, '#0f1a3d');
      skyGradient.addColorStop(1, '#1a2847');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, w, h * 0.55);

      stars.forEach((s) => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + s.x * 0.01);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.baseAlpha * twinkle})`;
        ctx.fill();
      });

      const moonX = w * 0.75;
      const moonY = h * 0.18;
      const moonR = Math.min(w, h) * 0.06;

      const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 4);
      moonGlow.addColorStop(0, 'rgba(255,250,230,0.15)');
      moonGlow.addColorStop(0.5, 'rgba(255,250,230,0.05)');
      moonGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(moonX - moonR * 4, moonY - moonR * 4, moonR * 8, moonR * 8);

      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      const moonGrad = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, 0, moonX, moonY, moonR);
      moonGrad.addColorStop(0, '#fffdf5');
      moonGrad.addColorStop(0.7, '#f5f0e0');
      moonGrad.addColorStop(1, '#e8e0c8');
      ctx.fillStyle = moonGrad;
      ctx.fill();

      const seaTop = h * 0.55;
      const seaGradient = ctx.createLinearGradient(0, seaTop, 0, h);
      seaGradient.addColorStop(0, '#0f2847');
      seaGradient.addColorStop(0.3, '#0a1f38');
      seaGradient.addColorStop(0.7, '#061528');
      seaGradient.addColorStop(1, '#030a14');
      ctx.fillStyle = seaGradient;
      ctx.fillRect(0, seaTop, w, h - seaTop);

      const reflectionTop = seaTop;
      const reflectionBottom = h;
      const reflectionCenterX = moonX;
      const reflectionWidth = moonR * 3;

      for (let y = reflectionTop; y < reflectionBottom; y += 3) {
        const progress = (y - reflectionTop) / (reflectionBottom - reflectionTop);
        const waveOffset = Math.sin(t * 1.5 + y * 0.08) * 10 * (1 - progress);
        const alpha = 0.35 * (1 - progress * 0.8);
        const widthFactor = 1 + progress * 1.5;
        const x = reflectionCenterX + waveOffset;

        ctx.beginPath();
        const grad = ctx.createLinearGradient(x - reflectionWidth * widthFactor, y, x + reflectionWidth * widthFactor, y);
        grad.addColorStop(0, `rgba(255,250,230,0)`);
        grad.addColorStop(0.3, `rgba(255,250,230,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,250,230,${alpha * 1.2})`);
        grad.addColorStop(0.7, `rgba(255,250,230,${alpha})`);
        grad.addColorStop(1, `rgba(255,250,230,0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(x - reflectionWidth * widthFactor, y, reflectionWidth * 2 * widthFactor, 3);
      }

      for (let layer = 0; layer < 4; layer++) {
        const layerY = seaTop + (h - seaTop) * (0.15 + layer * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, layerY);

        for (let x = 0; x <= w; x += 5) {
          const wave = Math.sin(t * (1.2 + layer * 0.3) + x * 0.015 + layer) * (6 + layer * 3)
            + Math.sin(t * (0.8 + layer * 0.2) + x * 0.025 - layer * 0.5) * (3 + layer * 2);
          ctx.lineTo(x, layerY + wave);
        }

        ctx.strokeStyle = `rgba(100,180,255,${0.08 + layer * 0.02})`;
        ctx.lineWidth = 1 + layer * 0.3;
        ctx.stroke();
      }

      for (let i = 0; i < 30; i++) {
        const rx = ((t * 30 + i * 137) % w);
        const ry = seaTop + ((Math.sin(t * 0.5 + i) * 0.5 + 0.5) * (h - seaTop - 40)) + 20;
        const rSize = 1 + Math.sin(t * 2 + i) * 0.5;
        const rAlpha = 0.1 + Math.sin(t * 3 + i * 0.7) * 0.05;

        ctx.beginPath();
        ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${Math.max(0, rAlpha)})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

function BottleModal({
  bottle,
  onClose,
  onWarm,
  onResonate,
  onDrift,
}: {
  bottle: DriftBottle | null;
  onClose: () => void;
  onWarm: () => void;
  onResonate: () => void;
  onDrift: () => void;
}) {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!bottle?.voiceBlobUrl) return;
    audioRef.current = new Audio(bottle.voiceBlobUrl);
    audioRef.current.onended = () => setAudioPlaying(false);
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [bottle?.voiceBlobUrl]);

  const toggleAudio = () => {
    if (!audioRef.current || !bottle?.voiceBlobUrl) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setAudioPlaying(true);
    }
  };

  const emotion = bottle?.emotion ? EMOTION_CONFIG[bottle.emotion] : null;
  const dateStr = bottle ? new Date(bottle.createdAt).toLocaleDateString('zh-CN') : '';
  const duration = bottle ? `${Math.floor(bottle.duration / 60)}分${bottle.duration % 60}秒` : '';

  return (
    <AnimatePresence>
      {bottle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-400/30 via-purple-400/20 to-amber-400/30 blur-xl" />

            <div className="relative rounded-3xl bg-gradient-to-br from-[#0f1a3d]/95 via-[#1a2847]/95 to-[#0f2847]/95 border border-white/15 backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-400/10 rounded-full -translate-x-32 -translate-y-32 blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full translate-x-32 translate-y-32 blur-3xl" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-400/20 border border-white/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-white/90 font-medium text-lg">{bottle.fromAnonymous}</div>
                      <div className="flex items-center gap-2 text-white/40 text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                  {emotion && (
                    <div className={cn(
                      'px-4 py-2 rounded-full bg-gradient-to-r border border-white/10',
                      emotion.bg
                    )}>
                      <span className={cn('font-medium', emotion.color)}>{emotion.label}</span>
                    </div>
                  )}
                </div>

                {bottle.voiceBlobUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={toggleAudio}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-400/30 border border-cyan-400/30 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Play className={cn('w-5 h-5 text-cyan-300 ml-0.5', audioPlaying && 'hidden')} />
                        {audioPlaying && (
                          <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="flex gap-1">
                            <span className="w-1 h-4 bg-cyan-300 rounded-full" />
                            <span className="w-1 h-5 bg-cyan-300 rounded-full" style={{ animationDelay: '0.1s' }} />
                            <span className="w-1 h-3 bg-cyan-300 rounded-full" style={{ animationDelay: '0.2s' }} />
                          </motion.div>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>语音留言 · {duration}</span>
                        </div>
                        <div className="flex items-end gap-1 h-8">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                              key={i}
                              animate={audioPlaying ? {
                                height: ['20%', `${30 + Math.random() * 70}%`, '20%'],
                              } : {}}
                              transition={audioPlaying ? {
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.05,
                              } : {}}
                              className="w-1.5 rounded-full bg-gradient-to-t from-cyan-400/50 to-purple-400/50"
                              style={{ height: `${20 + Math.sin(i) * 30}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5"
                >
                  <p className="text-white/80 text-base leading-relaxed whitespace-pre-wrap">
                    {bottle.content}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-3 gap-3"
                >
                  <GazeButton
                    variant="glow"
                    className="!min-h-[70px] !px-4 !py-3 flex-col !gap-1"
                    icon={<Heart className="w-5 h-5" />}
                    onActivate={onWarm}
                  >
                    <span className="text-sm">温暖</span>
                  </GazeButton>
                  <GazeButton
                    variant="primary"
                    className="!min-h-[70px] !px-4 !py-3 flex-col !gap-1"
                    icon={<Sparkles className="w-5 h-5" />}
                    onActivate={onResonate}
                  >
                    <span className="text-sm">共鸣</span>
                  </GazeButton>
                  <GazeButton
                    variant="ghost"
                    className="!min-h-[70px] !px-4 !py-3 flex-col !gap-1"
                    icon={<Anchor className="w-5 h-5" />}
                    onActivate={onDrift}
                  >
                    <span className="text-sm">漂流</span>
                  </GazeButton>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toast({ message, type }: { message: string; type?: 'success' | 'info' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border backdrop-blur-sm flex items-center gap-2"
      style={{
        background: type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(34,211,238,0.15)',
        borderColor: type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(34,211,238,0.4)',
      }}
    >
      {type === 'success' ? (
        <Check className="w-4 h-4 text-emerald-300" />
      ) : (
        <Sparkles className="w-4 h-4 text-cyan-300" />
      )}
      <span className={cn(
        'font-medium',
        type === 'success' ? 'text-emerald-200' : 'text-cyan-200'
      )}>{message}</span>
    </motion.div>
  );
}

export default function DriftBottlePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('ocean');
  const [selectedBottle, setSelectedBottle] = useState<DriftBottle | null>(null);
  const [floatingBottles, setFloatingBottles] = useState<FloatingBottle[]>([]);
  const [myBottles, setMyBottles] = useState<DriftBottle[]>([]);
  const [isLoadingMyBottles, setIsLoadingMyBottles] = useState(false);
  const [throwAnimation, setThrowAnimation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>('warm');

  const gazeTimerRef = useRef<Record<string, number | null>>({});
  const gazeRafRef = useRef<Record<string, number | null>>({});

  const generateFloatingBottles = useCallback(() => {
    Object.values(gazeTimerRef.current).forEach((t) => {
      if (t !== null) clearTimeout(t);
    });
    Object.values(gazeRafRef.current).forEach((t) => {
      if (t !== null) cancelAnimationFrame(t);
    });
    gazeTimerRef.current = {};
    gazeRafRef.current = {};

    const count = 3 + Math.floor(Math.random() * 3);
    const bottles: FloatingBottle[] = [];
    for (let i = 0; i < count; i++) {
      bottles.push({
        id: `fb-${Date.now()}-${i}`,
        x: 10 + Math.random() * 80,
        y: 55 + Math.random() * 35,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 4,
        rotation: Math.random() * 20 - 10,
        loading: false,
        gazeProgress: 0,
        isGazing: false,
      });
    }
    setFloatingBottles(bottles);
  }, []);

  useEffect(() => {
    generateFloatingBottles();
  }, [generateFloatingBottles]);

  const loadMyBottles = useCallback(async () => {
    setIsLoadingMyBottles(true);
    try {
      const bottles = await getMyBottles();
      setMyBottles(bottles);
    } catch {
      setMyBottles([]);
    } finally {
      setIsLoadingMyBottles(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'beach') {
      loadMyBottles();
    }
  }, [activeTab, loadMyBottles]);

  const showToast = (message: string, type?: 'success' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleOpenBottle = async (floatingId: string) => {
    const fb = floatingBottles.find((b) => b.id === floatingId);
    if (!fb || fb.loading) return;

    setFloatingBottles((prev) =>
      prev.map((b) =>
        b.id === floatingId ? { ...b, loading: true, gazeProgress: 0, isGazing: false } : b
      )
    );

    try {
      const bottle = await getRandomBottle();
      setSelectedBottle(bottle);
    } finally {
      setFloatingBottles((prev) =>
        prev.map((b) => (b.id === floatingId ? { ...b, loading: false } : b))
      );
    }
  };

  const handleGazeStart = (floatingId: string) => {
    const fb = floatingBottles.find((b) => b.id === floatingId);
    if (!fb || fb.loading) return;

    setFloatingBottles((prev) =>
      prev.map((b) => (b.id === floatingId ? { ...b, isGazing: true, gazeProgress: 0 } : b))
    );

    const startTime = Date.now();
    const activationTime = 1500;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / activationTime, 1);

      setFloatingBottles((prev) =>
        prev.map((b) =>
          b.id === floatingId && b.isGazing ? { ...b, gazeProgress: progress } : b
        )
      );

      if (progress >= 1) {
        handleOpenBottle(floatingId);
        return;
      }

      if (gazeRafRef.current[floatingId] !== undefined) {
        gazeRafRef.current[floatingId] = requestAnimationFrame(tick);
      }
    };

    gazeRafRef.current[floatingId] = requestAnimationFrame(tick);
  };

  const handleGazeEnd = (floatingId: string) => {
    if (gazeRafRef.current[floatingId] !== null && gazeRafRef.current[floatingId] !== undefined) {
      cancelAnimationFrame(gazeRafRef.current[floatingId] as number);
    }
    delete gazeRafRef.current[floatingId];

    setFloatingBottles((prev) =>
      prev.map((b) =>
        b.id === floatingId ? { ...b, isGazing: false, gazeProgress: 0 } : b
      )
    );
  };

  useEffect(() => {
    return () => {
      Object.values(gazeRafRef.current).forEach((t) => {
        if (t !== null && t !== undefined) cancelAnimationFrame(t);
      });
    };
  }, []);

  const handleWarm = useCallback(async () => {
    if (selectedBottle && !selectedBottle.isSentByMe) {
      await collectBottle(selectedBottle);
      showToast('温暖已送达 ✨', 'success');
    }
    setSelectedBottle(null);
    generateFloatingBottles();
  }, [selectedBottle, generateFloatingBottles]);

  const handleResonate = useCallback(async () => {
    if (selectedBottle && !selectedBottle.isSentByMe) {
      await collectBottle(selectedBottle);
      showToast('共鸣已收藏 💫', 'success');
    }
    setSelectedBottle(null);
    generateFloatingBottles();
  }, [selectedBottle, generateFloatingBottles]);

  const handleDrift = useCallback(() => {
    showToast('瓶子继续漂流~', 'info');
    setSelectedBottle(null);
    generateFloatingBottles();
  }, [generateFloatingBottles]);

  const handleRecordingComplete = async (blob: Blob, duration: number, transcript?: string) => {
    setThrowAnimation(true);
    try {
      await sendBottle(blob, duration, selectedEmotion, transcript || undefined);
      setTimeout(() => {
        setThrowAnimation(false);
        showToast('瓶子已投入大海 🌊', 'success');
      }, 2000);
    } catch {
      setThrowAnimation(false);
      showToast('发送失败，请重试', 'info');
    }
  };

  const TABS = useMemo(
    () => [
      { id: 'ocean' as TabType, label: '海面', icon: <Waves className="w-5 h-5" /> },
      { id: 'throw' as TabType, label: '扔瓶子', icon: <Send className="w-5 h-5" /> },
      { id: 'beach' as TabType, label: '我的海滩', icon: <Shell className="w-5 h-5" /> },
    ],
    []
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <OceanBackground />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <GazeButton
            variant="ghost"
            className="!min-h-[56px] !min-w-[56px] !w-14 !h-14 !p-0 !rounded-2xl"
            icon={<ArrowLeft className="w-6 h-6" />}
            onActivate={() => navigate('/')}
          >
            <span className="sr-only">返回</span>
          </GazeButton>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-100 via-white to-purple-200 bg-clip-text text-transparent">
              病友漂流瓶
            </h1>
            <p className="text-white/40 text-sm mt-1">匿名心声，温暖共鸣</p>
          </motion.div>

          <div className="w-14" />
        </div>

        <div className="px-6 mb-6">
          <div className="relative flex p-1.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 max-w-md mx-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300',
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/15"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-6 pb-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'ocean' && (
              <motion.div
                key="ocean"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-4xl mx-auto"
                style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
              >
                {floatingBottles.map((bottle) => (
                  <motion.div
                    key={bottle.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: bottle.delay * 0.3, type: 'spring' }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{
                      left: `${bottle.x}%`,
                      top: `${bottle.y}%`,
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -12, 0],
                        rotate: [bottle.rotation - 3, bottle.rotation + 3, bottle.rotation - 3],
                      }}
                      transition={{
                        duration: bottle.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <div
                        data-gaze="true"
                        data-gaze-id={bottle.id}
                        onMouseEnter={() => handleGazeStart(bottle.id)}
                        onMouseLeave={() => handleGazeEnd(bottle.id)}
                        className={cn(
                          'relative w-20 h-28 flex items-center justify-center',
                          bottle.loading && 'pointer-events-none'
                        )}
                      >
                        <div
                          className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-300"
                          style={{
                            background:
                              bottle.isGazing || bottle.gazeProgress > 0
                                ? 'radial-gradient(circle, rgba(34,211,238,0.6) 0%, rgba(167,139,250,0.35) 40%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(34,211,238,0.4) 0%, rgba(167,139,250,0.2) 40%, transparent 70%)',
                          }}
                        />
                        <motion.div
                          animate={{
                            opacity: bottle.isGazing ? [0.6, 1, 0.6] : [0.6, 1, 0.6],
                          }}
                          transition={{
                            duration: bottle.isGazing ? 1 : 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className={cn(
                            'absolute -inset-2 rounded-full border-2 transition-colors duration-300',
                            bottle.isGazing ? 'border-cyan-400/50' : 'border-cyan-400/20'
                          )}
                        />

                        {bottle.gazeProgress > 0 && (
                          <svg
                            className="absolute inset-0 w-20 h-28 -rotate-90 pointer-events-none z-20"
                            viewBox="0 0 80 112"
                          >
                            <circle
                              cx="40"
                              cy="56"
                              r="50"
                              fill="none"
                              stroke="rgba(34,211,238,0.25)"
                              strokeWidth="2"
                            />
                            <circle
                              cx="40"
                              cy="56"
                              r="50"
                              fill="none"
                              stroke="url(#gazeGradient)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 50}
                              strokeDashoffset={2 * Math.PI * 50 * (1 - bottle.gazeProgress)}
                              className="transition-all duration-75"
                            />
                            <defs>
                              <linearGradient id="gazeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#a78bfa" />
                              </linearGradient>
                            </defs>
                          </svg>
                        )}

                        <svg
                          viewBox="0 0 64 96"
                          className={cn(
                            'relative z-10 w-16 h-24 transition-all duration-300',
                            bottle.isGazing
                              ? 'drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]'
                              : 'drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                          )}
                        >
                          <defs>
                            <linearGradient id="bottleGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                              <stop offset="50%" stopColor="rgba(180,230,255,0.15)" />
                              <stop offset="100%" stopColor="rgba(140,200,255,0.25)" />
                            </linearGradient>
                            <linearGradient id="bottleHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </linearGradient>
                          </defs>

                          <path
                            d="M26 4 Q28 2 32 2 Q36 2 38 4 L38 16 Q34 18 32 18 Q30 18 26 16 Z"
                            fill="url(#bottleGlass)"
                            stroke="rgba(180,220,255,0.5)"
                            strokeWidth="1"
                          />
                          <path
                            d="M24 16 L24 22 Q16 26 16 38 L16 80 Q16 92 32 92 Q48 92 48 80 L48 38 Q48 26 40 22 L40 16 Q36 18 32 18 Q28 18 24 16 Z"
                            fill="url(#bottleGlass)"
                            stroke="rgba(180,220,255,0.5)"
                            strokeWidth="1"
                          />
                          <path
                            d="M22 28 L20 80 Q20 86 24 88"
                            fill="none"
                            stroke="url(#bottleHighlight)"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />

                          <g opacity={bottle.loading ? 0 : 1}>
                            <rect
                              x="26"
                              y="40"
                              width="12"
                              height="16"
                              rx="1"
                              fill="rgba(255,230,180,0.9)"
                              transform="rotate(8 32 48)"
                            />
                            <line
                              x1="29"
                              y1="46"
                              x2="35"
                              y2="46"
                              stroke="rgba(180,120,60,0.6)"
                              strokeWidth="0.5"
                              transform="rotate(8 32 48)"
                            />
                            <line
                              x1="29"
                              y1="50"
                              x2="34"
                              y2="50"
                              stroke="rgba(180,120,60,0.6)"
                              strokeWidth="0.5"
                              transform="rotate(8 32 48)"
                            />
                          </g>

                          {bottle.loading && (
                            <motion.circle
                              cx="32"
                              cy="56"
                              r="6"
                              fill="none"
                              stroke="rgba(34,211,238,0.8)"
                              strokeWidth="2"
                              strokeDasharray="20 20"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              style={{ transformOrigin: '32px 56px' }}
                            />
                          )}
                        </svg>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"
                >
                  <p className="text-white/40 text-sm">
                    ✨ 凝视瓶子 1.5 秒即可捞起打开
                  </p>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'throw' && (
              <motion.div
                key="throw"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-2xl mx-auto py-8"
              >
                <AnimatePresence mode="wait">
                  {throwAnimation ? (
                    <motion.div
                      key="animation"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative h-[500px] flex flex-col items-center justify-center"
                    >
                      <motion.div
                        initial={{ y: -100, opacity: 0, scale: 0.5 }}
                        animate={{
                          y: [0, 150, 400],
                          opacity: [1, 1, 0],
                          scale: [1, 1.2, 0.3],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 2,
                          ease: [0.4, 0, 0.6, 1],
                          times: [0, 0.5, 1],
                        }}
                        className="relative"
                      >
                        <div
                          className="absolute inset-0 blur-3xl scale-150"
                          style={{
                            background:
                              'radial-gradient(circle, rgba(34,211,238,0.5) 0%, rgba(167,139,250,0.3) 40%, transparent 70%)',
                          }}
                        />
                        <svg viewBox="0 0 64 96" className="w-24 h-36 relative z-10">
                          <path
                            d="M26 4 Q28 2 32 2 Q36 2 38 4 L38 16 Q34 18 32 18 Q30 18 26 16 Z"
                            fill="rgba(255,255,255,0.3)"
                            stroke="rgba(180,220,255,0.6)"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M24 16 L24 22 Q16 26 16 38 L16 80 Q16 92 32 92 Q48 92 48 80 L48 38 Q48 26 40 22 L40 16 Q36 18 32 18 Q28 18 24 16 Z"
                            fill="rgba(200,240,255,0.2)"
                            stroke="rgba(180,220,255,0.6)"
                            strokeWidth="1.5"
                          />
                          <rect
                            x="26"
                            y="40"
                            width="12"
                            height="16"
                            rx="1"
                            fill="rgba(255,230,180,0.95)"
                            transform="rotate(8 32 48)"
                          />
                        </svg>
                      </motion.div>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-12 text-white/70 text-xl"
                      >
                        瓶子正在飘向远方...
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-2 text-white/40 text-sm"
                      >
                        愿它能温暖另一个灵魂
                      </motion.p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="recorder"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center gap-8"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-2"
                      >
                        <h2 className="text-2xl font-bold text-white/90 mb-2">说出你的心声</h2>
                        <p className="text-white/50">
                          你的声音将被匿名装入瓶中，漂向远方的朋友
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="w-full max-w-md mb-6"
                      >
                        <p className="text-white/70 text-sm text-center mb-3">选择瓶子的情感标签</p>
                        <div className="grid grid-cols-4 gap-2">
                          {([
                            { key: 'warm', label: '温暖', icon: Heart, color: 'amber' },
                            { key: 'miss', label: '思念', icon: Flower2, color: 'rose' },
                            { key: 'encourage', label: '鼓励', icon: Sparkles, color: 'cyan' },
                            { key: 'peaceful', label: '宁静', icon: Leaf, color: 'emerald' },
                          ] as const).map(({ key, label, icon: Icon, color }) => {
                            const isSelected = selectedEmotion === key;
                            const colors: Record<string, { active: string; hover: string }> = {
                              amber: {
                                active: 'from-amber-400/30 to-orange-400/30 border-amber-400/50 text-amber-200',
                                hover: 'hover:bg-amber-400/10 hover:border-amber-400/30',
                              },
                              rose: {
                                active: 'from-rose-400/30 to-pink-400/30 border-rose-400/50 text-rose-200',
                                hover: 'hover:bg-rose-400/10 hover:border-rose-400/30',
                              },
                              cyan: {
                                active: 'from-cyan-400/30 to-blue-400/30 border-cyan-400/50 text-cyan-200',
                                hover: 'hover:bg-cyan-400/10 hover:border-cyan-400/30',
                              },
                              emerald: {
                                active: 'from-emerald-400/30 to-teal-400/30 border-emerald-400/50 text-emerald-200',
                                hover: 'hover:bg-emerald-400/10 hover:border-emerald-400/30',
                              },
                            };
                            return (
                              <motion.button
                                key={key}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedEmotion(key)}
                                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                                  isSelected
                                    ? `bg-gradient-to-br ${colors[color].active}`
                                    : `bg-white/5 border-white/10 text-white/60 ${colors[color].hover}`
                                }`}
                                data-gaze="true"
                              >
                                <Icon className={`w-5 h-5 ${isSelected ? '' : 'opacity-70'}`} />
                                <span className="text-xs font-medium">{label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      <div className="relative w-48 h-48 mb-4 flex items-center justify-center">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              'radial-gradient(circle, rgba(34,211,238,0.2) 0%, rgba(167,139,250,0.1) 40%, transparent 70%)',
                          }}
                        />
                        <motion.div
                          animate={{ rotate: [0, 3, -3, 0], y: [0, -5, 0] }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <svg viewBox="0 0 64 96" className="w-28 h-40 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                            <defs>
                              <linearGradient id="tbGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                                <stop offset="50%" stopColor="rgba(180,230,255,0.2)" />
                                <stop offset="100%" stopColor="rgba(140,200,255,0.3)" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M26 4 Q28 2 32 2 Q36 2 38 4 L38 16 Q34 18 32 18 Q30 18 26 16 Z"
                              fill="url(#tbGlass)"
                              stroke="rgba(180,220,255,0.6)"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M24 16 L24 22 Q16 26 16 38 L16 80 Q16 92 32 92 Q48 92 48 80 L48 38 Q48 26 40 22 L40 16 Q36 18 32 18 Q28 18 24 16 Z"
                              fill="url(#tbGlass)"
                              stroke="rgba(180,220,255,0.6)"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </motion.div>
                      </div>

                      <VoiceRecorder
                        onRecordingComplete={handleRecordingComplete}
                        maxDuration={180}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'beach' && (
              <motion.div
                key="beach"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-4xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white/90 mb-2">我的海滩</h2>
                  <p className="text-white/50">
                    这里是你收藏和发送的每一份心意
                  </p>
                </div>

                {isLoadingMyBottles ? (
                  <div className="flex justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
                    />
                  </div>
                ) : myBottles.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400/10 to-purple-400/10 border border-white/10 flex items-center justify-center mb-6">
                      <Shell className="w-12 h-12 text-white/30" />
                    </div>
                    <p className="text-white/50 text-lg mb-2">海滩空空如也</p>
                    <p className="text-white/30 text-sm">
                      去海面捞一个瓶子，或扔一个属于你的吧
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {myBottles.map((bottle, index) => {
                      const emotion = bottle.emotion ? EMOTION_CONFIG[bottle.emotion] : null;
                      const dateStr = new Date(bottle.createdAt).toLocaleDateString('zh-CN');
                      const timeStr = new Date(bottle.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <motion.div
                          key={bottle.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08, type: 'spring' }}
                          className="group relative"
                        >
                          <div
                            className="absolute -inset-0.5 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{
                              background: bottle.isSentByMe
                                ? 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,113,133,0.2))'
                                : 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(167,139,250,0.2))',
                            }}
                          />

                          <div className="relative rounded-2xl bg-gradient-to-br from-[#1a2847]/90 to-[#0f1a3d]/90 border border-white/10 backdrop-blur-sm p-5 overflow-hidden">
                            <div
                              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl"
                              style={{
                                background: bottle.isSentByMe
                                  ? 'rgba(251,191,36,0.1)'
                                  : 'rgba(34,211,238,0.1)',
                              }}
                            />

                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                                      bottle.isSentByMe
                                        ? 'bg-gradient-to-br from-amber-400/20 to-rose-400/20 border border-amber-400/20'
                                        : 'bg-gradient-to-br from-cyan-400/20 to-purple-400/20 border border-cyan-400/20'
                                    )}
                                  >
                                    <Shell
                                      className={cn(
                                        'w-5 h-5',
                                        bottle.isSentByMe ? 'text-amber-300' : 'text-cyan-300'
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-white/90 font-medium">
                                      {bottle.fromAnonymous}
                                    </div>
                                    <div className="flex items-center gap-2 text-white/40 text-xs mt-0.5">
                                      <Calendar className="w-3 h-3" />
                                      <span>{dateStr} {timeStr}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {emotion && (
                                    <span
                                      className={cn(
                                        'px-2.5 py-1 rounded-full text-xs font-medium border border-white/10',
                                        emotion.color,
                                        emotion.bg
                                      )}
                                    >
                                      {emotion.label}
                                    </span>
                                  )}
                                  {bottle.isSentByMe && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/10 text-amber-300 border border-amber-400/20">
                                      我发出的
                                    </span>
                                  )}
                                  {bottle.isCollected && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                                      已收藏
                                    </span>
                                  )}
                                </div>
                              </div>

                              {bottle.content && (
                                <p className="text-white/70 text-sm leading-relaxed line-clamp-3 mb-4">
                                  {bottle.content}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-white/40 text-xs pt-3 border-t border-white/5">
                                {bottle.voiceBlobUrl && (
                                  <div className="flex items-center gap-1.5">
                                    <Play className="w-3 h-3" />
                                    <span>{Math.floor(bottle.duration / 60)}分{bottle.duration % 60}秒</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {bottle.duration >= 60
                                      ? `${Math.floor(bottle.duration / 60)}分${bottle.duration % 60}秒`
                                      : `${bottle.duration}秒`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottleModal
        bottle={selectedBottle}
        onClose={() => setSelectedBottle(null)}
        onWarm={handleWarm}
        onResonate={handleResonate}
        onDrift={handleDrift}
      />
    </div>
  );
}
