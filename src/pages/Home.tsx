import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wind, Castle, MessageCircleHeart, Settings, Eye } from 'lucide-react';
import { AuroraBackground } from '@/components/common/AuroraBackground';
import { StatusIndicators } from '@/components/layout/StatusIndicators';
import { GazeButton } from '@/components/common/GazeButton';
import { useGazeTracker } from '@/hooks/useGazeTracker';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useAppStateStore } from '@/stores/appStateStore';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { cn } from '@/lib/utils';

interface PortalData {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
  position: { x: number; y: number };
}

const PORTALS: PortalData[] = [
  {
    id: 'eye-explore',
    title: '眼动漫游',
    subtitle: '化身光团，遨游星海',
    route: '/eye-explore',
    icon: <Sparkles className="w-12 h-12" />,
    gradient: 'from-cyan-400/30 to-blue-500/30',
    shadowColor: 'rgba(34,211,238,0.4)',
    position: { x: 20, y: 35 },
  },
  {
    id: 'breath-puzzle',
    title: '呼吸解谜',
    subtitle: '一呼一吸，风起船行',
    route: '/breath-puzzle',
    icon: <Wind className="w-12 h-12" />,
    gradient: 'from-rose-400/30 to-pink-500/30',
    shadowColor: 'rgba(251,113,133,0.4)',
    position: { x: 80, y: 35 },
  },
  {
    id: 'memory-palace',
    title: '记忆宫殿',
    subtitle: '以声铸形，故地重游',
    route: '/memory-palace',
    icon: <Castle className="w-12 h-12" />,
    gradient: 'from-amber-400/30 to-orange-500/30',
    shadowColor: 'rgba(251,191,36,0.4)',
    position: { x: 20, y: 72 },
  },
  {
    id: 'drift-bottle',
    title: '病友漂流瓶',
    subtitle: '匿名心声，温暖共鸣',
    route: '/drift-bottle',
    icon: <MessageCircleHeart className="w-12 h-12" />,
    gradient: 'from-emerald-400/30 to-teal-500/30',
    shadowColor: 'rgba(16,185,129,0.4)',
    position: { x: 80, y: 72 },
  },
];

const CONSTELLATION_LINES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [0, 3],
];

export default function Home() {
  const navigate = useNavigate();
  const theme = useUserSettingsStore((s) => s.theme);
  const setGazeActive = useAppStateStore((s) => s.setIsGazeTrackerActive);
  const setVoiceActive = useAppStateStore((s) => s.setIsVoiceRecognitionActive);
  const isGazeActive = useAppStateStore((s) => s.isGazeTrackerActive);
  const [greeting, setGreeting] = useState('');

  const { start: startGaze, stop: stopGaze, GazeCursor, isActive: gazeIsActive } =
    useGazeTracker({
      onGazeActivate: (el) => {
        const route = el.getAttribute('data-route');
        if (route) navigate(route);
      },
    });

  const { speak, start: startVoice, stop: stopVoice, isListening, wakeWordDetected } =
    useVoiceRecognition({
      onCommand: (cmd) => {
        if (cmd === 'back') return;
        if (cmd === 'home') return;
        if (cmd === 'settings') {
          navigate('/settings');
          return;
        }
        const portal = PORTALS.find((p) => p.id === cmd);
        if (portal) {
          speak(`正在进入${portal.title}`);
          navigate(portal.route);
        }
      },
    });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了，愿星光陪你度过');
    else if (hour < 12) setGreeting('早安，新的一天开始了');
    else if (hour < 14) setGreeting('午安，享受此刻的宁静');
    else if (hour < 18) setGreeting('下午好，阳光正好');
    else if (hour < 22) setGreeting('晚上好，愿你有个好梦');
    else setGreeting('夜深了，愿星光陪你度过');

    startGaze();
    setGazeActive(true);
    startVoice();
    setVoiceActive(true);

    return () => {
      stopGaze();
      setGazeActive(false);
      stopVoice();
      setVoiceActive(false);
    };
  }, [startGaze, stopGaze, setGazeActive, startVoice, stopVoice, setVoiceActive]);

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AuroraBackground theme={theme} intensity={1.2} />
      <StatusIndicators
        isGazeReady={gazeIsActive}
        isMicReady={true}
        isVoiceReady={isListening}
      />
      <GazeCursor />

      {wakeWordDetected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-sm"
        >
          <span className="text-amber-200 font-medium">在呢，请说~</span>
        </motion.div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400/30 via-purple-400/30 to-rose-400/30 border border-white/20 backdrop-blur-sm shadow-[0_0_60px_rgba(124,58,237,0.3)]">
              <Eye className="w-12 h-12 text-white/90" />
            </div>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
            灵境漫游
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-white/60 mb-2"
          >
            {greeting}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-base md:text-lg text-white/40"
          >
            凝视光球 1.5 秒即可进入 · 或说「小灵小灵，打开漫游」
          </motion.p>
        </motion.div>

        <div className="relative w-full max-w-5xl aspect-square md:aspect-[16/10]">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {CONSTELLATION_LINES.map(([a, b], i) => {
              const p1 = PORTALS[a].position;
              const p2 = PORTALS[b].position;
              return (
                <motion.line
                  key={i}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="url(#constellationGrad)"
                  strokeWidth="0.15"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, delay: 1 + i * 0.2 }}
                />
              );
            })}
            <defs>
              <linearGradient id="constellationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fb7185" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>

          {PORTALS.map((portal, i) => (
            <motion.div
              key={portal.id}
              data-gaze="true"
              data-gaze-id={portal.id}
              data-route={portal.route}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.15, type: 'spring' }}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group',
                'w-44 h-44 md:w-56 md:h-56'
              )}
              style={{
                left: `${portal.position.x}%`,
                top: `${portal.position.y}%`,
              }}
              onMouseEnter={() => {
                (document.querySelector(`[data-gaze-id="${portal.id}"]`) as HTMLElement)?.setAttribute(
                  'data-gaze',
                  'true'
                );
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                className={cn(
                  'relative w-full h-full rounded-full flex flex-col items-center justify-center',
                  'bg-gradient-to-br backdrop-blur-md border border-white/15',
                  'transition-all duration-500 group-hover:border-white/30',
                  portal.gradient
                )}
                style={{ boxShadow: `0 0 80px ${portal.shadowColor}` }}
                onClick={() => handleNavigate(portal.route)}
              >
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/5" />

                <div className="relative z-10 text-white/90 flex flex-col items-center gap-3 px-4 text-center">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                    className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    {portal.icon}
                  </motion.div>
                  <div>
                    <div className="text-2xl font-bold mb-1">{portal.title}</div>
                    <div className="text-sm text-white/60">{portal.subtitle}</div>
                  </div>
                </div>

                <div
                  className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${portal.shadowColor.replace('0.4', '0.2')} 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-12"
        >
          <GazeButton
            variant="ghost"
            icon={<Settings className="w-5 h-5" />}
            onActivate={() => navigate('/settings')}
          >
            无障碍设置
          </GazeButton>
        </motion.div>
      </div>

      {!isGazeActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <GazeButton variant="primary" icon={<Eye className="w-5 h-5" />} onActivate={startGaze}>
            启动眼动追踪
          </GazeButton>
        </motion.div>
      )}
    </div>
  );
}
