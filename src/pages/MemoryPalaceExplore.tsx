import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ArrowLeft, Info, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { AuroraBackground } from '@/components/common/AuroraBackground';
import { GazeButton } from '@/components/common/GazeButton';
import { getMemoryPalace } from '@/utils/mockApi';
import type { MemoryPalace as MemoryPalaceType, MemoryNode, MemoryScene } from '@/types';
import * as THREE from 'three';

const LIGHTING_CONFIG: Record<
  MemoryScene['lighting'],
  { ambient: number; directional: [number, number, number]; color: string; intensity: number }
> = {
  sunrise: {
    ambient: 0.6,
    directional: [5, 8, 3],
    color: '#fcd9b6',
    intensity: 1.2,
  },
  sunset: {
    ambient: 0.5,
    directional: [-5, 6, -2],
    color: '#ff9966',
    intensity: 1.0,
  },
  noon: {
    ambient: 0.8,
    directional: [0, 10, 5],
    color: '#ffffff',
    intensity: 1.5,
  },
  night: {
    ambient: 0.25,
    directional: [3, 8, -5],
    color: '#93c5fd',
    intensity: 0.4,
  },
};

interface MemoryNodeObjectProps {
  node: MemoryNode;
  onActivate: (node: MemoryNode) => void;
}

function MemoryNodeObject({ node, onActivate }: MemoryNodeObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
    if (hovered) {
      if (startTimeRef.current === null) startTimeRef.current = performance.now();
      const elapsed = performance.now() - startTimeRef.current;
      const newProgress = Math.min(elapsed / 1500, 1);
      setProgress(newProgress);
      if (newProgress >= 1) {
        onActivate(node);
        startTimeRef.current = null;
        setHovered(false);
      }
    } else {
      if (startTimeRef.current !== null) {
        startTimeRef.current = null;
        setProgress(0);
      }
    }
  });

  const hueColors = [
    '#fcd34d',
    '#f472b6',
    '#a78bfa',
    '#22d3ee',
    '#4ade80',
    '#fb923c',
  ];
  const color = hueColors[Math.abs(node.label.charCodeAt(0)) % hueColors.length];

  return (
    <group position={node.position}>
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 1.2 + progress * 0.8 : 0.6}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>

        {progress > 0 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <ringGeometry args={[0.5, 0.55, 64, 1, 0, progress * Math.PI * 2]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        )}

        <pointLight
          color={color}
          intensity={hovered ? 2 + progress : 0.8}
          distance={2.5}
          decay={2}
        />
      </Float>
    </group>
  );
}

interface SceneContentProps {
  scene: MemoryScene;
  nodes: MemoryNode[];
  onNodeActivate: (n: MemoryNode) => void;
}

