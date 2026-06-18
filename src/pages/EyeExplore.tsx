import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Star, Feather, Gem, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuroraBackground } from '@/components/common/AuroraBackground';
import { GazeButton } from '@/components/common/GazeButton';
import { useGazeTracker } from '@/hooks/useGazeTracker';
import { useAppStateStore } from '@/stores/appStateStore';
import { cn } from '@/lib/utils';

type SceneType = 'starry' | 'forest' | 'cloud';
type ShardType = 'butterfly' | 'crystal' | 'stardust';

interface SceneShard {
  id: string;
  type: ShardType;
  x: number;
  y: number;
  content: string;
  collected: boolean;
}

const SCENES: { id: SceneType; name: string; theme: 'aurora' | 'ocean' | 'forest' | 'sunset'; gradient: string }[] = [
  { id: 'starry', name: '深邃星空', theme: 'aurora', gradient: 'from-indigo-900/80 via-purple-900/60 to-slate-900/80' },
  { id: 'forest', name: '梦幻森林', theme: 'forest', gradient: 'from-emerald-900/80 via-teal-900/60 to-slate-900/80' },
  { id: 'cloud', name: '飘渺云端', theme: 'ocean', gradient: 'from-sky-900/80 via-blue-900/60 to-slate-900/80' },
];

const SHARD_CONTENTS: Record<ShardType, string[]> = {
  butterfly: [
    '童年夏日的蝴蝶停在指尖',
    '那年春天花园里的约定',
    '自由飞舞的美好憧憬',
    '化茧成蝶的勇气瞬间',
  ],
  crystal: [
    '外婆留下的水晶项链',
    '清晨露珠折射的彩虹',
    '寒冬窗棂上的冰花',
    '海边拾到的透明贝壳',
  ],
  stardust: [
    '夏夜仰望的银河璀璨',
    '流星划过的许愿时刻',
    '第一次望远镜里的星云',
    '星座图上标记的思念',
  ],
};

const TOTAL_SHARDS_PER_SCENE = 5;

function generateShards(scene: SceneType): SceneShard[] {
  const shards: SceneShard[] = [];
  const types: ShardType[] = ['butterfly', 'crystal', 'stardust'];

  for (let i = 0; i < TOTAL_SHARDS_PER_SCENE; i++) {
    const type = types[i % types.length];
    const contents = SHARD_CONTENTS[type];
    shards.push({
      id: `${scene}-${i}`,
      type,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 65,
      content: contents[Math.floor(Math.random() * contents.length)],
      collected: false,
    });
  }
  return shards;
}

function ShardIcon({ type, className, style }: { type: ShardType; className?: string; style?: React.CSSProperties }) {
  switch (type) {
    case 'butterfly':
      return <Feather className={className} style={style} />;
    case 'crystal':
      return <Gem className={className} style={style} />;
    case 'stardust':
      return <Sparkles className={className} style={style} />;
  }
}

