import request from '@/utils/request';

export interface GeneralChatSession {
  id: number;
  uuid: string;
  userUuid: string;
  title: string;
  provider: string;
  model: string;
  prompt?: string;
  thinkingStatus?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralChatMessage {
  id: number;
  uuid: string;
  sessionUuid: string;
  audioUrl: string | null;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  type: string;
  createdAt: string;
}

export const createSession = (title: string, provider: string, model: string, prompt?: string) => {
  return request.post('/api/general-chat/session/create', { title, provider, model, prompt }) as unknown as Promise<string>;
};

export const getUserSessions = () => {
  return request.get('/api/general-chat/sessions') as unknown as Promise<GeneralChatSession[]>;
};

export const getSessionMessages = (uuid: string) => {
  return request.get(`/api/general-chat/session/${uuid}/messages`) as unknown as Promise<GeneralChatMessage[]>;
};

export const deleteSession = (uuid: string) => {
  return request.delete(`/api/general-chat/session/${uuid}`) as unknown as Promise<boolean>;
};

export const updateSession = (uuid: string, title?: string, provider?: string, model?: string, prompt?: string, thinkingStatus?: number) => {
  return request.put(`/api/general-chat/session/${uuid}`, { title, provider, model, prompt, thinkingStatus }) as unknown as Promise<boolean>;
};

export const streamGeneralChat = async (
  sessionUuid: string,
  content: string,
  teacherUuid?: string | null,
  callback?: {
    onStart?: () => void;
    onTextReceived?: (text: string, blockNum?: number) => void;
    onProgressReceived?: (cid: string, pid: string, finished: boolean) => void;
    onAudioReceived?: (audioBase64: string, blockNum?: number) => void;
    onBlackboardReceived?: (blackboardUuid: string) => void;
    onImageReceived?: (imageUrl: string) => void;
    onMindMapReceived?: (mindMapUuid: string) => void;
    onUserAudioReceived?: (audioUrl: string) => void;
    onExerciseReceived?: (exerciseUuid: string) => void;
    onRewardReceived?: (rewardUuid: string) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
    onReceiveTotalBlockNum?: (totalBlockNum: number) => void;
  }
) => {
  try {
    const token = localStorage.getItem('token');

    let url = !!teacherUuid ? `/api/general-chat/session/${sessionUuid}/chat/audio` : `/api/general-chat/session/${sessionUuid}/chat`;
    let body: any = { content, teacherUuid };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `${token}` : ''
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    callback?.onStart?.();

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    const dispatchEvent = (jsonData: any) => {
      switch (jsonData.type) {
        case 'start':
          callback?.onStart?.();
          break;
        case 'text': {
          if (jsonData.over) {
            callback?.onReceiveTotalBlockNum?.(jsonData.blockNum);
            break;
          }
          const { index, originText, formattedText, audioBase64 } = jsonData.data || {};
          const text = formattedText || originText;
          if (text) {
            callback?.onTextReceived?.(text, index);
          }
          if (audioBase64) {
            callback?.onAudioReceived?.(audioBase64, index);
          }
          break;
        }
        case 'audioUrl': {
          const audioUrl = jsonData.data;
          callback?.onAudioReceived?.(audioUrl, 0);
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
          callback?.onBlackboardReceived?.(jsonData.data.uuid);
          break;
        case 'image':
          callback?.onImageReceived?.(jsonData.data.uuid);
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
          callback?.onError?.(new Error(jsonData.message || jsonData.errorMessage || '处理请求时发生错误'));
          break;
        case 'progress':
          const { cid, pid, finished } = jsonData.data || {};
          callback?.onProgressReceived?.(cid, pid, finished);
          break;
        default:
          if (jsonData.over) {
            callback?.onComplete?.();
          } else if (jsonData.type === 'end') {
            callback?.onComplete?.();
          }
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

        if (!dataPayload) continue;

        try {
          const data = JSON.parse(dataPayload);
          dispatchEvent(data);
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      }
    };

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
    callback?.onError?.(error as Error);
  }
};
