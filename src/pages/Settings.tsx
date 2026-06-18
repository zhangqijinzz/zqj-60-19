import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Mic,
  MessageCircle,
  Palette,
  RotateCcw,
  Check,
  Sliders,
} from 'lucide-react';
import { AuroraBackground } from '@/components/common/AuroraBackground';
import { GazeButton } from '@/components/common/GazeButton';
import {
  useUserSettingsStore,
  type BreathSensitivity,
  type BreathPattern,
  type ThemeMode,
} from '@/stores/userSettingsStore';
import { useBreathDetector } from '@/hooks/useBreathDetector';
import { cn } from '@/lib/utils';

interface SettingSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}

function SettingSection({
  icon,
  title,
  subtitle,
  children,
  delay = 0,
}: SettingSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/20 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white/90 mb-1">{title}</h3>
          <p className="text-white/50 text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="pl-16">{children}</div>
    </motion.div>
  );
}

interface OptionButtonProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  description?: string;
}

function OptionButton({ label, selected, onSelect, description }: OptionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: selected ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'flex-1 min-w-[120px] px-5 py-4 rounded-2xl border transition-all duration-300 text-left',
        selected
          ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'font-semibold text-base',
            selected ? 'text-cyan-200' : 'text-white/80'
          )}
        >
          {label}
        </span>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-cyan-400/30 flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-cyan-200" />
          </motion.div>
        )}
      </div>
      {description && (
        <p className="text-xs text-white/40 mt-1">{description}</p>
      )}
    </motion.button>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/70 text-base">{label}</span>
        <span className="text-cyan-300 font-mono text-base font-medium">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-white/30">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

const BREATH_PATTERNS: { value: BreathPattern; label: string; desc: string }[] = [
  { value: '4-7-8', label: '4-7-8 呼吸法', desc: '最经典的放松呼吸法' },
  { value: '4-4-4-4', label: '箱式呼吸', desc: '平衡稳定，适合冥想' },
  { value: '5-2-5-2', label: '自然节奏', desc: '舒缓平和，日常推荐' },
  { value: 'custom', label: '自定义', desc: '按个人喜好调整' },
];

const BREATH_SENSITIVITIES: { value: BreathSensitivity; label: string; desc: string }[] = [
  { value: 'low', label: '低灵敏度', desc: '呼吸较深的用户推荐' },
  { value: 'medium', label: '中灵敏度', desc: '大多数用户适用' },
  { value: 'high', label: '高灵敏度', desc: '呼吸较弱的用户推荐' },
];

