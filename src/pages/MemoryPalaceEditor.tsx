import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import {
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  Edit3,
  Eye,
  Info,
  RotateCcw,
  Check,
} from 'lucide-react';
import { AuroraBackground } from '@/components/common/AuroraBackground';
import { EditableMemoryNode } from '@/components/palace/EditableMemoryNode';
import { getMemoryPalace, updateMemoryNodesPositions } from '@/utils/mockApi';
import type { MemoryPalace as MemoryPalaceType, MemoryNode, MemoryScene } from '@/types';
import { cn } from '@/lib/utils';
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

interface EditorSceneContentProps {
  scene: MemoryScene;
  nodes: MemoryNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onPositionChange: (id: string, position: [number, number, number]) => void;
  onDragEnd: (id: string) => void;
  isEditMode: boolean;
}

function EditorSceneContent({
  scene,
  nodes,
  selectedNodeId,
  onSelectNode,
  onPositionChange,
  onDragEnd,
  isEditMode,
}: EditorSceneContentProps) {
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
        isEditMode ? (
          <EditableMemoryNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={onSelectNode}
            onPositionChange={onPositionChange}
            onDragEnd={onDragEnd}
            otherNodes={nodes}
            minDistance={1.0}
          />
        ) : (
          <NonEditableNode key={node.id} node={node} />
        )
      ))}
    </>
  );
}

function NonEditableNode({ node }: { node: MemoryNode }) {
  const meshRef = useRef<THREE.Mesh>(null);

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
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      <pointLight color={color} intensity={0.8} distance={2.5} decay={2} />
    </group>
  );
}

interface HistoryState {
  nodes: MemoryNode[];
}

