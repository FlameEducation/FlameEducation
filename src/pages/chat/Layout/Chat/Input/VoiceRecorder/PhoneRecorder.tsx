import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Loader2, Clock, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { MicVAD } from '@ricky0123/vad-web';
import { usePhoneSilenceDuration } from '@/contexts';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';

import { floatTo16BitPCM } from '@/lib/audio-utils';

interface PhoneRecorderProps {
  onSendAudio: (file: File) => Promise<void>;
  onAudioData?: (data: ArrayBuffer) => void; // 新增：流式数据回调
  isLoading?: boolean;
  isPaused?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void; // 新增：停止录音回调
  isLoadingUI?: boolean;
  realtimeText?: string; // 新增：实时文本显示
}

export const PhoneRecorder: React.FC<PhoneRecorderProps> = ({
  onSendAudio,
  onAudioData,
  isLoading = false,
  isPaused = false,
  onStartRecording,
  onStopRecording,
  isLoadingUI = false,
  realtimeText
}) => {
  const { toast } = useToast();
  
  // UI状态
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false); // 新增：初始化状态
  const [isRecordingUI, setIsRecordingUI] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // 新增：识别处理状态
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [silenceCountdown, setSilenceCountdown] = useState(0); // 静音倒计时
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null); // 音频分析器

  // 内部状态引用
  const isRecordingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isPausedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const vadRef = useRef<MicVAD | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const silenceStartTimeRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用 ref 存储最新的静音时长配置，解决闭包问题
  const phoneSilenceDurationRef = useRef(1500);
  
  // 从 Context 获取静音等待时间配置
  const [phoneSilenceDuration] = usePhoneSilenceDuration();
  
  // 当配置更新时，同步到 ref
  useEffect(() => {
    phoneSilenceDurationRef.current = phoneSilenceDuration;
  }, [phoneSilenceDuration]);

  // 采样率配置：如果有流式回调，使用 16000，否则使用 44100
  const SAMPLE_RATE = onAudioData ? 16000 : 44100;
  const BUFFER_SIZE = 2048;
  const MIN_RECORDING_DURATION = 500; // 最短录音时长500ms
  
  // 获取当前的静音等待时间（毫秒）
  const getSilenceDuration = useCallback(() => {
    return phoneSilenceDurationRef.current;
  }, []);



  // 开始录音（在持续监听的基础上）
  const startRecording = useCallback(() => {
    if (isRecordingRef.current || !streamRef.current || isPausedRef.current) return;

    onStartRecording?.();
    
    isRecordingRef.current = true;
    setIsRecordingUI(true);
    recordingStartTimeRef.current = Date.now();
    setRecordingDuration(0);
    setSilenceCountdown(0);
    
    // 重置静音计时
    silenceStartTimeRef.current = null;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // 创建MediaRecorder
    const mediaRecorder = new MediaRecorder(streamRef.current, { 
      mimeType: 'audio/webm;codecs=opus' 
    });
    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const duration = Date.now() - recordingStartTimeRef.current;
      
      if (duration < MIN_RECORDING_DURATION) {
        toast({
          title: "录音时间太短",
          description: "请说话更长时间哦",
          variant: "destructive"
        });
        // 录音完成后重置UI状态，但保持监听
        setIsRecordingUI(false);
        setRecordingDuration(0);
        setSilenceCountdown(0);
        isRecordingRef.current = false;
        onStopRecording?.();
      } else {
        // 直接使用录音数据，不再进行耗时的合并操作
        const finalBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const fileName = `voice-message-${Date.now()}.webm`;
        const audioFile = new File([finalBlob], fileName, {
          type: 'audio/webm;codecs=opus',
          lastModified: Date.now()
        });

        try {
          // 立即重置UI状态，让用户感觉响应更快
          setIsRecordingUI(false);
          setRecordingDuration(0);
          setSilenceCountdown(0);
          isRecordingRef.current = false;
          onStopRecording?.();
          
          setIsProcessing(true);
          await onSendAudio(audioFile);
        } catch (error) {
          console.error('发送语音消息失败:', error);
          toast({
            variant: "destructive",
            title: "发送失败",
            description: "语音消息发送失败，请重试"
          });
        } finally {
          setIsProcessing(false);
        }
      }
    };

    mediaRecorder.start();

    // 启动录音时长计时器
    recordingTimerRef.current = setInterval(() => {
      if (isRecordingRef.current) {
        const duration = Date.now() - recordingStartTimeRef.current;
        setRecordingDuration(duration);
      }
    }, 100);
  }, [onSendAudio, onStartRecording, toast]);

  // 停止录音（但保持监听状态）
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current || !mediaRecorderRef.current) return;
    
    // 清理录音相关的计时器
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    silenceStartTimeRef.current = null;
    setSilenceCountdown(0);
    // 注意：不设置 isRecordingRef.current = false，在 mediaRecorder.onstop 中设置
  }, []);

  // VAD检测到人声开始 - 开始录音（仅在非暂停状态下）
  const handleSpeechStart = useCallback(() => {
    // 在暂停状态下不响应VAD事件
    if (isPausedRef.current) return;
    
    // 重置静音倒计时（如果正在倒计时中被重新检测到语音）
    if (silenceStartTimeRef.current) {
      silenceStartTimeRef.current = null;
      setSilenceCountdown(0);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
    
    // 如果还没有开始录音，则开始录音
    if (!isRecordingRef.current) {
      startRecording();
    }
  }, [startRecording]);

  // VAD检测到人声结束 - 开始1.5秒倒计时（仅在非暂停状态下）
  const handleSpeechEnd = useCallback(() => {
    // 在暂停状态下不响应VAD事件
    if (isPausedRef.current) return;
    
    if (isRecordingRef.current && !silenceStartTimeRef.current) {
      silenceStartTimeRef.current = Date.now();
      startSilenceCountdown();
    }
  }, []);

  // 开始静音倒计时
  const startSilenceCountdown = useCallback(() => {
    const updateCountdown = () => {
      if (!silenceStartTimeRef.current || !isRecordingRef.current) return;
      
      // 每次循环都重新获取最新的静音时长配置，确保设置修改能立即生效
      const duration = getSilenceDuration();
      
      const elapsed = Date.now() - silenceStartTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);
      setSilenceCountdown(remaining);
      
      if (remaining <= 0) {
        // 倒计时结束，停止录音（但继续监听）
        stopRecording();
      } else {
        // 继续倒计时
        silenceTimerRef.current = setTimeout(updateCountdown, 50);
      }
    };
    updateCountdown();
  }, [stopRecording, getSilenceDuration, onAudioData]);

  // 初始化VAD
  const initializeVAD = useCallback(async (stream: MediaStream) => {
    try {
      if (vadRef.current) {
        vadRef.current.destroy();
      }
      
      const vad = await MicVAD.new({
        stream,
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.4,
        minSpeechFrames: 3,
        preSpeechPadFrames: 1,
        redemptionFrames: 8,
        onSpeechStart: handleSpeechStart,
        onSpeechEnd: handleSpeechEnd,
        baseAssetPath: "/vad/",
        model: "v5",
        ortConfig(ort) {
          ort.env.wasm.wasmPaths = "/vad/";
        },
      });
      
      vadRef.current = vad;
    } catch (err) {
      console.error('VAD 初始化失败:', err);
      toast({
        variant: "destructive",
        title: "无法录音",
        description: "请允许使用麦克风，然后重试"
      });
    }
  }, [handleSpeechStart, handleSpeechEnd, toast]);

  // 开始监听（持续监听模式）
  const startListening = async () => {
    try {
      setIsInitializing(true); // 立即设置初始化状态
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: SAMPLE_RATE
        }
      });

      streamRef.current = stream;
      
      // 初始化VAD
      await initializeVAD(stream);
      
      // 初始化音频分析（用于音量显示和波形）
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // 创建分析器
      const analyserNode = audioContextRef.current.createAnalyser();
      analyserNode.fftSize = 64; // 较小的 fftSize 以获得更宽的条形
      source.connect(analyserNode);
      setAnalyser(analyserNode);
      
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
      
      source.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);

      scriptProcessorRef.current.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        
        // 如果正在录音且有流式回调，发送数据
        if (isRecordingRef.current && onAudioData) {
          const pcmData = floatTo16BitPCM(input);
          onAudioData(pcmData);
        }
      };

      // 启动VAD
      vadRef.current?.start();
      setIsListening(true);
      setIsInitializing(false); // 初始化完成
      
    } catch (error) {
      console.error('无法访问麦克风:', error);
      setIsInitializing(false); // 初始化失败
      toast({
        variant: "destructive",
        title: "无法录音",
        description: "请允许使用麦克风，然后重试"
      });
    }
  };

  // 停止监听（完全停止）
  const stopListening = () => {
    // 先停止当前录音
    if (isRecordingRef.current) {
      stopRecording();
    }

    // 清理所有资源
    vadRef.current?.pause();
    vadRef.current?.destroy();
    vadRef.current = null;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    
    setAnalyser(null);

    setIsListening(false);
    isRecordingRef.current = false;
    setIsRecordingUI(false);
    silenceStartTimeRef.current = null;
    setRecordingDuration(0);
    setSilenceCountdown(0);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // 同步外部状态
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    
    // 当暂停状态变化时，如果正在录音且变为暂停状态，停止录音
    if (isPaused && isRecordingRef.current) {
      stopRecording();
    }
  }, [isPaused, stopRecording]);

  // 获取当前状态文案
  const getStatusText = () => {
    if (isInitializing) return "正在启动麦克风...";
    if (isProcessing) return "正在识别...";
    if (isLoadingUI) return "思考中...";
    if (isPaused && !isLoadingUI) return "请稍等，老师正在说话";
    if (isRecordingUI) {
      if (silenceCountdown > 0) {
        return `${(silenceCountdown / 1000).toFixed(1)}s 后发送`;
      }
      return "正在听...";
    }
    if (isListening) return "请说话...";
    return "点击开始对话";
  };

  // 获取按钮样式 - 统一风格
  const getButtonStyle = () => {
    const baseStyle = "relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg border-0";
    
    if (isInitializing) return cn(baseStyle, "bg-slate-100 text-slate-500 cursor-wait");
    if (isProcessing) return cn(baseStyle, "bg-blue-50 text-blue-600 cursor-wait");
    if (isLoadingUI) return cn(baseStyle, "bg-blue-50 text-blue-600 cursor-wait");
    if (isPaused && !isLoadingUI) return cn(baseStyle, "bg-amber-50 text-amber-600 cursor-not-allowed");
    
    if (isRecordingUI) {
      if (silenceCountdown > 0) return cn(baseStyle, "bg-orange-50 text-orange-600 ring-2 ring-orange-500/20"); // 倒计时
      return cn(baseStyle, "bg-green-50 text-green-600 ring-2 ring-green-500/20"); // 录音中
    }
    
    if (isListening) return cn(baseStyle, "bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200"); // 待机
    return cn(baseStyle, "bg-primary text-primary-foreground hover:bg-primary/90"); // 初始状态
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 1. 实时文本气泡 - 微信风格 (屏幕居中) - 使用 Portal 确保脱离父容器限制 */}
      {(isRecordingUI || isProcessing) && createPortal(
        <div className="fixed inset-0 z-[40] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[1px]">
          <div className="bg-[#95EC69] text-black px-6 py-4 rounded-2xl shadow-xl max-w-[80%] min-w-[120px] min-h-[100px] flex items-center justify-center relative animate-in zoom-in-95 duration-200 z-[50]">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-black/60" />
                <span className="text-sm font-medium text-black/80">正在识别...</span>
              </div>
            ) : realtimeText ? (
              <p className="text-lg font-medium leading-relaxed text-center break-all">
                {realtimeText}
              </p>
            ) : (
              <div className="flex items-center justify-center h-12 w-32">
                 <AudioVisualizer 
                   analyser={analyser} 
                   isRecording={isRecordingUI} 
                   width={120}
                   height={40}
                   backgroundColor="transparent"
                   barColorStart="#000000"
                   barColorEnd="#333333"
                 />
              </div>
            )}
            {/* 底部小三角 */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#95EC69] rotate-45"></div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. 主控制按钮 */}
      <div className="relative w-full">
        {/* 倒计时背景填充动画 */}
        {isRecordingUI && silenceCountdown > 0 && !isPaused && (
          <div 
            className="absolute inset-0 bg-orange-100/50 z-0 transition-all duration-100 ease-linear rounded-md pointer-events-none"
            style={{ 
              width: `${(silenceCountdown / getSilenceDuration()) * 100}%`,
              opacity: 0.5
            }}
          />
        )}

        <Button
          className={cn(
            "w-full h-14 text-base font-medium z-10", // 增加高度
            getButtonStyle()
          )}
          onClick={() => {
            if (isLoadingUI || isPaused || isInitializing || isProcessing) return;
            if (isListening) {
              stopListening();
            } else {
              startListening();
            }
          }}
          disabled={isLoadingUI || isInitializing || isProcessing}
        >
          <div className="flex items-center justify-center gap-2 relative z-20">
            {isInitializing && <Loader2 className="w-5 h-5 animate-spin" />}
            {(isLoadingUI || isProcessing) && <Loader2 className="w-5 h-5 animate-spin" />}
            
            {/* 录音中的动态图标 */}
            {isRecordingUI && !silenceCountdown && !isPaused && (
              <div className="flex gap-1 items-center h-4 mr-1">
                 <span className="w-1 h-2 bg-green-500 rounded-full animate-[music-bar_0.6s_ease-in-out_infinite]"></span>
                 <span className="w-1 h-3 bg-green-500 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite]"></span>
                 <span className="w-1 h-2 bg-green-500 rounded-full animate-[music-bar_1.0s_ease-in-out_infinite]"></span>
              </div>
            )}
            
            {/* 倒计时图标 */}
            {isRecordingUI && silenceCountdown > 0 && <Clock className="w-5 h-5 animate-pulse" />}
            
            {/* 待机图标 */}
            {isListening && !isRecordingUI && !isLoadingUI && !isPaused && <Mic className="w-5 h-5" />}
            
            {/* 初始图标 */}
            {!isListening && !isLoadingUI && !isInitializing && <MessageCircle className="w-5 h-5" />}
            
            <span>{getStatusText()}</span>
          </div>
        </Button>
      </div>

      {/* 3. 底部状态栏：仅保留暂停提示 */}
      {isPaused && !isLoadingUI && (
        <div className="flex items-center justify-center w-full mt-2">
          <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-pulse">
            老师正在发言，麦克风暂时关闭
          </span>
        </div>
      )}
    </div>
  );
}; 