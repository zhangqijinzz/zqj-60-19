import { Eye, Mic, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatusIndicatorsProps {
  isGazeReady?: boolean;
  isMicReady?: boolean;
  isVoiceReady?: boolean;
  className?: string;
}

export function StatusIndicators({
  isGazeReady = true,
  isMicReady = true,
  isVoiceReady = false,
  className,
}: StatusIndicatorsProps) {
  return (
    <div className={cn('fixed top-6 right-6 z-50 flex items-center gap-4', className)}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm',
          'border transition-colors duration-300',
          isGazeReady
            ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
            : 'bg-gray-500/10 border-gray-400/20 text-gray-400'
        )}
      >
        <Eye className="w-4 h-4" />
        <span className="text-sm font-medium">眼动就绪</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm',
          'border transition-colors duration-300',
          isMicReady
            ? 'bg-sky-500/10 border-sky-400/30 text-sky-300'
            : 'bg-gray-500/10 border-gray-400/20 text-gray-400'
        )}
      >
        <Mic className="w-4 h-4" />
        <span className="text-sm font-medium">麦克风就绪</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm',
          'border transition-colors duration-300',
          isVoiceReady
            ? 'bg-amber-500/10 border-amber-400/30 text-amber-300'
            : 'bg-gray-500/10 border-gray-400/20 text-gray-400'
        )}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">语音就绪</span>
      </motion.div>
    </div>
  );
}