function ShardParticle({
  shard,
  onCollect,
  isGazing,
}: {
  shard: SceneShard;
  onCollect: () => void;
  isGazing: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isGazing && !shard.collected) {
      startTimeRef.current = Date.now();
      const tick = () => {
        if (startTimeRef.current === null) return;
        const elapsed = Date.now() - startTimeRef.current;
        const newProgress = Math.min(elapsed / 1500, 1);
        setProgress(newProgress);
        if (newProgress >= 1) {
          onCollect();
          startTimeRef.current = null;
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      startTimeRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      setProgress(0);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isGazing, shard.collected, onCollect]);

  if (shard.collected) return null;

  const colorMap: Record<ShardType, { glow: string; stroke: string; fill: string }> = {
    butterfly: {
      glow: 'rgba(244,114,182,0.5)',
      stroke: '#f472b6',
      fill: 'rgba(244,114,182,0.2)',
    },
    crystal: {
      glow: 'rgba(56,189,248,0.5)',
      stroke: '#38bdf8',
      fill: 'rgba(56,189,248,0.2)',
    },
    stardust: {
      glow: 'rgba(251,191,36,0.5)',
      stroke: '#fbbf24',
      fill: 'rgba(251,191,36,0.2)',
    },
  };

  const colors = colorMap[shard.type];

  return (
    <motion.div
      data-gaze="true"
      data-gaze-id={shard.id}
      data-shard-id={shard.id}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer',
        'w-20 h-20 md:w-24 md:h-24'
      )}
      style={{
        left: `${shard.x}%`,
        top: `${shard.y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 15 }}
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 3 + Math.random(),
          repeat: Infinity,
          ease: 'easeInOut',
          delay: Math.random() * 2,
        }}
        className="relative w-full h-full flex items-center justify-center"
        style={{
          filter: `drop-shadow(0 0 20px ${colors.glow})`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60"
          style={{ background: `radial-gradient(circle, ${colors.stroke} 0%, transparent 70%)` }}
        />

        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
            className="transition-all duration-75"
          />
        </svg>

        {progress > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.stroke}${Math.floor(progress * 30)
                .toString(16)
                .padStart(2, '0')} 0%, transparent 70%)`,
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        <div className="relative z-10 p-4 rounded-full" style={{ background: colors.fill }}>
          <ShardIcon
            type={shard.type}
            className={cn(
              'w-8 h-8 md:w-10 md:h-10 transition-transform duration-300',
              isGazing && 'scale-110'
            )}
            style={{ color: colors.stroke }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EyeExplore() {
  const navigate = useNavigate();
  const addShard = useAppStateStore((s) => s.addShard);
  const setGazeActive = useAppStateStore((s) => s.setIsGazeTrackerActive);

  const [currentScene, setCurrentScene] = useState<SceneType>('starry');
  const [sceneShards, setSceneShards] = useState<Record<SceneType, SceneShard[]>>(() => ({
    starry: generateShards('starry'),
    forest: generateShards('forest'),
    cloud: generateShards('cloud'),
  }));
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 50 });
  const [showCollectToast, setShowCollectToast] = useState<SceneShard | null>(null);
  const [gazingShardId, setGazingShardId] = useState<string | null>(null);

  const shardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const totalShards = Object.values(sceneShards).flat().length;
  const totalCollected = Object.values(sceneShards)
    .flat()
    .filter((s) => s.collected).length;
  const currentShards = sceneShards[currentScene];
  const currentCollected = currentShards.filter((s) => s.collected).length;
  const sceneConfig = SCENES.find((s) => s.id === currentScene)!;

  const { start: startGaze, stop: stopGaze, GazeCursor, gazePosition, isActive: gazeIsActive } =
    useGazeTracker({
      onGazeActivate: () => {},
      activationTime: 1500,
    });

  useEffect(() => {
    startGaze();
    setGazeActive(true);
    return () => {
      stopGaze();
      setGazeActive(false);
    };
  }, [startGaze, stopGaze, setGazeActive]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPlayerPos({
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(10, Math.min(85, y)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!gazeIsActive) {
      setGazingShardId(null);
      return;
    }

    let found: string | null = null;
    shardRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      if (
        gazePosition.x >= rect.left &&
        gazePosition.x <= rect.right &&
        gazePosition.y >= rect.top &&
        gazePosition.y <= rect.bottom
      ) {
        found = id;
      }
    });
    setGazingShardId(found);
  }, [gazePosition, gazeIsActive, currentShards]);

  const handleCollectShard = useCallback(
    (shard: SceneShard) => {
      setSceneShards((prev) => ({
        ...prev,
        [currentScene]: prev[currentScene].map((s) =>
          s.id === shard.id ? { ...s, collected: true } : s
        ),
      }));
      addShard({
        x: shard.x,
        y: shard.y,
        content: shard.content,
      });
      setShowCollectToast(shard);
      setTimeout(() => setShowCollectToast(null), 2500);
    },
    [currentScene, addShard]
  );

  const switchScene = useCallback((direction: 'prev' | 'next') => {
    const currentIdx = SCENES.findIndex((s) => s.id === currentScene);
    let newIdx: number;
    if (direction === 'prev') {
      newIdx = currentIdx === 0 ? SCENES.length - 1 : currentIdx - 1;
    } else {
      newIdx = currentIdx === SCENES.length - 1 ? 0 : currentIdx + 1;
    }
    setCurrentScene(SCENES[newIdx].id);
  }, [currentScene]);

  const progressPercent = useMemo(
    () => Math.round((totalCollected / totalShards) * 100),
    [totalCollected, totalShards]
  );

  const floatingParticles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.5,
    }));
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" ref={containerRef}>
      <AuroraBackground theme={sceneConfig.theme} intensity={1.5} />

      <div
        className={cn(
          'fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000',
          sceneConfig.gradient,
          'bg-gradient-to-br'
        )}
      />

      <div className="fixed inset-0 pointer-events-none z-[1]">
        {floatingParticles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-white/60"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 10, -10, 0],
              opacity: [p.opacity, p.opacity * 1.5, p.opacity],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <GazeCursor />

      <motion.div
        className="fixed pointer-events-none z-[30]"
        style={{
          left: `${playerPos.x}%`,
          top: `${playerPos.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="relative w-16 h-16 md:w-24 md:h-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/60 via-purple-400/50 to-rose-400/60 blur-2xl" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-300/40 via-purple-300/30 to-rose-300/40 blur-lg animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/90 via-cyan-100/80 to-purple-200/70 shadow-[0_0_40px_rgba(34,211,238,0.6)]" />
          <div className="absolute inset-6 rounded-full bg-white/60" />
        </div>
      </motion.div>

      <div className="relative z-10 min-h-screen w-full">
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6 px-8 py-4 rounded-full bg-black/30 border border-white/10 backdrop-blur-md"
          >
            <button
              data-gaze="true"
              data-gaze-id={`prev-scene-${currentScene}`}
              onClick={() => switchScene('prev')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-300" />
              <span className="text-xl font-medium text-white/90">{sceneConfig.name}</span>
            </div>

            <button
              data-gaze="true"
              data-gaze-id={`next-scene-${currentScene}`}
              onClick={() => switchScene('next')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>

        <div className="fixed top-6 right-6 z-40">
          <GazeButton
            variant="ghost"
            icon={<Home className="w-5 h-5" />}
            onActivate={() => navigate('/')}
          >
            返回首页
          </GazeButton>
        </div>

        <div className="absolute inset-0 pt-32 pb-48">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full"
            >
              {currentShards.map((shard) => (
                <div
                  key={shard.id}
                  ref={(el) => {
                    if (el) shardRefs.current.set(shard.id, el);
                    else shardRefs.current.delete(shard.id);
                  }}
                >
                  <ShardParticle
                    shard={shard}
                    onCollect={() => handleCollectShard(shard)}
                    isGazing={gazingShardId === shard.id}
                  />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-300" />
                <span className="text-lg font-medium text-white/90">记忆碎片</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <span className="text-2xl font-bold text-amber-300">{totalCollected}</span>
                <span className="text-lg">/ {totalShards}</span>
                <span className="ml-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-sm font-medium">
                  {progressPercent}%
                </span>
              </div>
            </div>

            <div className="relative h-3 rounded-full bg-white/10 overflow-hidden mb-4">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-cyan-400 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {SCENES.map((scene) => {
                  const sceneShardList = sceneShards[scene.id];
                  const collected = sceneShardList.filter((s) => s.collected).length;
                  return (
                    <motion.button
                      key={scene.id}
                      data-gaze="true"
                      data-gaze-id={`scene-tab-${scene.id}`}
                      onClick={() => setCurrentScene(scene.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all duration-300 min-w-[100px]',
                        currentScene === scene.id
                          ? 'bg-white/15 border border-white/20 scale-105'
                          : 'hover:bg-white/5 border border-transparent'
                      )}
                      whileHover={{ scale: currentScene === scene.id ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xs text-white/60">{scene.name}</span>
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            'text-lg font-bold',
                            currentScene === scene.id ? 'text-cyan-300' : 'text-white/70'
                          )}
                        >
                          {collected}
                        </span>
                        <span className="text-xs text-white/40">/ {TOTAL_SHARDS_PER_SCENE}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="text-right">
                <div className="text-sm text-white/50 mb-1">本场景进度</div>
                <div className="text-xl font-bold text-cyan-300">
                  {currentCollected} / {TOTAL_SHARDS_PER_SCENE}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showCollectToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
            >
              <div className="px-10 py-8 rounded-3xl bg-gradient-to-br from-cyan-500/30 via-purple-500/30 to-rose-500/30 border border-white/20 backdrop-blur-xl shadow-[0_0_80px_rgba(34,211,238,0.3)]">
                <div className="flex flex-col items-center gap-4 text-center">
                  <motion.div
                    initial={{ rotate: 0, scale: 0.5 }}
                    animate={{ rotate: 360, scale: 1 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                    className="p-5 rounded-full bg-gradient-to-br from-amber-400/30 to-rose-400/30"
                  >
                    <ShardIcon
                      type={showCollectToast.type}
                      className="w-12 h-12 text-amber-200"
                    />
                  </motion.div>
                  <div className="text-2xl font-bold text-white">记忆碎片已收集</div>
                  <div className="text-lg text-white/70 max-w-xs leading-relaxed">
                    「{showCollectToast.content}」
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-30">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="px-6 py-3 rounded-full bg-black/20 border border-white/5 backdrop-blur-sm"
          >
            <span className="text-sm text-white/50">
              移动鼠标控制光团 · 凝视碎片 1.5 秒即可收集
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
