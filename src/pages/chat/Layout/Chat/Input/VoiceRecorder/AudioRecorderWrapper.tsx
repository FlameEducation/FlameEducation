import React, { useEffect, useState } from 'react';
import { PhoneRecorder } from './PhoneRecorder';
import { WalkieTalkieRecorder } from './WalkieTalkieRecorder';
import { TextInput } from './TextInput';
import { useAudioPlayStatus } from '../../../../context/AudioContext';
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext";
import { usePhoneSilenceDuration } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Phone, 
  Radio, 
  Keyboard,
  User,
  Volume2
} from 'lucide-react';
import { TeacherInfo } from '@/api/teacher';

export type InputMode = 'phone' | 'walkie-talkie' | 'text';

interface AudioRecorderWrapperProps {
  onSendAudio: (file: File) => void | Promise<void>;
  onAudioData?: (data: ArrayBuffer) => void;
  inputMode?: 'phone' | 'walkie-talkie' | 'text';
  currentTeacher?: TeacherInfo | null;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  realtimeText?: string;
}

export const AudioRecorderWrapper: React.FC<AudioRecorderWrapperProps> = ({
  onSendAudio,
  onAudioData,
  inputMode: externalInputMode,
  currentTeacher,
  onStartRecording: onStartRecordingProp,
  onStopRecording,
  realtimeText
}) => {
  const [internalInputMode, setInternalInputMode] = useState<InputMode>(() => {
    const saved = localStorage.getItem('chat-input-mode');
    return (saved as InputMode) || 'phone';
  });

  // 使用外部传入的模式，如果没有则使用内部状态
  const inputMode = externalInputMode || internalInputMode;
  const setInputMode = externalInputMode ? () => {} : setInternalInputMode;

  const { isPlaying, stop } = useAudioPlayStatus();
  const { sending, isLoading, sendMessage } = useChatHistoryContext();
  const [phoneSilenceDuration] = usePhoneSilenceDuration();

  // 保存模式到本地存储
  useEffect(() => {
    localStorage.setItem('chat-input-mode', inputMode);
  }, [inputMode]);

  const onStartRecording = () => {
    if (isPlaying) {
      console.log("检测到音频正在播放，暂停播放");
      stop();
    }
    onStartRecordingProp?.();
  };

  // 处理音频发送 - 使用File对象而不是base64
  const handleSendAudio = async (file: File) => {
    try {
      if (sending) return;
      if (isLoading) return;
      
      // 直接传递File对象给API层处理FormData
      const result = onSendAudio(file);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error("发送音频时出错:", error);
    }
  };

  // 发送文本消息
  const handleSendText = async (text: string) => {
    if (!text.trim() || isLoading || sending) return;
    
    try {
      const messageData = currentTeacher ? {
        teacherUuid: currentTeacher.uuid
      } : {};
      await sendMessage(text, 'TEXT', messageData);
    } catch (error) {
      console.error("发送文本时出错:", error);
    }
  };

  // 模式配置 - 使用动态的静音等待时间
  const modeConfig = {
    phone: {
      icon: Phone,
      label: '电话模式',
      description: `${phoneSilenceDuration}s静音自动发送`,
      color: 'bg-blue-500 hover:bg-blue-600',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    'walkie-talkie': {
      icon: Radio,
      label: '对讲机',
      description: '按住录音',
      color: 'bg-orange-500 hover:bg-orange-600',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    text: {
      icon: Keyboard,
      label: '文字模式',
      description: '文字输入',
      color: 'bg-green-500 hover:bg-green-600',
      badgeColor: 'bg-green-100 text-green-800'
    }
  };

  // 获取当前模式配置，添加默认值防护
  const currentModeConfig = modeConfig[inputMode] || modeConfig.phone;

  // 计算禁用状态 - 发送时禁止切换模式
  const isModeChangeDisabled = isLoading || sending;

  return (
    <div className="w-full">
      {inputMode === 'text' ? (
        /* 文字输入模式 */
        <TextInput
          onSendText={handleSendText}
          isLoading={isLoading}
          isLoadingUI={isLoading || sending}
        />
      ) : inputMode === 'phone' ? (
        /* 电话模式 - 关键：始终保持挂载 */
        <PhoneRecorder
          onSendAudio={handleSendAudio}
          onAudioData={onAudioData}
          isLoading={isLoading}
          isPaused={isPlaying || sending} // sending时暂停人声检测，禁止发送
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          isLoadingUI={isLoading || sending}
          realtimeText={realtimeText}
        />
      ) : (
        /* 对讲机模式 */
        <WalkieTalkieRecorder
          onSendAudio={handleSendAudio}
          onAudioData={onAudioData}
          isLoading={isLoading}
          isPaused={isPlaying || sending}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          isLoadingUI={isLoading || sending}
          realtimeText={realtimeText}
        />
      )}
    </div>
  );
};

AudioRecorderWrapper.displayName = 'AudioRecorderWrapper'; 