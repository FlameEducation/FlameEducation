import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AudioRecorderWrapper } from './VoiceRecorder/AudioRecorderWrapper';
import { useChatHistoryContext } from '@/pages/chat/context/ChatHistoryContext';
import { useClassStatusContext } from '@/pages/chat/context/ClassStatusContext';
import { LessonSettlementButton } from '@/pages/chat/components/LessonSettlementButton';
import { TeacherInfo } from '@/api/teacher';
import { recognizeSpeech, getAsrWebSocketUrl } from '@/api/asr-config';
import { getAsrActiveConfig } from '@/api/asr-active-config';
import { useToast } from '@/components/ui/use-toast';

interface InputSwitcherProps {
  inputMode?: 'phone' | 'walkie-talkie' | 'text';
  currentTeacher?: TeacherInfo | null;
}

export const InputSwitcher: React.FC<InputSwitcherProps> = ({
  inputMode,
  currentTeacher
}) => {
  const {
    isLoading,
    sending,
    sendMessage,
    sendAudioFile
  } = useChatHistoryContext();
  
  const { toast } = useToast();
  const { classCompleted } = useClassStatusContext();

  // 流式 ASR 相关状态
  const [realtimeText, setRealtimeText] = useState('');
  const realtimeTextRef = useRef(''); // 新增 ref 用于在回调中获取最新值
  const wsRef = useRef<WebSocket | null>(null);
  const isStreamingRef = useRef(false);
  const finalTextResolverRef = useRef<((text: string) => void) | null>(null);
  const activeProviderRef = useRef<string>('');

  // 同步 ref
  useEffect(() => {
    realtimeTextRef.current = realtimeText;
  }, [realtimeText]);

  // 预加载 ASR 配置
  useEffect(() => {
    getAsrActiveConfig().then(config => {
      if (config?.activeProvider) {
        activeProviderRef.current = config.activeProvider;
      }
    }).catch(console.error);
  }, []);

  const handleStartRecording = async () => {
    // 重新获取一次配置，确保最新
    try {
      const config = await getAsrActiveConfig();
      if (config?.activeProvider) {
        activeProviderRef.current = config.activeProvider;
      }
    } catch (e) {
      console.error(e);
    }

    // 如果是 doubao，启用流式
    if (activeProviderRef.current === 'doubao') {
      isStreamingRef.current = true;
      setRealtimeText('');
      finalTextResolverRef.current = null;
      
      try {
        const url = getAsrWebSocketUrl();
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
          console.log('ASR WebSocket connected');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // 处理错误消息
            if (data.error) {
              console.error('ASR Error:', data.error);
              if (finalTextResolverRef.current) {
                // 如果有错误，直接返回当前已有的文本，避免死等
                finalTextResolverRef.current(realtimeTextRef.current); 
                finalTextResolverRef.current = null;
              }
              return;
            }

            if (data.text) {
              setRealtimeText(data.text);
              if (data.isFinal) {
                if (finalTextResolverRef.current) {
                  finalTextResolverRef.current(data.text);
                  finalTextResolverRef.current = null;
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse ASR message', e);
          }
        };
        
        ws.onerror = (e) => {
          console.error('ASR WebSocket error', e);
          isStreamingRef.current = false;
          // 出错时，如果有等待的 Promise，也需要解决它
          if (finalTextResolverRef.current) {
            finalTextResolverRef.current(realtimeTextRef.current);
            finalTextResolverRef.current = null;
          }
          ws.close();
        };

        ws.onclose = () => {
           // 连接关闭时，如果有等待的 Promise，也需要解决它
           if (finalTextResolverRef.current) {
            finalTextResolverRef.current(realtimeTextRef.current);
            finalTextResolverRef.current = null;
          }
        };
        
        wsRef.current = ws;
      } catch (e) {
        console.error('Failed to create WebSocket', e);
        isStreamingRef.current = false;
      }
    } else {
      isStreamingRef.current = false;
    }
  };

  const handleStopRecording = () => {
    if (isStreamingRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('STOP');
    }
  };

  const handleAudioData = (data: ArrayBuffer) => {
    if (isStreamingRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  };

  // 发送音频文件 - 改为先识别再发送文本
  const handleSendAudio = async (file: File) => {
    try {
      if (sending || isLoading) return;
      
      let text = '';

      if (isStreamingRef.current) {
        // 流式模式：等待最终结果
        text = await new Promise<string>((resolve) => {
          // 如果 WebSocket 已经关闭或者出错，直接返回当前的 realtimeText
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            resolve(realtimeTextRef.current);
            return;
          }

          finalTextResolverRef.current = resolve;
          // 设置超时，防止死等 (3秒)
          setTimeout(() => {
            if (finalTextResolverRef.current) {
              resolve(realtimeTextRef.current); // 超时返回当前文本
              finalTextResolverRef.current = null;
            }
          }, 3000);
        });

        // 清理 WebSocket
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        isStreamingRef.current = false;
        setRealtimeText('');

      } else {
        // 非流式模式：调用 HTTP 接口
        text = await recognizeSpeech(file);
      }
      
      if (!text || !text.trim()) {
        toast({
          variant: "destructive",
          title: "识别失败",
          description: "未能识别到有效的语音内容"
        });
        return;
      }

      // 2. 发送识别后的文本
      await sendMessage(text, 'TEXT');
      
    } catch (error) {
      console.error('语音识别或发送失败:', error);
      toast({
        variant: "destructive",
        title: "操作失败",
        description: error instanceof Error ? error.message : "语音识别服务异常"
      });
      
      // 确保清理状态
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      isStreamingRef.current = false;
      setRealtimeText('');
    }
  };

  // 如果课程已完成，显示课程结算按钮
  if (classCompleted) {
    return (
      <div className="w-full">
        <LessonSettlementButton />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* {isLoading && (
        <div className="flex items-center justify-center gap-2 py-1 text-xs text-gray-500 mb-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>处理中...</span>
        </div>
      )} */}
      
      <AudioRecorderWrapper 
        onSendAudio={handleSendAudio}
        onAudioData={handleAudioData}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        realtimeText={realtimeText}
        inputMode={inputMode}
        currentTeacher={currentTeacher}
      />
    </div>
  );
}; 