import request from '@/utils/request';
import { ChatMessage } from '@/types';


// 获取聊天历史
export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  return request.get('/api/chat/history', {
    params: { sessionId }
  });
};

// 清除聊天历史
export const clearHistory = async (sessionId: string): Promise<void> => {
  return request.delete('/api/chat/history', {
    params: { sessionId }
  });
};


export const sendMessageStreamNew = async (
  file: File | string,
  lessonUuid: string,
  contentType: 'AUDIO' | 'TEXT',
  teacherUuid?: string | null, // 新增TTS配置参数
  modelConfig?: { modelName: string; providerName: string }, // 新增模型配置参数
  callback?: {
    onStart?: () => void;
    onTextReceived?: (text: string, blockNum?: number) => void;
    onProgressReceived?: (cid: string, pid: string, finished: boolean) => void;
    onAudioReceived?: (audioBase64: string, blockNum?: number) => void;
    onBlackboardReceived?: (blackboardUuid: string, title?: string) => void;
    onImageReceived?: (imageUrl: string, title?: string) => void;
    onMindMapReceived?: (mindMapUuid: string) => void;
    onUserAudioReceived?: (audioUrl: string) => void;
    onExerciseReceived?: (exerciseUuid: string) => void;
    onRewardReceived?: (rewardUuid: string) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
    onReceiveTotalBlockNum?: (totalBlockNum: number) => void;
  }
) => {
  const formData = new FormData();

  if (typeof file === 'string') {
    formData.append('textContent', file);
  } else {
    formData.append('audioFile', file);
  }

  formData.append('lessonUuid', lessonUuid);
  formData.append('contentType', contentType === 'AUDIO' ? 'audio' : 'text');

  // 添加TTS配置参数
  if (teacherUuid) {
    formData.append('teacherUuid', teacherUuid);
  }

  // 添加模型配置参数
  if (modelConfig) {
    formData.append('modelName', modelConfig.modelName);
    formData.append('providerName', modelConfig.providerName);
  }

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': localStorage.getItem('token') || ''
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    let buffer = '';

    const decoder = new TextDecoder();

    const dispatchEvent = (jsonData: any) => {
      console.log('Received SSE event:', jsonData);
      switch (jsonData.type) {
        case 'start':
          callback?.onStart?.();
          break;
        case 'text': {
          if (jsonData.over) {
            callback?.onReceiveTotalBlockNum?.(jsonData.blockNum);
            break;
          }
          const { index, originText, audioBase64 } = jsonData.data || {};
          if (originText) {
            callback?.onTextReceived?.(originText, index);
          }
          if (audioBase64) {
            callback?.onAudioReceived?.(audioBase64, index);
          }
          break;
        }
        case 'user_audio': {
          const audioUrl = jsonData.content || '';
          if (audioUrl) {
            callback?.onUserAudioReceived?.(audioUrl);
          }
          break;
        }
        case 'blackboard':
          callback?.onBlackboardReceived?.(jsonData.data.uuid, jsonData.data.title);
          break;
        case 'image':
          callback?.onImageReceived?.(jsonData.data.uuid, jsonData.data.title);
          break;
        case 'mindmap':
          callback?.onMindMapReceived?.(jsonData.data.uuid);
          break;
        case 'exercise':
          const exerciseUuid = jsonData.data;
          callback?.onExerciseReceived?.(exerciseUuid);
          break;
        case 'reward':
          callback?.onRewardReceived?.(jsonData.data.uuid);
          break;
        case 'end':
          callback?.onComplete?.();
          break;
        case 'error':
          callback?.onError?.(new Error(jsonData.data));
          break;
        case 'progress':
          const { cid, pid, finished } = jsonData.data || {};
          callback?.onProgressReceived?.(cid, pid, finished);
          break;
        default:
          console.warn('未知事件类型:', jsonData);
      }
    };

    const flushBuffer = () => {
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const rawEvent of events) {
        const lines = rawEvent.split('\n').map(line => line.trim());
        let dataPayload = '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            dataPayload += line.slice(5).trimStart();
          }
        }

        if (!dataPayload) {
          continue;
        }

        try {
          const jsonData = JSON.parse(dataPayload);
          dispatchEvent(jsonData);
        } catch (error) {
          console.error('解析SSE事件失败:', error, dataPayload);
        }
      }
    };

    // 读取数据流
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        flushBuffer();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      flushBuffer();
    }
  } catch (error) {
    callback?.onError?.(error instanceof Error ? error : new Error('网络请求失败'));
  }
};