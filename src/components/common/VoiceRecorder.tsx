import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GazeButton } from './GazeButton';

interface SpeechRecognitionResultItem {
  0: { transcript: string };
}

interface SpeechRecognitionResults {
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResults;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

interface VoiceRecorderProps {
  onRecordingComplete?: (blob: Blob, duration: number, transcript?: string) => void;
  maxDuration?: number;
  className?: string;
  variant?: 'compact' | 'full';
}

export function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 300,
  className,
  variant = 'full',
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = 0;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) { /* noop */ }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setDuration(0);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      transcriptRef.current = '';
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const finalDuration = (Date.now() - startTimeRef.current) / 1000;
        onRecordingComplete?.(blob, finalDuration, transcriptRef.current);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);

      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'zh-CN';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (e: SpeechRecognitionEvent) => {
            let text = '';
            for (let i = 0; i < e.results.length; i++) {
              text += e.results[i][0].transcript;
            }
            setTranscript(text);
            transcriptRef.current = text;
          };
          recognition.onerror = () => { /* noop */ };
          recognition.start();
          recognitionRef.current = recognition;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { /* noop */ }
      }

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 250);
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置');
      console.error(err);
    }
  }, [maxDuration, onRecordingComplete, stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { /* noop */ }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { /* noop */ }
      }
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (variant === 'compact') {
    return (
      <div className={className}>
        {!isRecording ? (
          <GazeButton variant="primary" icon={<Mic className="w-6 h-6" />} onActivate={startRecording}>
            按住说话
          </GazeButton>
        ) : (
          <GazeButton variant="glow" icon={<Square className="w-6 h-6" />} onActivate={stopRecording}>
            停止录音 ({formatTime(duration)})
          </GazeButton>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full max-w-md', className)}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-300 text-sm"
        >
          {error}
        </motion.div>
      )}

      {isRecording ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-400/20"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-4 h-4 rounded-full bg-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.6)]"
            />
            <span className="text-3xl font-mono text-white/90">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6 h-12">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: ['30%', `${40 + Math.random() * 60}%`, '30%'] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
                className="w-2 rounded-full bg-gradient-to-t from-rose-400 to-amber-300"
                style={{ height: '40%' }}
              />
            ))}
          </div>

          {transcript && (
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-base min-h-[60px]">
              {transcript}
            </div>
          )}

          <div className="flex justify-center">
            <GazeButton variant="glow" icon={<MicOff className="w-5 h-5" />} onActivate={stopRecording}>
              完成录音
            </GazeButton>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/20"
        >
          <div className="flex flex-col items-center gap-6">
            <GazeButton
              variant="primary"
              className="w-32 h-32 !p-0"
              icon={<Mic className="w-12 h-12" />}
              onActivate={startRecording}
            >
              <span className="sr-only">开始录音</span>
            </GazeButton>
            <div className="text-center">
              <p className="text-white/90 text-xl font-medium mb-2">凝视开始录音</p>
              <p className="text-white/50 text-sm">最长录制 {Math.floor(maxDuration / 60)} 分钟</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