const THEMES: { value: ThemeMode; label: string; colors: string[] }[] = [
  { value: 'aurora', label: '极光紫', colors: ['#7c3aed', '#22d3ee'] },
  { value: 'ocean', label: '深海蓝', colors: ['#0ea5e9', '#06b6d4'] },
  { value: 'forest', label: '森林绿', colors: ['#22c55e', '#84cc16'] },
  { value: 'sunset', label: '日落橙', colors: ['#f97316', '#ec4899'] },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [isTesting, setIsTesting] = useState(false);

  const {
    gazeActivationTime,
    blinkMode,
    breathSensitivity,
    breathPattern,
    voiceWakeWord,
    theme,
    setGazeActivationTime,
    setBlinkMode,
    setBreathSensitivity,
    setBreathPattern,
    setVoiceWakeWord,
    setTheme,
    resetSettings,
  } = useUserSettingsStore();

  const {
    breathState,
    breathIntensity,
    phaseProgress,
    start: startBreath,
    stop: stopBreath,
    isActive: breathIsActive,
    isCalibrated,
  } = useBreathDetector({ simulate: true });

  useEffect(() => {
    return () => stopBreath();
  }, [stopBreath]);

  const toggleTestBreath = () => {
    if (breathIsActive) {
      stopBreath();
      setIsTesting(false);
    } else {
      startBreath();
      setIsTesting(true);
    }
  };

  const breathStateLabel: Record<string, string> = {
    idle: '准备中',
    inhale: '吸气中',
    hold: '屏息中',
    exhale: '呼气中',
    rest: '放松中',
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AuroraBackground theme={theme} intensity={1} />

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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-purple-500/30 border border-cyan-400/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-cyan-200" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-200 via-purple-200 to-rose-200 bg-clip-text text-transparent">
              无障碍设置
            </h1>
          </motion.div>

          <div className="w-[120px]" />
        </header>

        <main className="px-6 py-12 max-w-4xl mx-auto space-y-6">
          <SettingSection
            icon={<Eye className="w-6 h-6 text-cyan-300" />}
            title="眼动追踪设置"
            subtitle="调整凝视交互的灵敏度和行为"
            delay={0.05}
          >
            <div className="space-y-6">
              <Slider
                label="凝视激活时间"
                value={gazeActivationTime}
                min={800}
                max={3000}
                step={100}
                unit="ms"
                onChange={setGazeActivationTime}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/70 text-base">眨眼确认模式</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBlinkMode(!blinkMode)}
                    className={cn(
                      'relative w-16 h-9 rounded-full transition-colors duration-300',
                      blinkMode
                        ? 'bg-gradient-to-r from-cyan-400 to-purple-400'
                        : 'bg-white/10'
                    )}
                  >
                    <motion.div
                      animate={{ x: blinkMode ? 28 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center"
                    >
                      {blinkMode && <Check className="w-4 h-4 text-cyan-500" />}
                    </motion.div>
                  </motion.button>
                </div>
                <p className="text-xs text-white/40">
                  开启后，单眨眼=选择，双眨眼=返回（需配合眼动硬件）
                </p>
              </div>
            </div>
          </SettingSection>

          <SettingSection
            icon={<Mic className="w-6 h-6 text-sky-300" />}
            title="呼吸检测设置"
            subtitle="校准麦克风灵敏度和呼吸节奏模式"
            delay={0.1}
          >
            <div className="space-y-6">
              <div>
                <p className="text-white/70 text-base mb-3">灵敏度选择</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BREATH_SENSITIVITIES.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      label={opt.label}
                      value={opt.value}
                      selected={breathSensitivity === opt.value}
                      onSelect={() => setBreathSensitivity(opt.value)}
                      description={opt.desc}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white/70 text-base mb-3">呼吸节奏模式</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {BREATH_PATTERNS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      label={opt.label}
                      value={opt.value}
                      selected={breathPattern === opt.value}
                      onSelect={() => setBreathPattern(opt.value)}
                      description={opt.desc}
                    />
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-400/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/80 font-medium mb-1">测试呼吸检测</p>
                    <p className="text-white/40 text-xs">
                      {isTesting
                        ? isCalibrated
                          ? '正在检测呼吸，请跟随光球节奏'
                          : '正在校准中…'
                        : '开启后模拟并观察反馈效果'}
                    </p>
                  </div>
                  <GazeButton
                    variant="primary"
                    className="!min-w-[100px] !min-h-[48px] !px-5 !py-2"
                    onActivate={toggleTestBreath}
                  >
                    {isTesting ? '停止' : '测试'}
                  </GazeButton>
                </div>

                {isTesting && (
                  <div className="flex items-center gap-6">
                    <motion.div
                      animate={{
                        scale:
                          breathState === 'inhale'
                            ? 1 + phaseProgress * 0.3
                            : breathState === 'exhale'
                            ? 1.3 - phaseProgress * 0.3
                            : breathState === 'hold'
                            ? 1.3
                            : 1,
                      }}
                      transition={{ duration: 0.1, ease: 'linear' }}
                      className={cn(
                        'w-16 h-16 rounded-full',
                        breathState === 'inhale' || breathState === 'hold'
                          ? 'bg-gradient-to-br from-sky-400/50 to-blue-500/50 shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                          : breathState === 'exhale'
                          ? 'bg-gradient-to-br from-rose-400/50 to-pink-500/50 shadow-[0_0_30px_rgba(251,113,133,0.4)]'
                          : 'bg-white/20'
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            breathState === 'inhale' && 'bg-sky-500/20 text-sky-200',
                            breathState === 'hold' && 'bg-purple-500/20 text-purple-200',
                            breathState === 'exhale' && 'bg-rose-500/20 text-rose-200',
                            (breathState === 'rest' || breathState === 'idle') &&
                              'bg-white/10 text-white/50'
                          )}
                        >
                          {breathStateLabel[breathState] || '准备中'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-rose-400 transition-all duration-100"
                          style={{ width: `${breathIntensity * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SettingSection>

          <SettingSection
            icon={<MessageCircle className="w-6 h-6 text-amber-300" />}
            title="语音交互设置"
            subtitle="设置唤醒词和语音识别参数"
            delay={0.15}
          >
            <div>
              <p className="text-white/70 text-base mb-3">语音唤醒词</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['小灵小灵', '灵境灵境', '小星小星', '小游小游'].map((word) => (
                  <OptionButton
                    key={word}
                    label={word}
                    value={word}
                    selected={voiceWakeWord === word}
                    onSelect={() => setVoiceWakeWord(word)}
                  />
                ))}
              </div>
              <p className="text-xs text-white/40 mt-3">
                唤醒词用于启动全局语音命令，如「{voiceWakeWord}，打开漫游」
              </p>
            </div>
          </SettingSection>

          <SettingSection
            icon={<Palette className="w-6 h-6 text-rose-300" />}
            title="视觉主题"
            subtitle="选择你喜欢的极光配色"
            delay={0.2}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {THEMES.map((t) => (
                <motion.button
                  key={t.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'relative p-5 rounded-2xl border transition-all duration-300',
                    theme === t.value
                      ? 'border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                      : 'border-white/10 hover:border-white/20'
                  )}
                >
                  <div
                    className="w-full h-16 rounded-xl mb-3 overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'font-medium',
                        theme === t.value ? 'text-white/90' : 'text-white/60'
                      )}
                    >
                      {t.label}
                    </span>
                    {theme === t.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </SettingSection>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center pt-6 pb-12"
          >
            <GazeButton
              variant="ghost"
              icon={<RotateCcw className="w-5 h-5" />}
              onActivate={resetSettings}
            >
              恢复默认设置
            </GazeButton>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
