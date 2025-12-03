import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Square, AlertCircle, Volume2, Wifi, WifiOff, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { testAsr, AsrProviderConfig } from '@/api/asr-config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { AudioVisualizer } from '@/components/ui/audio-visualizer';

interface AsrTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: AsrProviderConfig | null;
}

const AsrTestDialog: React.FC<AsrTestDialogProps> = ({ open, onOpenChange, provider }) => {
  const [isRealtime, setIsRealtime] = useState(true);

  // Reset realtime toggle when provider changes
  useEffect(() => {
    if (provider?.providerName !== 'doubao') {
      setIsRealtime(false);
    } else {
      setIsRealtime(true);
    }
  }, [provider]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] transition-all duration-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-500" />
            测试语音识别 - {provider?.providerName === 'doubao' ? '豆包' : provider?.providerName === 'google' ? 'Google' : provider?.providerName}
          </DialogTitle>
          <DialogDescription>
            {isRealtime && provider?.providerName === 'doubao' 
              ? '实时流式识别模式：边说边识别，低延迟。' 
              : '文件上传模式：录音结束后上传文件进行识别。'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          
          {provider?.providerName === 'doubao' && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <Label htmlFor="realtime-mode" className="text-sm font-medium text-slate-700">实时流式识别</Label>
              </div>
              <Switch id="realtime-mode" checked={isRealtime} onCheckedChange={setIsRealtime} />
            </div>
          )}

          <div className="min-h-[300px] flex flex-col">
            {isRealtime && provider?.providerName === 'doubao' ? (
              <RealtimeTester provider={provider} />
            ) : (
              <FileTester provider={provider} />
            )}
          </div>
          
          <Alert className="bg-blue-50 border-blue-100 text-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs">
              测试将使用当前配置的参数进行请求，不会影响线上生效配置。
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RealtimeTester: React.FC<{ provider: AsrProviderConfig | null }> = () => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'recording' | 'error'>('idle');
  const [testResult, setTestResult] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStatus('idle');
    setAnalyser(null);
  };

  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  const startRecording = async () => {
    try {
      setStatus('connecting');
      setTestResult('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // 尝试使用 16000 采样率，如果失败则使用默认
      let audioContext: AudioContext;
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      } catch (e) {
        console.warn("Does not support 16000 sample rate, using default", e);
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      
      // 创建分析器用于可视化
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      // 创建处理器
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/asr`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setStatus('recording');
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.text) {
            setTestResult(data.text);
          }
          if (data.error) {
            toast.error(data.error);
            setStatus('error');
          }
        } catch (err) {
          console.error('Error parsing message', err);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error', e);
        toast.error('WebSocket 连接错误');
        setStatus('error');
        cleanup();
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        if (status === 'recording') {
            cleanup();
        }
      };

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // 简单的降采样逻辑（如果需要）- 这里假设后端能处理或者 AudioContext 已经正确设置
          // 如果 AudioContext 不是 16000，这里发送的数据会导致识别错误（变快或变慢）
          // 暂时假设浏览器支持设置 sampleRate，或者用户接受这种限制
          const pcmData = floatTo16BitPCM(inputData);
          ws.send(pcmData);
        }
      };

      // 连接节点: Source -> Analyser -> Processor -> Destination
      // 注意：ScriptProcessor 需要连接到 destination 才能工作
      analyserNode.connect(processor);
      processor.connect(audioContext.destination);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("无法访问麦克风");
      setStatus('error');
      cleanup();
    }
  };

  const stopRecording = () => {
    cleanup();
  };

  return (
    <div className="flex flex-col items-center gap-6 flex-1">
      <div className="relative">
        <Button
          size="lg"
          variant={status === 'recording' ? "destructive" : "default"}
          className={cn(
            "h-24 w-24 rounded-full transition-all duration-300 shadow-xl flex flex-col gap-1",
            status === 'recording' ? 'animate-pulse ring-4 ring-red-100 scale-110' : 'hover:scale-105',
            status === 'connecting' && 'opacity-80 cursor-wait'
          )}
          onClick={status === 'recording' ? stopRecording : startRecording}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : status === 'recording' ? (
            <Square className="h-8 w-8 fill-current" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
          <span className="text-[10px] font-medium opacity-90">
            {status === 'idle' ? '开始测试' : status === 'connecting' ? '连接中' : '停止'}
          </span>
        </Button>
        
        {status === 'recording' && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              正在录音
            </span>
          </div>
        )}
      </div>

      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            音频输入
          </span>
          <span className={cn("flex items-center gap-1", status === 'recording' ? "text-green-500" : "text-slate-400")}>
            {status === 'recording' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {status === 'recording' ? '已连接' : '未连接'}
          </span>
        </div>
        <AudioVisualizer analyser={analyser} isRecording={status === 'recording'} />
      </div>

      <div className="w-full flex-1 min-h-[120px] rounded-xl bg-slate-50 p-4 border border-slate-100 flex flex-col">
        <h3 className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          识别结果
        </h3>
        {testResult ? (
          <p className="text-slate-900 whitespace-pre-wrap text-sm leading-relaxed animate-in fade-in duration-300">
            {testResult}
          </p>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-sm italic">
            {status === 'recording' ? '正在聆听...' : '暂无识别结果'}
          </div>
        )}
      </div>
    </div>
  );
};

const FileTester: React.FC<{ provider: AsrProviderConfig | null }> = ({ provider }) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAnalyser(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // 设置可视化
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], "test_audio.webm", { type: 'audio/webm' });
        handleTestAsr(file);
        cleanup();
      };

      mediaRecorder.start();
      setStatus('recording');
      setTestResult('');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("无法访问麦克风");
      setStatus('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('uploading');
    }
  };

  const handleTestAsr = async (file: File) => {
    if (!provider) return;
    
    try {
      const result = await testAsr(file, provider.providerName);
      setTestResult(result);
      setStatus('success');
      toast.success('测试成功');
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('测试失败');
      setTestResult('测试失败，请查看控制台日志');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 flex-1">
      <div className="relative">
        <Button
          size="lg"
          variant={status === 'recording' ? "destructive" : "default"}
          className={cn(
            "h-24 w-24 rounded-full transition-all duration-300 shadow-xl flex flex-col gap-1",
            status === 'recording' ? 'animate-pulse ring-4 ring-red-100 scale-110' : 'hover:scale-105',
            status === 'uploading' && 'opacity-80 cursor-wait'
          )}
          onClick={status === 'recording' ? stopRecording : startRecording}
          disabled={status === 'uploading'}
        >
          {status === 'uploading' ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : status === 'recording' ? (
            <Square className="h-8 w-8 fill-current" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
          <span className="text-[10px] font-medium opacity-90">
            {status === 'idle' || status === 'success' || status === 'error' ? '开始录音' : status === 'recording' ? '停止录音' : '识别中'}
          </span>
        </Button>

        {status === 'recording' && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              正在录音
            </span>
          </div>
        )}
      </div>

      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            音频输入
          </span>
          <span className={cn("flex items-center gap-1", status === 'recording' ? "text-green-500" : "text-slate-400")}>
            {status === 'recording' ? <Activity className="w-3 h-3" /> : <Square className="w-3 h-3" />}
            {status === 'recording' ? '正在采集' : '空闲'}
          </span>
        </div>
        <AudioVisualizer analyser={analyser} isRecording={status === 'recording'} />
      </div>

      <div className="w-full flex-1 min-h-[120px] rounded-xl bg-slate-50 p-4 border border-slate-100 flex flex-col">
        <h3 className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          识别结果
        </h3>
        {status === 'uploading' ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-sm">正在上传并识别...</span>
          </div>
        ) : testResult ? (
          <p className="text-slate-900 whitespace-pre-wrap text-sm leading-relaxed animate-in fade-in duration-300">
            {testResult}
          </p>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-sm italic">
            暂无识别结果
          </div>
        )}
      </div>
    </div>
  );
};

export default AsrTestDialog;
