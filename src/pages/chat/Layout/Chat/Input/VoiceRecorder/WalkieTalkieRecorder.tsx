import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Loader2, Mic, MicOff, Pause, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';

import { floatTo16BitPCM } from '@/lib/audio-utils';

interface WalkieTalkieRecorderProps {
  onSendAudio: (file: File) => Promise<void>;
  onAudioData?: (data: ArrayBuffer) => void;
  isLoading?: boolean;
  isPaused?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isLoadingUI?: boolean;
  realtimeText?: string;
}

export const WalkieTalkieRecorder: React.FC<WalkieTalkieRecorderProps> = ({
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
  const [isRecordingUI, setIsRecordingUI] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // 新增：识别处理状态
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // 内部状态引用
  const isRecordingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isPausedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 常量配置
  const MIN_RECORDING_DURATION = 300; // 最短录音时长300ms

  // 初始化麦克风监听（切换到对讲机模式时立即开始）
  const startListening = useCallback(async () => {
    if (streamRef.current || isLoadingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;

      // 初始化音频处理（用于流式发送和波形显示）
      // 即使没有 onAudioData，我们也需要 AudioContext 来显示波形
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      
      // 创建分析器
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 64;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      if (onAudioData) {
        scriptProcessorRef.current = audioContext.createScriptProcessor(2048, 1, 1);
        
        source.connect(scriptProcessorRef.current);
        scriptProcessorRef.current.connect(audioContext.destination);

        scriptProcessorRef.current.onaudioprocess = (event) => {
          if (isRecordingRef.current) {
            const input = event.inputBuffer.getChannelData(0);
            const pcmData = floatTo16BitPCM(input);
            onAudioData(pcmData);
          }
        };
      }

      setIsListening(true);
      console.log('[对讲机] 麦克风监听已启动');
    } catch (error) {
      console.error('无法访问麦克风:', error);
      toast({
        variant: "destructive",
        title: "无法录音",
        description: "请允许使用麦克风权限"
      });
    }
  }, [toast]);

  // 停止监听
  const stopListening = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
    }

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
    console.log('[对讲机] 麦克风监听已停止');
  }, []);

  // 开始录音（按住时立即开始）
  const startRecording = useCallback(() => {
    if (isRecordingRef.current || !streamRef.current || isPausedRef.current) return;

    onStartRecording?.();
    
    isRecordingRef.current = true;
    setIsRecordingUI(true);
    recordingStartTimeRef.current = Date.now();
    setRecordingDuration(0);
    
    console.log('[对讲机] 开始录音');

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
        console.log(`[对讲机] 录音时长过短 (${duration}ms)，已丢弃`);
        toast({
          title: "说话时间太短啦",
          description: "按住时间长一点再试试哦",
          variant: "destructive"
        });
      } else {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const fileName = `voice-message-${Date.now()}.webm`;
        const audioFile = new File([blob], fileName, {
          type: 'audio/webm;codecs=opus',
          lastModified: Date.now()
        });

        try {
          setIsProcessing(true);
          await onSendAudio(audioFile);
          console.log(`[对讲机] 发送成功，时长: ${(duration / 1000).toFixed(1)}s`);
        } catch (error) {
          console.error('发送语音消息失败:', error);
          toast({
            variant: "destructive",
            title: "发送失败",
            description: "消息发送失败，请重试"
          });
        } finally {
          setIsProcessing(false);
        }
      }
      
      setIsRecordingUI(false);
      setRecordingDuration(0);
      isRecordingRef.current = false;
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

  // 停止录音
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current || !mediaRecorderRef.current) return;
    
    onStopRecording?.();
    
    // 清理计时器
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // 对讲机按钮事件处理
  const handlePress = useCallback(() => {
    if (isPausedRef.current || isLoadingRef.current) return;
    startRecording();
  }, [startRecording]);

  const handleRelease = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
    }
  }, [stopRecording]);

  // 组件挂载时自动开始监听
  useEffect(() => {
    startListening();
    return () => {
      stopListening();
    };
  }, [startListening, stopListening]);

  // 同步外部状态
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    
    // 暂停状态下停止录音
    if (isPaused && isRecordingRef.current) {
      stopRecording();
    }
  }, [isPaused, stopRecording]);

  // 获取按钮内容（图标 + 文本）
  const getButtonContent = () => {
    if (isProcessing) {
      return (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          正在识别...
        </>
      );
    }

    if (isLoadingUI) {
      return (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          思考中...
        </>
      );
    }
    
    if (isPaused && !isLoadingUI) {
      return (
        <>
          <Pause className="w-5 h-5 mr-2" />
          请稍等，老师正在说话
        </>
      );
    }
    
    if (isRecordingUI) {
      return (
        <>
          <div className="flex gap-1 items-center h-4 mr-2">
             <span className="w-1 h-2 bg-green-500 rounded-full animate-[music-bar_0.6s_ease-in-out_infinite]"></span>
             <span className="w-1 h-3 bg-green-500 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite]"></span>
             <span className="w-1 h-2 bg-green-500 rounded-full animate-[music-bar_1.0s_ease-in-out_infinite]"></span>
          </div>
          松开发送 {(recordingDuration / 1000).toFixed(1)}s
        </>
      );
    }
    
    if (isListening) {
      return (
        <>
          <Radio className="w-5 h-5 mr-2" />
          按住说话
        </>
      );
    }
    
    return (
      <>
        <MicOff className="w-5 h-5 mr-2" />
        准备连接麦克风...
      </>
    );
  };

  // 获取按钮样式 - 统一风格
  const getButtonStyle = () => {
    const baseStyle = "relative overflow-hidden transition-all duration-200 shadow-md hover:shadow-lg border-0";
    
    if (isProcessing) return cn(baseStyle, "bg-blue-50 text-blue-600 cursor-wait");
    if (isLoadingUI) return cn(baseStyle, "bg-blue-50 text-blue-600 cursor-wait");
    if (isPaused && !isLoadingUI) return cn(baseStyle, "bg-amber-50 text-amber-600 cursor-not-allowed");
    
    if (isRecordingUI) return cn(baseStyle, "bg-green-50 text-green-600 ring-2 ring-green-500/20 scale-[0.98]"); // 按下状态
    
    if (isListening) return cn(baseStyle, "bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200"); // 待机
    
    return cn(baseStyle, "bg-slate-100 text-slate-400"); // 未就绪
  };

  return (
    <div className="w-full relative flex flex-col gap-3">
      {/* 实时文本显示 - 微信风格 (屏幕居中) - 使用 Portal 确保脱离父容器限制 */}
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

      {/* 按住说话按钮 - 集成所有状态信息 */}
      <Button
        className={cn(
          "w-full h-14 text-base font-medium transition-all duration-200", // 高度统一为 h-14
          "active:scale-95 active:shadow-inner select-none",
          getButtonStyle(),
          (isLoadingUI || isPaused) && "opacity-75 cursor-not-allowed"
        )}
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        disabled={isLoadingUI || isProcessing}
      >
        {getButtonContent()}
      </Button>
      
    </div>
  );
}; 