function SceneContent({ scene, nodes, onNodeActivate }: SceneContentProps) {
  const lightCfg = LIGHTING_CONFIG[scene.lighting];

  const groundColor = useMemo(() => {
    if (scene.type === 'indoor') return '#3d2f1f';
    if (scene.type === 'outdoor') return scene.lighting === 'night' ? '#14221b' : '#3a5f2a';
    return '#2a3f4d';
  }, [scene.type, scene.lighting]);

  return (
    <>
      <ambientLight intensity={lightCfg.ambient} color={lightCfg.color} />
      <directionalLight
        position={lightCfg.directional}
        intensity={lightCfg.intensity}
        color={lightCfg.color}
        castShadow
      />

      {scene.lighting === 'night' && (
        <Stars radius={80} depth={40} count={3000} factor={3} saturation={0.5} fade speed={0.5} />
      )}

      <Sparkles count={60} scale={10} size={3} speed={0.3} opacity={0.5} color="#a78bfa" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, -3]}>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial
          color={groundColor}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {scene.type !== 'indoor' && (
        <>
          <mesh position={[-6, 1, -8]}>
            <coneGeometry args={[0.8, 2.5, 8]} />
            <meshStandardMaterial color="#2d5a3a" />
          </mesh>
          <mesh position={[-6, 0, -8]}>
            <cylinderGeometry args={[0.2, 0.25, 0.8, 8]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
          <mesh position={[6, 1.3, -7]}>
            <coneGeometry args={[0.6, 2, 8]} />
            <meshStandardMaterial color="#355c2c" />
          </mesh>
          <mesh position={[6, 0, -7]}>
            <cylinderGeometry args={[0.15, 0.2, 0.7, 8]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
        </>
      )}

      {scene.type === 'indoor' && (
        <>
          <mesh position={[0, 2, -7]}>
            <boxGeometry args={[10, 4, 0.1]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
          <mesh position={[2.5, 1.8, -6.5]}>
            <boxGeometry args={[1.5, 1.2, 0.05]} />
            <meshStandardMaterial
              color={scene.lighting === 'night' ? '#1e293b' : '#87ceeb'}
              emissive={scene.lighting === 'night' ? '#fef3c7' : '#fef3c7'}
              emissiveIntensity={0.3}
            />
          </mesh>
        </>
      )}

      {nodes.map((node) => (
        <MemoryNodeObject key={node.id} node={node} onActivate={onNodeActivate} />
      ))}
    </>
  );
}

interface CameraControllerProps {
  targetRef: React.MutableRefObject<[number, number, number]>;
}

function CameraController({ targetRef }: CameraControllerProps) {
  const { camera } = useThree();
  useFrame(() => {
    const [tx, ty, tz] = targetRef.current;
    camera.position.x += (tx - camera.position.x) * 0.03;
    camera.position.y += (ty + 1.6 - camera.position.y) * 0.03;
    camera.position.z += (tz + 5 - camera.position.z) * 0.03;
    camera.lookAt(tx, ty, tz);
  });
  return null;
}

interface NodeModalProps {
  node: MemoryNode | null;
  onClose: () => void;
}

function NodeModal({ node, onClose }: NodeModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!node?.voiceBlobUrl) {
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    const audio = new Audio(node.voiceBlobUrl);
    audio.preload = 'auto';

    audio.oncanplaythrough = () => {
      setIsLoading(false);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      setIsLoading(false);
      console.warn('音频加载失败');
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      setIsPlaying(false);
      setIsLoading(false);
    };
  }, [node?.voiceBlobUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !node?.voiceBlobUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        console.warn('音频播放失败');
      });
      setIsPlaying(true);
    }
  };

  const hasAudio = !!node?.voiceBlobUrl;

  if (!node) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg mx-6 p-8 rounded-3xl bg-gradient-to-br from-[#0a0e27]/95 to-[#1a1a3e]/95 border border-white/15 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-purple-500/30 border border-cyan-400/30 flex items-center justify-center">
              <Info className="w-6 h-6 text-cyan-200" />
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/90 hover:bg-white/10 transition-all"
            >
              ×
            </motion.button>
          </div>

          <h3 className="text-3xl font-bold text-white/95 mb-4 bg-gradient-to-r from-cyan-200 to-purple-200 bg-clip-text text-transparent">
            {node.label}
          </h3>

          <p className="text-white/60 text-lg leading-relaxed mb-6">
            这是关于「{node.label}」的回忆。
            <br />
            <br />
            时光如水，每一个平凡的瞬间都在记忆里闪闪发光。或许是某个阳光明媚的午后，或许是一段温暖的对话，又或许是某种熟悉的味道…
            <br />
            <br />
            凝视，让我们重新回到那一刻。
          </p>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <motion.button
                whileHover={hasAudio && !isLoading ? { scale: 1.05 } : {}}
                whileTap={hasAudio && !isLoading ? { scale: 0.95 } : {}}
                onClick={togglePlay}
                disabled={!hasAudio || isLoading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  hasAudio && !isLoading
                    ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/40 text-cyan-100 hover:from-cyan-500/40 hover:to-purple-500/40 cursor-pointer'
                    : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-cyan-300 rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </motion.button>
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium mb-2">
                  语音回忆
                  {!hasAudio && <span className="text-white/40 ml-2">（暂无录音）</span>}
                </p>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                    initial={{ width: '0%' }}
                    animate={isPlaying ? { width: '100%' } : { width: '0%' }}
                    transition={isPlaying ? { duration: 12, ease: 'linear' } : { duration: 0.3 }}
                  />
                </div>
              </div>
              {hasAudio ? (
                <Volume2 className="w-5 h-5 text-cyan-300" />
              ) : (
                <VolumeX className="w-5 h-5 text-white/30" />
              )}
            </div>
            <div className="flex items-center gap-1 justify-center">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-cyan-400 to-purple-400"
                  animate={
                    isPlaying
                      ? {
                          height: ['20%', `${20 + Math.random() * 80}%`, '20%'],
                        }
                      : { height: '20%' }
                  }
                  transition={{
                    duration: 0.6,
                    repeat: isPlaying ? Infinity : 0,
                    delay: i * 0.04,
                    ease: 'easeInOut',
                  }}
                  style={{ height: '20%' }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <GazeButton variant="primary" onActivate={onClose}>
              继续漫游
            </GazeButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MemoryPalaceExplorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [palace, setPalace] = useState<MemoryPalaceType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<MemoryNode | null>(null);
  const cameraTargetRef = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getMemoryPalace(id);
        if (data) setPalace(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleNodeActivate = (node: MemoryNode) => {
    cameraTargetRef.current = node.position;
    setActiveNode(node);
  };

  const handleCloseNode = () => {
    cameraTargetRef.current = [0, 0, 0];
    setActiveNode(null);
  };

  const sceneTheme = useMemo<
    'aurora' | 'ocean' | 'forest' | 'sunset'
  >(() => {
    if (!palace) return 'sunset';
    const lighting = palace.sceneData.lighting;
    if (lighting === 'night') return 'aurora';
    if (lighting === 'sunrise') return 'ocean';
    if (lighting === 'noon') return 'forest';
    return 'sunset';
  }, [palace]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <AuroraBackground theme="sunset" intensity={1} />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-6 rounded-3xl border-2 border-cyan-400/30 border-t-cyan-400"
            />
            <p className="text-white/70 text-lg">正在载入记忆宫殿…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!palace) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <AuroraBackground theme="sunset" intensity={1} />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <h2 className="text-3xl font-bold text-white/90 mb-4">记忆宫殿不存在</h2>
            <p className="text-white/50 mb-8">这段记忆可能已经遗失，或者从未被创建。</p>
            <GazeButton variant="primary" onActivate={() => navigate('/memory-palace')}>
              返回大厅
            </GazeButton>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AuroraBackground theme={sceneTheme} intensity={0.6} />

      <div className="absolute inset-0 z-10">
        <Canvas
          camera={{ position: [0, 1.6, 5], fov: 60 }}
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <color attach="background" args={[palace.sceneData.lighting === 'night' ? '#0a0e27' : '#1e293b']} />
          <fog attach="fog" args={[palace.sceneData.lighting === 'night' ? '#0a0e27' : '#1e293b', 8, 30]} />

          <SceneContent
            scene={palace.sceneData}
            nodes={palace.sceneData.memoryNodes}
            onNodeActivate={handleNodeActivate}
          />
          <CameraController targetRef={cameraTargetRef} />

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
          />

          <EffectComposer>
            <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
            <Vignette eskil={false} offset={0.1} darkness={0.6} />
          </EffectComposer>
        </Canvas>
      </div>

      <div className="relative z-20 pointer-events-none">
        <header className="sticky top-0 px-6 py-5 flex items-center justify-between bg-gradient-to-b from-[#0a0e27]/60 to-transparent">
          <div className="pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/memory-palace')}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white/90 transition-colors" />
              <span className="text-white/80 group-hover:text-white/95 text-base font-medium transition-colors">
                返回大厅
              </span>
            </motion.button>
          </div>

          <div className="text-center pointer-events-none">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-200 via-rose-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
              {palace.name}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {palace.sceneData.type === 'indoor'
                ? '室内场景'
                : palace.sceneData.type === 'outdoor'
                ? '户外场景'
                : '混合场景'}
              {' · '}
              {palace.sceneData.lighting === 'sunrise'
                ? '清晨'
                : palace.sceneData.lighting === 'noon'
                ? '正午'
                : palace.sceneData.lighting === 'sunset'
                ? '黄昏'
                : '夜晚'}
            </p>
          </div>

          <div className="w-[120px]" />
        </header>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-center"
        >
          <p className="text-white/70 text-sm">
            鼠标拖拽旋转视角 · 凝视发光晶体 1.5 秒唤醒记忆
          </p>
        </motion.div>
      </div>

      <NodeModal node={activeNode} onClose={handleCloseNode} />
    </div>
  );
}
