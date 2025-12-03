import React, {useEffect, useState, ReactNode} from 'react';
import {toast} from 'sonner';
import {ChatMessage} from "@/types/ChatMessage.ts";
import {
  GeneralChatMessage,
  GeneralChatSession,
  getSessionMessages,
  createSession,
  streamGeneralChat
} from '@/api/general-chat';
import {ChatHistoryContext} from '@/pages/chat/context/ChatHistoryContext';
import {ClassStatusContext} from '@/pages/chat/context/ClassStatusContext';
import {TeacherInfo, getEnabledTeachers} from "@/api/teacher";
import {useChatViewMode, useSelectedTeacher} from '@/contexts/GlobalSettingsContext';

interface GeneralChatProviderProps {
  children: ReactNode;
  currentSession: GeneralChatSession | null;
  onSessionCreated?: (session: GeneralChatSession) => void;
  isTeacherMode?: boolean | null; // 是否为真人对话模式
  selectedTeacherUuid?: string | null; // 当前选择的教师ID
}

export const GeneralChatProvider = ({children, currentSession, onSessionCreated, isTeacherMode, selectedTeacherUuid}: GeneralChatProviderProps) => {
  // Chat History State
  const [isLoading, setIsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [scrollToBottom, setScrollToBottom] = useState<(() => void) | null>(null);
  const [autoPlayMessageId, setAutoPlayMessageId] = useState<string | null>(null);
  const [activeMindMapUuid, setActiveMindMapUuid] = useState<string | null>(null);

  const [voiceTeachers, setVoiceTeachers] = useState<TeacherInfo[]>([]);
  const [isTeachersLoaded, setIsTeachersLoaded] = useState(false);

  // Load Providers (Models) & Voice Teachers
  useEffect(() => {
    const loadData = async () => {
      try {
        // 2. Load Voice Teachers (for TTS)
        const teachers = await getEnabledTeachers();
        setVoiceTeachers(teachers);

      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setIsTeachersLoaded(true);
      }
    };
    loadData();
  }, []);

  // Load Messages
  useEffect(() => {
    if (currentSession?.uuid) {
      if (currentSession.uuid === 'draft') {
        setChatHistory([]);
      } else if (!sending) {
        loadMessages(currentSession.uuid);
      }
    } else {
      setChatHistory([]);
    }
  }, [currentSession?.uuid]);

  const loadMessages = async (uuid: string) => {
    setIsLoading(true);
    try {
      const data = await getSessionMessages(uuid);
      if (data) {
        setChatHistory(data.map(convertToChatMessage));
      }
    } catch (error) {
      console.error('加载消息失败', error);
      toast.error('加载消息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getTeacherUuid = (): string | null => {
    if(isTeacherMode && !! selectedTeacherUuid){
      return selectedTeacherUuid;
    }
    return null;
  }

  const convertToChatMessage = (msg: GeneralChatMessage): ChatMessage => {
    return {
      id: msg.uuid,
      uuid: msg.uuid,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      contentType: 'text',
      audioUrl: msg.audioUrl,
      blackboardUuid: '',
      imageUuid: '',
      exerciseUuid: '',
      createdAt: msg.createdAt,
      done: true,
      isLoading: false,
      audioType: 'url',
      audioBlocks: new Map(),
      audioBlocksLength: 0,
      textBlocks: new Map([[0, msg.content]]),
      textBlocksLength: 1,
      imageUrl: '',
      exerciseData: null,
    };
  };

  const sendMessage = async (content: string, contentType: string | null) => {
    if (!content.trim() || !currentSession || sending) return;

    const tempUserUuid = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      uuid: tempUserUuid,
      role: 'user',
      content: content,
      contentType: 'text',
      audioUrl: '',
      blackboardUuid: '',
      imageUuid: '',
      exerciseUuid: '',
      createdAt: new Date().toISOString(),
      done: true,
      isLoading: false,
      audioType: 'url',
      audioBlocks: new Map(),
      audioBlocksLength: 0,
      textBlocks: new Map([[0, content]]),
      textBlocksLength: 1,
      imageUrl: '',
      exerciseData: null,
    };

    setChatHistory(prev => [...prev, userMsg]);
    setSending(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      uuid: `temp-${aiMsgId}`,
      role: 'assistant',
      content: '',
      contentType: 'text',
      audioUrl: '',
      blackboardUuid: '',
      imageUuid: '',
      exerciseUuid: '',
      createdAt: new Date().toISOString(),
      done: false,
      isLoading: true,
      audioType: 'stream', // Use stream for audio
      audioBlocks: new Map(),
      audioBlocksLength: 0,
      textBlocks: new Map(),
      textBlocksLength: 0,
      imageUrl: '',
      exerciseData: null,
    };

    setChatHistory(prev => [...prev, aiMsg]);

    let sessionUuid = currentSession.uuid;

    try {
      // Handle Draft Session
      if (sessionUuid === 'draft') {
        const title = content.length > 10 ? content.substring(0, 10) + '...' : content;
        console.log('Creating session with:', {title, provider: currentSession.provider, model: currentSession.model, prompt: currentSession.prompt});

        const newUuid = await createSession(title, currentSession.provider, currentSession.model, currentSession.prompt);
        console.log('Session created, new UUID:', newUuid);

        if (!newUuid || typeof newUuid !== 'string') {
          throw new Error('Invalid session UUID returned: ' + JSON.stringify(newUuid));
        }

        sessionUuid = newUuid;

        // Small delay to ensure DB consistency
        await new Promise(resolve => setTimeout(resolve, 500));

        if (onSessionCreated) {
          onSessionCreated({
            ...currentSession,
            uuid: newUuid,
            title: title
          });
        }
      }

      streamGeneralChat(sessionUuid, content, getTeacherUuid(), {
        onStart: () => {
          // setSending(false); // 保持发送状态直到完成
        },
        onTextReceived: (text, blockNum = 0) => {
          setChatHistory(prev => prev.map(m => {
            if (m.id === aiMsgId) {
              const newTextBlocks = new Map(m.textBlocks);
              const currentBlockText = newTextBlocks.get(blockNum) || '';
              newTextBlocks.set(blockNum, currentBlockText + text);
              
              // Reconstruct full content from all blocks for display
              const fullContent = Array.from(newTextBlocks.values()).join('');

              return {
                ...m,
                content: fullContent,
                textBlocks: newTextBlocks,
                isLoading: false
              };
            }
            return m;
          }));
        },
        onAudioReceived: (audioUrl, blockNum = 0) => {
          console.log('Received audio block:', blockNum, audioUrl);
          setChatHistory(prev => prev.map(m => {
            if (m.id === aiMsgId) {
              const newAudioBlocks = new Map(m.audioBlocks);
              newAudioBlocks.set(blockNum, audioUrl);
              return {
                ...m,
                audioBlocks: newAudioBlocks,
                audioBlocksLength: newAudioBlocks.size,
              };
            }
            return m;
          }));
        },
        onBlackboardReceived: (uuid) => {
          setChatHistory(prev => prev.map(m => m.id === aiMsgId ? { ...m, blackboardUuid: uuid } : m));
        },
        onImageReceived: (uuid) => {
          setChatHistory(prev => prev.map(m => m.id === aiMsgId ? { ...m, imageUuid: uuid } : m));
        },
        onMindMapReceived: (uuid) => {
          // @ts-ignore
          setChatHistory(prev => prev.map(m => m.id === aiMsgId ? { ...m, mindMapUuid: uuid } : m));
          setActiveMindMapUuid(uuid);
        },
        onExerciseReceived: (uuid) => {
          setChatHistory(prev => prev.map(m => m.id === aiMsgId ? { ...m, exerciseUuid: uuid } : m));
        },
        onUserAudioReceived: (url) => {
          setChatHistory(prev => prev.map(m => m.id === userMsg.id ? { ...m, audioUrl: url } : m));
        },
        onError: (error) => {
          console.error('Stream error:', error);
          toast.error(`AI错误: ${error.message}`);
          setChatHistory(prev => prev.map(m =>
            m.id === aiMsgId ? {...m, status: 'error', done: true} : m
          ));
          setSending(false);
        },
        onComplete: () => {
          setChatHistory(prev => prev.map(m =>
            m.id === aiMsgId ? {...m, done: true} : m
          ));
          setSending(false);
        }
      });

    } catch (error) {
      console.error('发送消息失败', error);
      toast.error('发送消息失败');
      setChatHistory(prev => prev.map(m =>
        m.id === aiMsgId ? {...m, status: 'error'} : m
      ));
      setSending(false);
    }
  };

  const chatHistoryContextValue = {
    isLoading,
    chatHistory,
    clearHistory: () => setChatHistory([]),
    getAllBlackboards: () => [],
    getAllMindMaps: () => [],
    sendMessage,
    sendAudioFile: () => {
    },
    sending,
    autoPlayMessageId,
    setAutoPlayMessageId,
    scrollToBottom,
    setScrollToBottom,
    updateMessage: () => {
    },
    retryMessage: () => {
    },
    activeMindMapUuid,
    setActiveMindMapUuid,
    modelConfig: null,
    setModelConfig: () => {
    },
  };

  const classStatusContextValue = {
    lessonInfo: null,
    isLoading: false,
    currentChapter: 0,
    currentPart: 0,
    chapterUuid: null,
    lessonUuid: null,
    courseUuid: null,
    classCompleted: false,
    handleProgress: () => {
    },
    availableTeachers: voiceTeachers,
    isTeachersLoaded,
  };

  return (
    <ClassStatusContext.Provider value={classStatusContextValue}>
      <ChatHistoryContext.Provider value={chatHistoryContextValue}>
        {children}
      </ChatHistoryContext.Provider>
    </ClassStatusContext.Provider>
  );
};
