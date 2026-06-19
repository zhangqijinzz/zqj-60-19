import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, Castle, Clock, Sparkles, Wand2, Copy, Check, Edit3 } from 'lucide-react';
import { AuroraBackground } from '@/components/common/AuroraBackground';
import { VoiceRecorder } from '@/components/common/VoiceRecorder';
import {
  generateMemorySceneFromDescription,
  createMemoryPalace,
  listMemoryPalaces,
  sharePalace,
  saveAudioBlob,
} from '@/utils/mockApi';
import type { MemoryPalace } from '@/types';
import { cn } from '@/lib/utils';

const GENERATION_STEPS = [
  { text: '正在解析语音描述…', icon: <Wand2 className="w-5 h-5" /> },
  { text: '正在构建记忆场景…', icon: <Sparkles className="w-5 h-5" /> },
  { text: '正在创建记忆宫殿…', icon: <Castle className="w-5 h-5" /> },
];

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

interface PalaceCardProps {
  palace: MemoryPalace;
  index: number;
  onEnter: (id: string) => void;
  onShare: (id: string) => Promise<boolean>;
  onEdit: (id: string) => void;
}

function PalaceCard({ palace, index, onEnter, onShare, onEdit }: PalaceCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await onShare(palace.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.08, type: 'spring', stiffness: 80 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        'relative cursor-pointer group rounded-3xl p-6 overflow-hidden',
        'bg-gradient-to-br from-amber-500/10 to-rose-500/10',
        'border border-amber-400/20 backdrop-blur-sm',
        'transition-all duration-300 hover:border-amber-400/40',
        'hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]'
      )}
      onClick={() => onEnter(palace.id)}
    >
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10 pointer-events-none">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 blur-3xl transform translate-x-1/3 -translate-y-1/3" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/30 border border-amber-400/30 flex items-center justify-center">
            <Castle className="w-6 h-6 text-amber-200" />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(palace.id);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20"
              title="编辑"
            >
              <Edit3 className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                copied
                  ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-200'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20'
              )}
              title="分享"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white/90 mb-2 group-hover:text-white transition-colors">
          {palace.name}
        </h3>

        <p className="text-sm text-white/50 mb-4 line-clamp-2 leading-relaxed">
          {truncate(palace.description, 60)}
        </p>

        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(palace.createdAt)}</span>
          </div>
          {palace.isShared && (
            <div className="flex items-center gap-1.5 text-cyan-300/70 text-xs">
              <Share2 className="w-3.5 h-3.5" />
              <span>已分享</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GenerationProgress({ step }: { step: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-400/20 backdrop-blur-sm">
        <div className="text-center mb-8">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-400/30 to-cyan-400/30 border border-purple-400/40 mb-4"
          >
            <Sparkles className="w-10 h-10 text-purple-200" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white/90 mb-2">AI 正在生成中</h3>
          <p className="text-white/50 text-sm">请稍候，正在为你构建记忆宫殿</p>
        </div>

        <div className="space-y-4">
          {GENERATION_STEPS.map((s, i) => (
            <motion.div
              key={i}
              className={cn(
                'flex items-center gap-4 p-4 rounded-2xl transition-all duration-500',
                i < step
                  ? 'bg-emerald-500/15 border border-emerald-400/30'
                  : i === step
                  ? 'bg-purple-500/15 border border-purple-400/40'
                  : 'bg-white/5 border border-white/10'
              )}
            >
              <motion.div
                animate={i === step ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1, repeat: i === step ? Infinity : 0 }}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  i < step
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : i === step
                    ? 'bg-purple-500/30 text-purple-200'
                    : 'bg-white/10 text-white/40'
                )}
              >
                {i < step ? <Check className="w-5 h-5" /> : s.icon}
              </motion.div>
              <div className="flex-1">
                <p
                  className={cn(
                    'font-medium text-base',
                    i < step
                      ? 'text-emerald-200'
                      : i === step
                      ? 'text-white/90'
                      : 'text-white/40'
                  )}
                >
                  {s.text}
                </p>
              </div>
              {i === step && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <motion.div
                      key={j}
                      className="w-2 h-2 rounded-full bg-purple-400"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: j * 0.15,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-8 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400"
            initial={{ width: '0%' }}
            animate={{
              width: step === 0 ? '33%' : step === 1 ? '66%' : '100%',
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function MemoryPalacePage() {
  const navigate = useNavigate();
  const [palaces, setPalaces] = useState<MemoryPalace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [shareToast, setShareToast] = useState<string | null>(null);

  useEffect(() => {
    loadPalaces();
  }, []);

  const loadPalaces = async () => {
    setIsLoading(true);
    try {
      const data = await listMemoryPalaces();
      setPalaces(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = async (
    blob: Blob,
    duration: number,
    transcript?: string
  ) => {
    const description =
      transcript && transcript.trim().length > 0
        ? transcript
        : '一段珍贵的语音记忆';

    const palaceId = `palace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const voiceBlobUrl = await saveAudioBlob(palaceId, blob);

    setIsGenerating(true);
    setGenerationStep(0);

    try {
      const sceneData = await generateMemorySceneFromDescription(description);
      setGenerationStep(1);

      const name = extractName(description);
      await createMemoryPalace({
        id: palaceId,
        name,
        description,
        voiceBlobUrl,
        sceneData,
        isShared: false,
      } as Omit<MemoryPalace, 'id' | 'createdAt'> & { id: string });
      setGenerationStep(2);

      await loadPalaces();
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationStep(0);
      }, 800);
    }
  };

  const extractName = (text: string): string => {
    const sentences = text.split(/[。！？.!?]/).filter((s) => s.trim());
    if (sentences.length > 0) {
      const first = sentences[0].trim();
      if (first.length <= 12) return first;
      return first.slice(0, 10) + '…';
    }
    return '我的记忆宫殿';
  };

  const handleEnterPalace = (id: string) => {
    navigate(`/memory-palace/${id}`);
  };

  const handleEditPalace = (id: string) => {
    navigate(`/memory-palace/${id}/edit`);
  };

  const handleShare = async (id: string): Promise<boolean> => {
    const code = await sharePalace(id);
    if (code) {
      const shareUrl = `${window.location.origin}/share/${code}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareToast(`分享链接已复制：${shareUrl}`);
        await loadPalaces();
        setTimeout(() => setShareToast(null), 3000);
        return true;
      } catch {
        setShareToast(`分享码已生成：${code}，请手动复制`);
        await loadPalaces();
        setTimeout(() => setShareToast(null), 3000);
        return false;
      }
    }
    return false;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AuroraBackground theme="sunset" intensity={1} />

      <div className="relative z-10 min-h-screen">
        <header className="sticky top-0 z-20 px-6 py-5 flex items-center justify-between bg-[#0a0e27]/40 backdrop-blur-md border-b border-white/5">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
          >
            <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white/90 transition-colors" />
            <span className="text-white/80 group-hover:text-white/95 text-base font-medium transition-colors">
              返回首页
            </span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/30 to-rose-500/30 border border-amber-400/30 flex items-center justify-center">
              <Castle className="w-5 h-5 text-amber-200" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-200 via-rose-200 to-purple-200 bg-clip-text text-transparent">
              记忆宫殿大厅
            </h1>
          </motion.div>

          <div className="w-[120px]" />
        </header>

        <main className="px-6 py-12 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16"
              >
                <GenerationProgress step={generationStep} />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-16"
                >
                  <div className="text-center mb-8">
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl md:text-4xl font-bold text-white/90 mb-3"
                    >
                      用声音铸造你的记忆宫殿
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-white/50 text-lg"
                    >
                      凝视下方麦克风，描述你想重现的场景，AI 将为你生成专属的 3D 记忆空间
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <VoiceRecorder
                      variant="full"
                      maxDuration={120}
                      onRecordingComplete={handleRecordingComplete}
                    />
                  </motion.div>
                </motion.section>

                <section>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-1">
                        我的宫殿
                      </h2>
                      <p className="text-white/50 text-sm">
                        共 {palaces.length} 座记忆宫殿 · 凝视卡片即可进入漫游
                      </p>
                    </div>
                    {!isLoading && palaces.length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadPalaces}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <span className="text-white/70 text-sm">刷新</span>
                      </motion.button>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="h-56 rounded-3xl bg-white/5 border border-white/10 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : palaces.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="py-20 flex flex-col items-center text-center"
                    >
                      <motion.div
                        animate={{
                          y: [0, -8, 0],
                          rotate: [0, 2, -2, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-400/20 flex items-center justify-center mb-8"
                      >
                        <Castle className="w-14 h-14 text-amber-300/70" />
                      </motion.div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white/90 mb-3">
                        还没有记忆宫殿
                      </h3>
                      <p className="text-white/50 text-lg max-w-md mb-8 leading-relaxed">
                        每一段回忆都值得被珍藏。<br />
                        凝视上方的麦克风，用声音开启你的第一座记忆宫殿吧~
                      </p>
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-white/40 text-sm flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>提示：试着描述「童年的老房子」或「和朋友去过的海边」</span>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      layout
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {palaces.map((palace, i) => (
                        <PalaceCard
                          key={palace.id}
                          palace={palace}
                          index={i}
                          onEnter={handleEnterPalace}
                          onShare={handleShare}
                          onEdit={handleEditPalace}
                        />
                      ))}
                    </motion.div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%' }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 backdrop-blur-md shadow-lg flex items-center gap-3"
          >
            <Copy className="w-5 h-5 text-cyan-200" />
            <span className="text-white/90 font-medium">{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