export default function MemoryPalaceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [palace, setPalace] = useState<MemoryPalaceType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getMemoryPalace(id);
        if (data) {
          setPalace(data);
          const initialNodes = data.sceneData.memoryNodes.map((n) => ({ ...n, position: [...n.position] as [number, number, number] }));
          setNodes(initialNodes);
          setHistory([{ nodes: initialNodes.map((n) => ({ ...n, position: [...n.position] as [number, number, number] })) }]);
          setHistoryIndex(0);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = useCallback((newNodes: MemoryNode[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      nodes: newNodes.map((n) => ({ ...n, position: [...n.position] as [number, number, number] })),
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setHasUnsavedChanges(true);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setNodes(history[newIndex].nodes.map((n) => ({ ...n, position: [...n.position] as [number, number, number] })));
    setHasUnsavedChanges(true);
  }, [canUndo, historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setNodes(history[newIndex].nodes.map((n) => ({ ...n, position: [...n.position] as [number, number, number] })));
    setHasUnsavedChanges(true);
  }, [canRedo, historyIndex, history]);

  const handlePositionChange = useCallback((nodeId: string, position: [number, number, number]) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, position: [...position] as [number, number, number] } : n
      )
    );
  }, []);

  const handleDragEnd = useCallback((nodeId: string) => {
    pushHistory(nodes);
  }, [nodes, pushHistory]);

  const handleSave = async () => {
    if (!palace || !hasUnsavedChanges) return;
    setIsSaving(true);
    try {
      const nodeUpdates = nodes.map((n) => ({ id: n.id, position: n.position }));
      const updated = await updateMemoryNodesPositions(palace.id, nodeUpdates);
      if (updated) {
        setPalace(updated);
        setHasUnsavedChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (history.length === 0) return;
    const initialNodes = history[0].nodes.map((n) => ({
      ...n,
      position: [...n.position] as [number, number, number],
    }));
    setNodes(initialNodes);
    setHistory([{ nodes: initialNodes }]);
    setHistoryIndex(0);
    setSelectedNodeId(null);

    let hasChanges = false;
    if (palace) {
      for (let i = 0; i < initialNodes.length; i++) {
        const storedNode = palace.sceneData.memoryNodes.find(
          (n) => n.id === initialNodes[i].id
        );
        if (storedNode) {
          const [x1, y1, z1] = initialNodes[i].position;
          const [x2, y2, z2] = storedNode.position;
          if (
            Math.abs(x1 - x2) > 0.001 ||
            Math.abs(y1 - y2) > 0.001 ||
            Math.abs(z1 - z2) > 0.001
          ) {
            hasChanges = true;
            break;
          }
        }
      }
    }
    setHasUnsavedChanges(hasChanges);
  };

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const sceneTheme = useMemo<'aurora' | 'ocean' | 'forest' | 'sunset'>(() => {
    if (!palace) return 'sunset';
    const lighting = palace.sceneData.lighting;
    if (lighting === 'night') return 'aurora';
    if (lighting === 'sunrise') return 'ocean';
    if (lighting === 'noon') return 'forest';
    return 'sunset';
  }, [palace]);

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
    setSelectedNodeId(null);
  };

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
            <p className="text-white/70 text-lg">正在载入记忆宫殿编辑器…</p>
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
            <button
              onClick={() => navigate('/memory-palace')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-400/40 text-white/90 font-medium hover:from-cyan-500/40 hover:to-purple-500/40 transition-all"
            >
              返回大厅
            </button>
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

          <EditorSceneContent
            scene={palace.sceneData}
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onPositionChange={handlePositionChange}
            onDragEnd={handleDragEnd}
            isEditMode={isEditMode}
          />

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={15}
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
              {isEditMode ? '编辑模式 · 拖拽节点调整位置' : '预览模式'}
            </p>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleEditMode}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full border backdrop-blur-md transition-all duration-300',
                isEditMode
                  ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 border-purple-400/40 text-white/90'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
              )}
            >
              {isEditMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isEditMode ? '预览' : '编辑'}
              </span>
            </motion.button>
          </div>
        </header>
      </div>

      {isEditMode && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
          >
            <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl">
              <motion.button
                whileHover={{ scale: canUndo ? 1.1 : 1 }}
                whileTap={{ scale: canUndo ? 0.95 : 1 }}
                onClick={handleUndo}
                disabled={!canUndo}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  canUndo
                    ? 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 cursor-pointer'
                    : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                )}
                title="撤销"
              >
                <Undo2 className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: canRedo ? 1.1 : 1 }}
                whileTap={{ scale: canRedo ? 0.95 : 1 }}
                onClick={handleRedo}
                disabled={!canRedo}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  canRedo
                    ? 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 cursor-pointer'
                    : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                )}
                title="重做"
              >
                <Redo2 className="w-4 h-4" />
              </motion.button>

              <div className="w-px h-6 bg-white/10 mx-1" />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">重置</span>
              </motion.button>

              <div className="w-px h-6 bg-white/10 mx-1" />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full border transition-all',
                  hasUnsavedChanges && !isSaving
                    ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border-emerald-400/40 text-emerald-100 hover:from-emerald-500/40 hover:to-cyan-500/40'
                    : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                )}
              >
                {saveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {saveSuccess ? '已保存' : isSaving ? '保存中' : '保存'}
                </span>
              </motion.button>
            </div>

            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs"
              >
                有未保存的更改
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {isEditMode && selectedNode && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-24 right-6 z-20 pointer-events-auto w-64"
          >
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/30 to-cyan-400/30 border border-purple-400/30 flex items-center justify-center">
                  <Info className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-white/90 font-bold">{selectedNode.label}</h3>
                  <p className="text-white/40 text-xs">记忆节点</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">X 坐标</span>
                  <span className="text-white/80 text-sm font-mono">
                    {selectedNode.position[0].toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Y 坐标</span>
                  <span className="text-white/80 text-sm font-mono">
                    {selectedNode.position[1].toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Z 坐标</span>
                  <span className="text-white/80 text-sm font-mono">
                    {selectedNode.position[2].toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/40 text-xs leading-relaxed">
                  拖拽彩色手柄调整节点位置。红色为 X 轴，绿色为 Y 轴，蓝色为 Z 轴。
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {isEditMode && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-center"
          >
            <p className="text-white/70 text-sm">
              点击节点选中 · 拖拽彩色手柄调整位置 · 鼠标滚轮缩放视角
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
