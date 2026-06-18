import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface UseVoiceRecognitionOptions {
  continuous?: boolean;
  lang?: string;
  onResult?: (text: string, isFinal: boolean) => void;
  onCommand?: (command: string) => void;
  wakeWord?: string;
}

const COMMAND_MAP: Record<string, string> = {
  '打开漫游': 'eye-explore',
  '开启漫游': 'eye-explore',
  '进入漫游': 'eye-explore',
  '打开呼吸': 'breath-puzzle',
  '开启呼吸': 'breath-puzzle',
  '进入呼吸': 'breath-puzzle',
  '打开记忆': 'memory-palace',
  '开启记忆': 'memory-palace',
  '进入记忆': 'memory-palace',
  '打开漂流瓶': 'drift-bottle',
  '开启漂流瓶': 'drift-bottle',
  '扔一个漂流瓶': 'drift-bottle',
  '返回首页': 'home',
  '回到首页': 'home',
  '返回': 'back',
  '回去': 'back',
  '打开设置': 'settings',
  '进入设置': 'settings',
};

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const {
    continuous = true,
    lang = 'zh-CN',
    onResult,
    onCommand,
    wakeWord = '小灵小灵',
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcriptText;
          } else {
            interimText += transcriptText;
          }
        }

        const fullText = finalText || interimText;
        setTranscript(fullText);
        onResult?.(fullText, !!finalText);

        if (fullText.includes(wakeWord)) {
          setWakeWordDetected(true);
          setTimeout(() => setWakeWordDetected(false), 3000);
        }

        if (finalText) {
          for (const [cmd, action] of Object.entries(COMMAND_MAP)) {
            if (finalText.includes(cmd)) {
              onCommand?.(action);
              break;
            }
          }
        }
      };

      recognition.onerror = (_e: SpeechRecognitionErrorEvent) => {
        if (_e.error === 'no-speech' || _e.error === 'aborted') return;
        console.warn('语音识别错误:', _e.error);
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_e) { /* noop */ }
        }
      };

      recognitionRef.current = recognition;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { /* noop */ }
      }
    };
  }, [continuous, lang, onResult, onCommand, wakeWord]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e) {
      console.warn('无法启动语音识别:', e);
    }
  }, []);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) { /* noop */ }
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string, rate = 0.9) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = rate;
      utterance.pitch = 1;
      const voices = speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.startsWith('zh'));
      if (zhVoice) utterance.voice = zhVoice;
      speechSynthesis.speak(utterance);
    }
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    wakeWordDetected,
    start,
    stop,
    speak,
  };
}
