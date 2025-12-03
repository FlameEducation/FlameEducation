import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MicVAD } from '@ricky0123/vad-web';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Mic, Square, Settings, Volume2, Activity, Shield } from 'lucide-react';

// 录音状态枚举
enum RecordingState {
  IDLE = 'idle',
  LISTENING = 'listening', 
  RECORDING = 'recording',
  PROCESSING = 'processing',
  ERROR = 'error'
}

// VAD配置接口
interface VADConfig {
  positiveSpeechThreshold: number;
  negativeSpeechThreshold: number;
  minSpeechFrames: number;
  preSpeechPadFrames: number;
  redemptionFrames: number;
}

// 音频状态接口
interface AudioMetrics {
  volume: number;
  frequency: number;
  speechConfidence: number;
  noiseLevel: number;
}

// 录音配置接口
interface RecordingConfig {
  silenceTimeout: number; // 静音超时（秒）
  maxRecordingTime: number; // 最大录音时长（秒）
  preRecordingBuffer: number; // 预录制缓冲（秒）
  sampleRate: number;
  enableNoiseReduction: boolean;
}

// 智能降噪配置接口 - 新增
interface SmartNoiseConfig {
  enableVolumeGating: boolean; // 音量门控
  volumeThreshold: number; // 音量阈值
  enableFrequencyFiltering: boolean; // 频率滤波
  enableDirectionalDetection: boolean; // 方向性检测
  enableAdaptiveThreshold: boolean; // 自适应阈值
  backgroundNoiseLevel: number; // 背景噪音基准
}

// 组件Props接口
interface SmartVoiceRecorderProps {
  onAudioReady: (audioBlob: Blob, metrics: AudioMetrics) => void;
  onStateChange?: (state: RecordingState) => void;
  isLoading?: boolean;
  isPaused?: boolean;
  showAdvancedControls?: boolean;
  className?: string;
  // 新增：外部配置传入
  externalVadConfig?: Partial<VADConfig>;
  externalSmartNoiseConfig?: Partial<SmartNoiseConfig>;
  externalRecordingConfig?: Partial<RecordingConfig>;
}

const SmartVoiceRecorder: React.FC<SmartVoiceRecorderProps> = ({
  onAudioReady,
  onStateChange,
  isLoading = false,
  isPaused = false,
  showAdvancedControls = false,
  className,
  externalVadConfig,
  externalSmartNoiseConfig,
  externalRecordingConfig
}) => {
  // 基础状态
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // VAD相关
  const vadRef = useRef<MicVAD | null>(null);
  const [isVadReady, setIsVadReady] = useState(false);
  const [vadConfig, setVadConfig] = useState<VADConfig>({
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.4,
    minSpeechFrames: 3,
    preSpeechPadFrames: 2,
    redemptionFrames: 10,
  });

  // 音频分析
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    volume: 0,
    frequency: 0,
    speechConfidence: 0,
    noiseLevel: 0,
  });

  // 录音相关
  const [recordingConfig, setRecordingConfig] = useState<RecordingConfig>({
    silenceTimeout: 2,
    maxRecordingTime: 30,
    preRecordingBuffer: 1,
    sampleRate: 16000,
    enableNoiseReduction: true,
  });

  // 智能降噪配置
  const [smartNoiseConfig, setSmartNoiseConfig] = useState<SmartNoiseConfig>({
    enableVolumeGating: true,
    volumeThreshold: 15,
    enableFrequencyFiltering: true,
    enableDirectionalDetection: true,
    enableAdaptiveThreshold: true,
    backgroundNoiseLevel: 0,
  });

  // 新增状态：语音检测状态
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(0);

  // 录音数据管理
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingChunks = useRef<BlobPart[]>([]);
  const preRecordingBuffer = useRef<Float32Array[]>([]);
  
  // 定时器
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxRecordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number>(0);

  // 统计数据
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [speechStartTime, setSpeechStartTime] = useState<number>(0);

  // 智能降噪相关状态 - 新增
  const backgroundNoiseSamples = useRef<number[]>([]);
  const volumeHistory = useRef<number[]>([]);
  const speechQualityHistory = useRef<number[]>([]);
  const [isBackgroundCalibrated, setIsBackgroundCalibrated] = useState(false);

  // 更新录音状态
  const updateRecordingState = useCallback((newState: RecordingState) => {
    setRecordingState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // 背景噪音校准 - 新增
  const calibrateBackgroundNoise = useCallback(() => {
    if (backgroundNoiseSamples.current.length > 50) {
      const avgNoise = backgroundNoiseSamples.current.reduce((a, b) => a + b, 0) / backgroundNoiseSamples.current.length;
      setSmartNoiseConfig(prev => ({
        ...prev,
        backgroundNoiseLevel: avgNoise * 1.2 // 稍微高于平均值
      }));
      setIsBackgroundCalibrated(true);
      console.log('背景噪音校准完成:', avgNoise.toFixed(2));
    }
  }, []);

  // 响应外部配置变化
  useEffect(() => {
    if (externalVadConfig) {
      setVadConfig(prev => ({ ...prev, ...externalVadConfig }));
    }
  }, [externalVadConfig]);

  useEffect(() => {
    if (externalSmartNoiseConfig) {
      setSmartNoiseConfig(prev => ({ ...prev, ...externalSmartNoiseConfig }));
    }
  }, [externalSmartNoiseConfig]);

  useEffect(() => {
    if (externalRecordingConfig) {
      setRecordingConfig(prev => ({ ...prev, ...externalRecordingConfig }));
    }
  }, [externalRecordingConfig]);

  // 智能音频分析 - 增强版，返回更详细的信息
  const analyzeAudioIntelligently = useCallback((volume: number, frequency: number, speechConfidence: number, noiseLevel: number): { 
    isRealSpeech: boolean; 
    reason: string;
    confidence: number;
  } => {
    let confidence = 0;
    let reasons: string[] = [];

    console.log(`[智能分析] 音量:${volume.toFixed(1)}% 频率:${frequency.toFixed(0)}Hz 语音置信度:${speechConfidence.toFixed(1)}% 噪音:${noiseLevel.toFixed(1)}%`);

    // 1. 音量门控检查
    if (smartNoiseConfig.enableVolumeGating && volume < smartNoiseConfig.volumeThreshold) {
      return { isRealSpeech: false, reason: `音量过低(${volume.toFixed(1)}% < ${smartNoiseConfig.volumeThreshold}%)`, confidence: 0 };
    }
    confidence += 20;
    reasons.push('音量合格');

    // 2. 背景噪音自适应
    if (smartNoiseConfig.enableAdaptiveThreshold) {
      // 收集背景噪音样本
      if (recordingState === RecordingState.LISTENING && volume < 10) {
        backgroundNoiseSamples.current.push(noiseLevel);
        if (backgroundNoiseSamples.current.length > 100) {
          backgroundNoiseSamples.current.shift();
        }
        
        if (!isBackgroundCalibrated && backgroundNoiseSamples.current.length >= 50) {
          calibrateBackgroundNoise();
        }
      }

      if (isBackgroundCalibrated && noiseLevel > smartNoiseConfig.backgroundNoiseLevel * 0.8) {
        return { isRealSpeech: false, reason: `背景噪音过高(${noiseLevel.toFixed(1)}% > ${(smartNoiseConfig.backgroundNoiseLevel * 0.8).toFixed(1)}%)`, confidence: 0 };
      }
      confidence += 20;
      reasons.push('噪音水平正常');
    }

    // 3. 频率特征分析
    if (smartNoiseConfig.enableFrequencyFiltering) {
      const isInHumanVoiceRange = frequency >= 800 && frequency <= 2000;
      if (!isInHumanVoiceRange && speechConfidence < 70) {
        return { isRealSpeech: false, reason: `频率不在人声范围(${frequency.toFixed(0)}Hz 不在800-2000Hz)且置信度低`, confidence: 0 };
      }
      confidence += 20;
      reasons.push('频率匹配');
    }

    // 4. 方向性检测
    if (smartNoiseConfig.enableDirectionalDetection) {
      volumeHistory.current.push(volume);
      if (volumeHistory.current.length > 10) {
        volumeHistory.current.shift();
      }

      if (volumeHistory.current.length >= 5) {
        const recentVolumes = volumeHistory.current.slice(-5);
        const avgVolume = recentVolumes.reduce((a, b) => a + b) / recentVolumes.length;
        const volumeVariance = recentVolumes.reduce((acc, vol) => {
          return acc + Math.pow(vol - avgVolume, 2);
        }, 0) / recentVolumes.length;

        if (volumeVariance < 2 && volume > 10) {
          return { isRealSpeech: false, reason: `音量变化太小(方差:${volumeVariance.toFixed(1)})，疑似背景声音`, confidence: 0 };
        }
        confidence += 20;
        reasons.push('音量变化正常');
      }
    }

    // 5. 语音质量综合评估
    speechQualityHistory.current.push(speechConfidence);
    if (speechQualityHistory.current.length > 5) {
      speechQualityHistory.current.shift();
    }

    const avgSpeechQuality = speechQualityHistory.current.reduce((a, b) => a + b, 0) / speechQualityHistory.current.length;
    
    // 最终判断
    const finalCheck = volume >= smartNoiseConfig.volumeThreshold && 
                      speechConfidence >= 60 && 
                      avgSpeechQuality >= 50;

    if (!finalCheck) {
      return { 
        isRealSpeech: false, 
        reason: `综合评估不通过: 音量${volume.toFixed(1)}%，置信度${speechConfidence.toFixed(1)}%，平均质量${avgSpeechQuality.toFixed(1)}%`, 
        confidence: Math.min(confidence, 40) 
      };
    }

    confidence += 20;
    reasons.push('综合评估通过');

    return { 
      isRealSpeech: true, 
      reason: reasons.join(' + '), 
      confidence: Math.min(confidence, 100) 
    };
  }, [smartNoiseConfig, recordingState, isBackgroundCalibrated, calibrateBackgroundNoise]);

  // VAD事件处理 - 增强版，添加详细日志
  const handleSpeechStart = useCallback(() => {
    if (isPaused || recordingState === RecordingState.RECORDING) return;
    
    const analysis = analyzeAudioIntelligently(
      audioMetrics.volume,
      audioMetrics.frequency, 
      audioMetrics.speechConfidence,
      audioMetrics.noiseLevel
    );
    
    setIsSpeechDetected(true);
    setLastSpeechTime(Date.now());
    
    console.log(`[VAD] 语音开始检测 - ${analysis.isRealSpeech ? '✅ 确认' : '❌ 拒绝'}: ${analysis.reason}`);
    
    if (!analysis.isRealSpeech) {
      console.log(`[智能降噪] 过滤原因: ${analysis.reason}`);
      return;
    }
    
    console.log('🎯 检测到真实语音，开始录音！');
    setSpeechStartTime(Date.now());
    startRecording();
  }, [isPaused, recordingState, audioMetrics, analyzeAudioIntelligently]);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeechDetected(false);
    
    if (recordingState !== RecordingState.RECORDING) return;
    
    console.log('🔇 检测到语音结束，开始静音计时...');
    silenceTimerRef.current = setTimeout(() => {
      console.log('⏰ 静音超时，停止录音');
      stopRecording();
    }, recordingConfig.silenceTimeout * 1000);
  }, [recordingState, recordingConfig.silenceTimeout]);

  const handleVADMisfire = useCallback(() => {
    console.log('⚠️ VAD误触发 - 已被智能降噪过滤');
  }, []);

  // 初始化麦克风和VAD
  const initializeMicrophone = async () => {
    try {
      updateRecordingState(RecordingState.IDLE);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: recordingConfig.sampleRate,
          channelCount: 1,
          echoCancellation: recordingConfig.enableNoiseReduction,
          noiseSuppression: recordingConfig.enableNoiseReduction,
          autoGainControl: true,
        },
      });

      setMicStream(stream);
      await initializeVAD(stream);
      initializeAudioAnalysis(stream);
      updateRecordingState(RecordingState.LISTENING);
      setError(null);
      
    } catch (err) {
      console.error('麦克风初始化失败:', err);
      setError('无法访问麦克风，请检查权限设置');
      updateRecordingState(RecordingState.ERROR);
    }
  };

  // 初始化VAD
  const initializeVAD = async (stream: MediaStream) => {
    try {
      if (vadRef.current) {
        vadRef.current.destroy();
      }

      const vad = await MicVAD.new({
        stream,
        positiveSpeechThreshold: vadConfig.positiveSpeechThreshold,
        negativeSpeechThreshold: vadConfig.negativeSpeechThreshold,
        minSpeechFrames: vadConfig.minSpeechFrames,
        preSpeechPadFrames: vadConfig.preSpeechPadFrames,
        redemptionFrames: vadConfig.redemptionFrames,
        onSpeechStart: handleSpeechStart,
        onSpeechEnd: handleSpeechEnd,
        onVADMisfire: handleVADMisfire,
      });

      vadRef.current = vad;
      setIsVadReady(true);
    } catch (err) {
      console.error('VAD初始化失败:', err);
      setError('语音检测系统初始化失败');
    }
  };

  // 初始化音频分析
  const initializeAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext({ sampleRate: recordingConfig.sampleRate });
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 2048;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      startAudioAnalysis();
    } catch (err) {
      console.error('音频分析初始化失败:', err);
    }
  };

  // 开始音频分析 - 增强版
  const startAudioAnalysis = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeDataArray);
      
      // 计算音量（RMS）
      let sum = 0;
      for (let i = 0; i < timeDataArray.length; i++) {
        const amplitude = (timeDataArray[i] - 128) / 128;
        sum += amplitude * amplitude;
      }
      const volume = Math.sqrt(sum / timeDataArray.length) * 100;

      // 计算主频率（人声频率范围 300-3400Hz）
      const sampleRate = audioContextRef.current?.sampleRate || 16000;
      const frequencyPerBin = sampleRate / (2 * bufferLength);
      
      let maxValue = 0;
      let maxIndex = 0;
      const humanVoiceStart = Math.floor(300 / frequencyPerBin);
      const humanVoiceEnd = Math.floor(3400 / frequencyPerBin);
      
      for (let i = humanVoiceStart; i < humanVoiceEnd && i < bufferLength; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }
      const frequency = maxIndex * frequencyPerBin;

      // 计算噪音水平（低频部分）
      let noiseSum = 0;
      const noiseEnd = Math.floor(200 / frequencyPerBin);
      for (let i = 0; i < noiseEnd && i < bufferLength; i++) {
        noiseSum += dataArray[i];
      }
      const noiseLevel = (noiseSum / noiseEnd) / 255 * 100;

      // 计算语音置信度（人声频率范围内的能量比例）
      let speechSum = 0;
      let totalSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        totalSum += dataArray[i];
        if (i >= humanVoiceStart && i < humanVoiceEnd) {
          speechSum += dataArray[i];
        }
      }
      const speechConfidence = totalSum > 0 ? (speechSum / totalSum) * 100 : 0;

      setAudioMetrics({
        volume,
        frequency,
        speechConfidence,
        noiseLevel,
      });

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  // 开始录音
  const startRecording = () => {
    if (!micStream || recordingState === RecordingState.RECORDING) return;

    try {
      recordingChunks.current = [];
      
      const mediaRecorder = new MediaRecorder(micStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processRecording();
      };

      mediaRecorder.start(100); // 每100ms一个数据块
      mediaRecorderRef.current = mediaRecorder;
      
      setRecordingStartTime(Date.now());
      updateRecordingState(RecordingState.RECORDING);

      // 设置最大录音时长保护
      maxRecordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, recordingConfig.maxRecordingTime * 1000);

    } catch (err) {
      console.error('录音启动失败:', err);
      setError('录音启动失败');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (recordingState !== RecordingState.RECORDING) return;

    // 清理定时器
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }

    // 停止录音
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    updateRecordingState(RecordingState.PROCESSING);
  };

  // 处理录音结果
  const processRecording = async () => {
    try {
      if (recordingChunks.current.length === 0) {
        updateRecordingState(RecordingState.LISTENING);
        return;
      }

      const audioBlob = new Blob(recordingChunks.current, { 
        type: 'audio/webm;codecs=opus' 
      });

      // 传递当前的音频指标
      onAudioReady(audioBlob, { ...audioMetrics });
      
      updateRecordingState(RecordingState.LISTENING);
    } catch (err) {
      console.error('录音处理失败:', err);
      setError('录音处理失败');
      updateRecordingState(RecordingState.ERROR);
    }
  };

  // 手动开始监听
  const startListening = () => {
    if (!isVadReady) {
      initializeMicrophone();
    } else {
      vadRef.current?.start();
      updateRecordingState(RecordingState.LISTENING);
      // 重置背景噪音校准
      setIsBackgroundCalibrated(false);
      backgroundNoiseSamples.current = [];
    }
  };

  // 手动停止监听
  const stopListening = () => {
    vadRef.current?.pause();
    if (recordingState === RecordingState.RECORDING) {
      stopRecording();
    }
    updateRecordingState(RecordingState.IDLE);
  };

  // 更新VAD配置
  const updateVADConfig = async (newConfig: Partial<VADConfig>) => {
    const updatedConfig = { ...vadConfig, ...newConfig };
    setVadConfig(updatedConfig);
    
    if (micStream && isVadReady) {
      await initializeVAD(micStream);
    }
  };

  // 更新智能降噪配置 - 新增
  const updateSmartNoiseConfig = (newConfig: Partial<SmartNoiseConfig>) => {
    setSmartNoiseConfig(prev => ({ ...prev, ...newConfig }));
  };

  // 手动校准背景噪音 - 新增
  const manualCalibrateBackground = () => {
    setIsBackgroundCalibrated(false);
    backgroundNoiseSamples.current = [];
    setTimeout(() => {
      if (backgroundNoiseSamples.current.length > 10) {
        calibrateBackgroundNoise();
      }
    }, 3000); // 3秒后自动校准
  };

  // 组件卸载清理
  useEffect(() => {
    return () => {
      vadRef.current?.destroy();
      micStream?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (maxRecordingTimerRef.current) {
        clearTimeout(maxRecordingTimerRef.current);
      }
    };
  }, []);

  // 状态指示器颜色
  const getStateColor = () => {
    switch (recordingState) {
      case RecordingState.RECORDING: return 'bg-red-500';
      case RecordingState.LISTENING: return 'bg-green-500';
      case RecordingState.PROCESSING: return 'bg-yellow-500';
      case RecordingState.ERROR: return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  // 状态文本
  const getStateText = () => {
    switch (recordingState) {
      case RecordingState.IDLE: return '待机';
      case RecordingState.LISTENING: return '监听中';
      case RecordingState.RECORDING: return '录音中';
      case RecordingState.PROCESSING: return '处理中';
      case RecordingState.ERROR: return '错误';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 主控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            智能语音录音器
            {isBackgroundCalibrated && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                降噪已校准
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 状态显示 */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                getStateColor(),
                recordingState === RecordingState.RECORDING && "animate-pulse"
              )} />
              <span className="font-medium">{getStateText()}</span>
              {/* 新增：语音检测状态 */}
              {recordingState === RecordingState.LISTENING && (
                <Badge variant={isSpeechDetected ? "default" : "outline"} className="text-xs">
                  {isSpeechDetected ? "🎤 检测到语音" : "🔇 等待语音"}
                </Badge>
              )}
            </div>
            <Badge variant={recordingState === RecordingState.RECORDING ? "destructive" : "default"}>
              {recordingState === RecordingState.RECORDING && "🔴 "}
              {isVadReady ? '就绪' : '加载中'}
            </Badge>
          </div>

          {/* 语音检测详情 - 新增 */}
          {recordingState === RecordingState.LISTENING && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">实时检测状态</span>
                <span className={cn(
                  "font-mono",
                  isSpeechDetected ? "text-green-600" : "text-gray-500"
                )}>
                  {isSpeechDetected ? "语音中" : "静音"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>音量阈值:</span>
                  <span className={audioMetrics.volume >= smartNoiseConfig.volumeThreshold ? "text-green-600" : "text-red-500"}>
                    {audioMetrics.volume.toFixed(1)}% / {smartNoiseConfig.volumeThreshold}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>人声频率:</span>
                  <span className={audioMetrics.frequency >= 800 && audioMetrics.frequency <= 2000 ? "text-green-600" : "text-yellow-600"}>
                    {audioMetrics.frequency.toFixed(0)}Hz
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>语音置信:</span>
                  <span className={audioMetrics.speechConfidence >= 60 ? "text-green-600" : "text-red-500"}>
                    {audioMetrics.speechConfidence.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>噪音水平:</span>
                  <span className={isBackgroundCalibrated && audioMetrics.noiseLevel <= smartNoiseConfig.backgroundNoiseLevel * 0.8 ? "text-green-600" : "text-yellow-600"}>
                    {audioMetrics.noiseLevel.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {lastSpeechTime > 0 && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  上次检测: {new Date(lastSpeechTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {/* 音频指标 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>音量</span>
                <span>{audioMetrics.volume.toFixed(1)}%</span>
              </div>
              <Progress value={audioMetrics.volume} className="h-2" />
              {/* 音量阈值指示线 */}
              <div className="relative mt-1">
                <div 
                  className="absolute h-0.5 bg-red-500 opacity-60"
                  style={{ 
                    left: `${smartNoiseConfig.volumeThreshold}%`,
                    width: '2px',
                    top: '-6px'
                  }}
                />
                <div className="text-xs text-red-500" style={{ marginLeft: `${smartNoiseConfig.volumeThreshold}%` }}>
                  阈值
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>语音置信度</span>
                <span>{audioMetrics.speechConfidence.toFixed(1)}%</span>
              </div>
              <Progress value={audioMetrics.speechConfidence} className="h-2" />
              {/* 置信度说明 */}
              <div className="text-xs text-muted-foreground mt-1">
                {audioMetrics.speechConfidence >= 80 ? "高置信度 - 可能是人声" :
                 audioMetrics.speechConfidence >= 60 ? "中等置信度 - 需要其他条件验证" :
                 audioMetrics.speechConfidence >= 40 ? "低置信度 - 可能不是人声" :
                 "极低置信度 - 大概率不是人声"}
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-2">
            {recordingState === RecordingState.IDLE ? (
              <Button 
                onClick={startListening} 
                disabled={isLoading}
                className="flex-1"
              >
                <Mic className="w-4 h-4 mr-2" />
                开始监听
              </Button>
            ) : (
              <Button 
                onClick={stopListening}
                variant="destructive"
                className="flex-1"
              >
                <Square className="w-4 h-4 mr-2" />
                停止监听
              </Button>
            )}
            
            {/* 背景噪音校准按钮 */}
            <Button 
              onClick={manualCalibrateBackground}
              variant="outline"
              size="sm"
              disabled={recordingState === RecordingState.IDLE}
            >
              <Shield className="w-4 h-4 mr-1" />
              校准背景音
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 智能降噪控制面板 */}
      {showAdvancedControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              智能降噪设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">音量门控阈值</label>
                <Slider
                  value={[smartNoiseConfig.volumeThreshold]}
                  onValueChange={([value]) => updateSmartNoiseConfig({ volumeThreshold: value })}
                  max={50}
                  min={5}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-right mt-1">{smartNoiseConfig.volumeThreshold}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  低于此音量的声音将被忽略
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium">背景噪音基准</label>
                <div className="mt-2 p-2 bg-secondary rounded text-sm">
                  {isBackgroundCalibrated ? 
                    `${smartNoiseConfig.backgroundNoiseLevel.toFixed(1)}%` : 
                    '未校准'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  自动检测的背景噪音水平
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>音量门控</span>
                  <input 
                    type="checkbox" 
                    checked={smartNoiseConfig.enableVolumeGating}
                    onChange={(e) => updateSmartNoiseConfig({ enableVolumeGating: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>频率滤波</span>
                  <input 
                    type="checkbox" 
                    checked={smartNoiseConfig.enableFrequencyFiltering}
                    onChange={(e) => updateSmartNoiseConfig({ enableFrequencyFiltering: e.target.checked })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>方向性检测</span>
                  <input 
                    type="checkbox" 
                    checked={smartNoiseConfig.enableDirectionalDetection}
                    onChange={(e) => updateSmartNoiseConfig({ enableDirectionalDetection: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>自适应阈值</span>
                  <input 
                    type="checkbox" 
                    checked={smartNoiseConfig.enableAdaptiveThreshold}
                    onChange={(e) => updateSmartNoiseConfig({ enableAdaptiveThreshold: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>当前频率:</strong> {audioMetrics.frequency.toFixed(0)}Hz
                </div>
                <div>
                  <strong>噪音水平:</strong> {audioMetrics.noiseLevel.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 高级控制面板 */}
      {showAdvancedControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              高级设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">语音检测阈值</label>
                <Slider
                  value={[vadConfig.positiveSpeechThreshold]}
                  onValueChange={([value]) => updateVADConfig({ positiveSpeechThreshold: value })}
                  max={1}
                  min={0}
                  step={0.05}
                  className="mt-2"
                />
                <div className="text-xs text-right mt-1">{vadConfig.positiveSpeechThreshold}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium">静音超时 (秒)</label>
                <Slider
                  value={[recordingConfig.silenceTimeout]}
                  onValueChange={([value]) => setRecordingConfig(prev => ({ ...prev, silenceTimeout: value }))}
                  max={5}
                  min={0.5}
                  step={0.5}
                  className="mt-2"
                />
                <div className="text-xs text-right mt-1">{recordingConfig.silenceTimeout}s</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {audioMetrics.frequency.toFixed(0)}Hz
                </div>
                <div className="text-muted-foreground">主频率</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {audioMetrics.noiseLevel.toFixed(1)}%
                </div>
                <div className="text-muted-foreground">噪音水平</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {recordingStartTime > 0 ? ((Date.now() - recordingStartTime) / 1000).toFixed(1) : '0'}s
                </div>
                <div className="text-muted-foreground">录音时长</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartVoiceRecorder; 