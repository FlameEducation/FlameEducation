import {createContext, useContext, useEffect, useState, ReactNode, useCallback} from 'react';
import {useToast} from '@/components/ui/use-toast';
import api from "@/api";
import {useSearchParams} from "react-router-dom";
import {ChatMessage} from "@/types/ChatMessage.ts";
import {useEventBus} from '@/pages/chat/context/EventBusContext.tsx';
import { useChatViewMode, useTTSConfig } from '@/contexts';
import { useBlackboardContext } from './BlackboardContext';


// 创建聊天历史记录上下文
export const ChatHistoryContext = createContext<{
  isLoading: boolean;
  chatHistory: ChatMessage[];
  clearHistory: () => void;
  getAllBlackboards: () => { uuid: string, title: string }[];
  getAllMindMaps: () => string[];
  getAllImages: () => { uuid: string, url: string, title: string }[];
  sendMessage: (data: string, type: "AUDIO" | "TEXT") => void;
  sendAudioFile: (file: File) => void;
  sending: boolean;
  autoPlayMessageId: string | null;
  setAutoPlayMessageId: (id: string | null) => void;
  scrollToBottom: (() => void) | null;
  setScrollToBottom: (scrollFn: (() => void) | null) => void;
  updateMessage: (messageId: string, newMessage: Partial<ChatMessage>) => void; // 添加 updateMessage
  retryMessage: (messageId: string) => void; // 添加 retryMessage
  activeMindMapUuid: string | null;
  setActiveMindMapUuid: (uuid: string | null) => void;
  activeBlackboardUuid: string | null;
  setActiveBlackboardUuid: (uuid: string | null) => void;
  activeImageUuid: string | null;
  setActiveImageUuid: (uuid: string | null) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (isOpen: boolean) => void;
  modelConfig: { modelName: string; providerName: string } | null;
  setModelConfig: (config: { modelName: string; providerName: string } | null) => void;
}>({
  isLoading: false,
  chatHistory: [],
  clearHistory: () => {
  },
  getAllBlackboards: () => {
    return []
  },
  getAllMindMaps: () => {
    return []
  },
  getAllImages: () => {
    return []
  },
  sending: false,
  sendMessage: (data, type) => {
  },
  sendAudioFile: (file) => {
  },
  autoPlayMessageId: null,
  setAutoPlayMessageId: (id) => {
  },
  scrollToBottom: null,
  setScrollToBottom: (scrollFn) => {
  },
  updateMessage: () => {}, // 添加默认实现
  retryMessage: () => {}, // 添加默认实现
  activeMindMapUuid: null,
  setActiveMindMapUuid: () => {},
  activeBlackboardUuid: null,
  setActiveBlackboardUuid: () => {},
  activeImageUuid: null,
  setActiveImageUuid: () => {},
  isRightPanelOpen: false,
  setIsRightPanelOpen: () => {},
  modelConfig: null,
  setModelConfig: () => {},
});

// 使用聊天历史记录的自定义Hook
export const useChatHistoryContext = () => useContext(ChatHistoryContext)

interface ChatHistoryProviderProps {
  children: ReactNode;
  onExerciseReceived?: (messageId: string, uuid: string, type?: string, questionData?: any) => void;
  isTeacherMode?: boolean; // 是否为真人对话模式
  selectedteacherUuid?: string; // 当前选择的教师ID
}

export const ChatHistoryProvider = ({children, onExerciseReceived, isTeacherMode = false, selectedteacherUuid}: ChatHistoryProviderProps) => {


  const {toast} = useToast();
  const eventBus = useEventBus();
  // 初始设为true以避免首次挂载时出现“开始课程”等组件闪现
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [autoPlayMessageId, setAutoPlayMessageId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [scrollToBottom, setScrollToBottom] = useState<(() => void) | null>(null);
  const [activeMindMapUuid, setActiveMindMapUuid] = useState<string | null>(null);
  const [activeBlackboardUuid, setActiveBlackboardUuid] = useState<string | null>(null);
  const [activeImageUuid, setActiveImageUuid] = useState<string | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [modelConfig, setModelConfig] = useState<{ modelName: string; providerName: string } | null>(null);

  const { loadAllBlackboards } = useBlackboardContext();

  const [searchParams] = useSearchParams();
  const lessonUuid = searchParams.get('lessonUuid') || '';

  // 使用新的Context hooks
  const [chatViewMode] = useChatViewMode();
  const needTts = chatViewMode === 'teacher';
  useEffect(() => {
  }, [chatHistory]);

  // 监听聊天记录变化，自动加载小黑板数据
  useEffect(() => {
    if (chatHistory.length === 0) return;
    
    const uuids = chatHistory
      .filter(item => item.blackboardUuid)
      .map(item => item.blackboardUuid as string);
      
    if (uuids.length > 0) {
      // 去重
      const uniqueUuids = Array.from(new Set(uuids));
      loadAllBlackboards(uniqueUuids);
    }
  }, [chatHistory, loadAllBlackboards]);


  const getAllBlackboards = (): { uuid: string, title: string }[] => {
    if (chatHistory.length === 0) return [];

    const blackboards: { uuid: string, title: string }[] = [];
    const seenUuids = new Set<string>();
    chatHistory.forEach(item => {
      if (item.blackboardUuid && !seenUuids.has(item.blackboardUuid)) {
        blackboards.push({ uuid: item.blackboardUuid, title: item.blackboardTitle || '未命名小黑板' });
        seenUuids.add(item.blackboardUuid);
      }
    });
    return blackboards;
  }

  const getAllMindMaps = (): string[] => {
    if (chatHistory.length === 0) return [];

    const mindMapUuids = new Set<string>();
    chatHistory.forEach(item => {
      if (item.mindMapUuid) {
        mindMapUuids.add(item.mindMapUuid);
      }
    });
    return Array.from(mindMapUuids);
  }

  const getAllImages = (): { uuid: string, url: string, title: string }[] => {
    if (chatHistory.length === 0) return [];

    const images: { uuid: string, url: string, title: string }[] = [];
    const seenUuids = new Set<string>();
    chatHistory.forEach(item => {
      if (item.imageUuid && !seenUuids.has(item.imageUuid)) {
        images.push({ uuid: item.imageUuid, url: item.imageUrl || '', title: item.imageTitle || '未命名图片' });
        seenUuids.add(item.imageUuid);
      }
    });
    return images;
  }

  const clearHistory = () => {
    setIsLoading(true);
    api.clearHistory(lessonUuid).then(res => {
      setChatHistory([]);
      console.log('清除聊天记录:', res);
      toast({
        title: "成功",
        description: "清除聊天记录成功",
        variant: "default"
      });
    })
      .finally(() => {
        setIsLoading(false);
      })
  }

  const updateMessage = (messageId: string, newMessage: Partial<ChatMessage>) => {
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[index] = {
          ...updatedMessages[index],
          ...newMessage,
        };
        return updatedMessages;
      }
      return prev;
    });
  }

  const addImageShow = (messageId: string, imageUuid: string, title?: string) => {
    console.log("添加图片显示:", messageId, imageUuid);
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[index].imageUuid = imageUuid;
        if (title) updatedMessages[index].imageTitle = title;
        return updatedMessages;
      }
      return prev;
    });
  }

  const addBlackboard = (messageId: string, blackboardUuid: string, title?: string) => {
    console.log("添加黑板:", messageId, blackboardUuid);
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[index].blackboardUuid = blackboardUuid;
        if (title) updatedMessages[index].blackboardTitle = title;
        return updatedMessages;
      }
      return prev;
    });
  }

  const addExercise = (messageId: string, uuid: string, type?: string, questionData?: any) => {
    console.log("添加练习题:", messageId, uuid, type);

    // 更新聊天历史记录中的练习题信息
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[index].exerciseUuid = uuid;
        updatedMessages[index].exerciseData = {
          uuid: uuid,
          type: type,
          questionData: questionData
        };
        return updatedMessages;
      }
      return prev;
    });
  }

  const setAudioUrl = (messageId: string, audioUrl: string) => {
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[index].audioUrl = audioUrl;
        return updatedMessages;
      }
      return prev;
    });
  }

  const addTextBlock = (messageId: string, blockNum: number, text: string) => {
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        const message = updatedMessages[index];
        if (message.textBlocks) {
          message.textBlocks.set(blockNum, text);
        } else {
          message.textBlocks = new Map<number, string>();
          message.textBlocks.set(blockNum, text);
        }
        message.textBlocksLength = message.textBlocks.size;
        // 将block的内容聚合起来，设置为content的值
        // 必须按key排序后拼接，防止乱序到达导致content错乱
        let content = "";
        const sortedKeys = Array.from(message.textBlocks.keys()).sort((a, b) => a - b);
        sortedKeys.forEach(key => {
          content += message.textBlocks.get(key) || "";
        });
        message.content = content;
        return updatedMessages;
      }
      return prev;
    });
  }

  const addAudioBlock = (messageId: string, blockNum: number, audioUrl: string) => {
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        // 必须浅拷贝消息对象，否则React可能无法检测到深层变化
        const message = { ...updatedMessages[index] };
        
        if (message.audioBlocks) {
          // 必须浅拷贝Map
          message.audioBlocks = new Map(message.audioBlocks);
          message.audioBlocks.set(blockNum, audioUrl);
        } else {
          message.audioBlocks = new Map<number, string>();
          message.audioBlocks.set(blockNum, audioUrl);
        }
        message.audioBlocksLength = message.audioBlocks.size;
        
        updatedMessages[index] = message;
        return updatedMessages;
      }
      return prev;
    });
  }

  const setMessageDone = (messageId: string) => {
    console.log("更新消息状态:", messageId);
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[index].done = true;
        return updatedMessages;
      }
      return prev;
    });
  }

  const addReward = (messageId: string, rewardUuid: string) => {
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[index].rewardUuid = rewardUuid;
        return updatedMessages;
      }
      return prev;
    });
  }

  const addMindMap = (messageId: string, mindMapUuid: string) => {
    setChatHistory(prev => {
      const index = prev.findIndex(item => item.uuid === messageId);
      if (index !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[index].mindMapUuid = mindMapUuid;
        return updatedMessages;
      }
      return prev;
    });
  }


  const addMessage = (message: any) => {
    setChatHistory(prev => [...prev, message]);
  }

  // 回滚消息：移除指定UUID的消息
  const rollbackMessages = (userMessageUuid: string, aiMessageUuid: string) => {
    setChatHistory(prev => 
      prev.filter(msg => msg.uuid !== userMessageUuid && msg.uuid !== aiMessageUuid)
    );
  }


  const sendMessage = (data: string, audioType: "AUDIO" | "TEXT") => {

    const userMessageUuid = Math.random().toString(36).substring(2, 15);
    const aiMessageUuid = Math.random().toString(36).substring(2, 15);
    setSending(true);

    const userMessage = {
      uuid: userMessageUuid,
      createdAt: new Date().toISOString(),
      role: "user",
      contentType: audioType,
      content: data,
      status: 'sending' as const // 初始状态
    }

    const aiMessage = {
      uuid: aiMessageUuid,
      createdAt: new Date().toISOString(),
      role: "assistant",
      contentType: "TEXT",
      textBlocks: new Map<number, string>(),
      audioBlocks: new Map<number, string>(),
      done: false,
      audioType: "stream",
    }

    function restoreNewlines(str: any) {
      if (typeof str !== 'string') {
        return str; // 或者抛出错误，取决于你如何处理非字符串输入
      }
      return str.replace(/\\n/g, '\n'); // 替换所有 \\n\\n 为 \n\n
    }

    // 覆盖上一条失败消息的逻辑
    setChatHistory(prev => {
      let newHistory = [...prev];
      const lastMsg = newHistory[newHistory.length - 1];
      // 如果最后一条是发送失败的用户消息，则移除它（覆盖）
      if (lastMsg && lastMsg.role === 'user' && lastMsg.status === 'error') {
        newHistory.pop();
      }
      newHistory.push(userMessage as any);
      return newHistory;
    });

    // 发送消息后立刻滚动到底部
    if (scrollToBottom) {
      setTimeout(() => scrollToBottom(), 100);
    }

    const teacherUuidForAPI = isTeacherMode ? selectedteacherUuid : null;
    api.sendMessageStreamNew(data, lessonUuid, audioType, teacherUuidForAPI, modelConfig || undefined, {
      onStart: () => {
        addMessage(aiMessage);
        // AI开始回复时也滚动到底部
        if (scrollToBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      },
      onTextReceived: (text: string, blockNum?: number) => {
        addTextBlock(aiMessageUuid, blockNum || 0, restoreNewlines(text));
      },
      onAudioReceived: (audioBase64: string, blockNum?: number) => {
        // 移除自动播放，让用户手动控制
        // setAutoPlayMessageId(aiMessageUuid);
        addAudioBlock(aiMessageUuid, blockNum || 0, audioBase64)
      },
      onProgressReceived: (cid: any, pid: any, finished: boolean) => {
        eventBus.emit('progress', { cid, pid, finished });
      },
      onBlackboardReceived: (blackboardUuid: string, title?: string) => {
        addBlackboard(aiMessageUuid, blackboardUuid, title)
      },
      onImageReceived: (imageUuid: string, title?: string) => {
        addImageShow(aiMessageUuid, imageUuid, title)
      },
      onMindMapReceived: (mindMapUuid: string) => {
        addMindMap(aiMessageUuid, mindMapUuid)
      },
      onExerciseReceived: (uuid: string) => {
        addExercise(aiMessageUuid, uuid);
        // 同时调用外部传入的回调
        onExerciseReceived?.(aiMessageUuid, uuid);
      },
      onUserAudioReceived: (audioUrl: string) => {
        setAudioUrl(userMessageUuid, audioUrl);
      },
      onRewardReceived: (rewardUuid: string) => {
        addReward(aiMessageUuid, rewardUuid)
      },
      onReceiveTotalBlockNum: (totalBlockNum: number) => {
        setChatHistory(prev => {
          const index = prev.findIndex(item => item.uuid === aiMessageUuid);
          if (index !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[index].totalAudioBlocks = totalBlockNum;
            return updatedMessages;
          }
          return prev;
        });
      },
      onError: (error: Error) => {
        setSending(false);
        setMessageDone(aiMessageUuid);
        console.error('发送消息错误:', error);
        
        // 移除 AI 消息占位符
        setChatHistory(prev => prev.filter(msg => msg.uuid !== aiMessageUuid));
        
        // 更新用户消息状态为 error
        updateMessage(userMessageUuid, { status: 'error' });
        
        toast({
          title: "发送失败",
          description: error.message,
          variant: "destructive"
        });
      },
      onComplete: () => {
        setSending(false);
        setMessageDone(aiMessageUuid);
        // 更新用户消息状态为 success
        updateMessage(userMessageUuid, { status: 'success' });
      }

    })

  }

  // 发送音频文件 - 直接传递File对象
  const sendAudioFile = useCallback((file: File) => {
    const userMessageUuid = Math.random().toString(36).substring(2, 15);
    const aiMessageUuid = Math.random().toString(36).substring(2, 15);
    setSending(true);

    const userMessage = {
      uuid: userMessageUuid,
      createdAt: new Date().toISOString(),
      role: "user",
      contentType: "AUDIO",
      content: "🎤 语音消息", // 用友好的显示文本
      status: 'sending' as const // 初始状态
    }

    const aiMessage = {
      uuid: aiMessageUuid,
      createdAt: new Date().toISOString(),
      role: "assistant",
      contentType: "TEXT",
      textBlocks: new Map<number, string>(),
      audioBlocks: new Map<number, string>(),
      done: false,
      audioType: "stream",
    }

    // 覆盖上一条失败消息的逻辑
    setChatHistory(prev => {
      let newHistory = [...prev];
      const lastMsg = newHistory[newHistory.length - 1];
      if (lastMsg && lastMsg.role === 'user' && lastMsg.status === 'error') {
        newHistory.pop();
      }
      newHistory.push(userMessage as any);
      return newHistory;
    });

    // 发送消息后立刻滚动到底部
    if (scrollToBottom) {
      setTimeout(() => scrollToBottom(), 100);
    }

    const teacherUuidForAPI = isTeacherMode ? selectedteacherUuid : null;
    api.sendMessageStreamNew(file, lessonUuid, "AUDIO", teacherUuidForAPI, modelConfig || undefined, {
      onStart: () => {
        addMessage(aiMessage);
        // AI开始回复时也滚动到底部
        if (scrollToBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      },
      onTextReceived: (text: string, blockNum?: number) => {
        addTextBlock(aiMessageUuid, blockNum || 0, text.replace(/\\n/g, '\n'));
        if (scrollToBottom) {
          setTimeout(() => scrollToBottom(), 50);
        }
      },
      onAudioReceived: (audioBase64: string, blockNum?: number) => {
        // 移除自动播放，让用户手动控制
        // setAutoPlayMessageId(aiMessageUuid);
        addAudioBlock(aiMessageUuid, blockNum || 0, audioBase64)
      },
      onProgressReceived: (cid: any, pid: any, finished: boolean) => {
        eventBus.emit('progress', { cid, pid, finished });
      },
      onBlackboardReceived: (blackboardUuid: string, title?: string) => {
        addBlackboard(aiMessageUuid, blackboardUuid, title)
      },
      onImageReceived: (imageUuid: string, title?: string) => {
        addImageShow(aiMessageUuid, imageUuid, title)
      },
      onMindMapReceived: (mindMapUuid: string) => {
        addMindMap(aiMessageUuid, mindMapUuid)
      },
      onExerciseReceived: (uuid: string, type: string, questionData: any) => {
        addExercise(aiMessageUuid, uuid, type, questionData);
        // 同时调用外部传入的回调
        onExerciseReceived?.(aiMessageUuid, uuid, type, questionData);
      },
      onUserAudioReceived: (audioUrl: string) => {
        setAudioUrl(userMessageUuid, audioUrl);
      },
      onRewardReceived: (rewardUuid: string) => {
        addReward(aiMessageUuid, rewardUuid)
      },
      onReceiveTotalBlockNum: (totalBlockNum: number) => {
        setChatHistory(prev => {
          const index = prev.findIndex(item => item.uuid === aiMessageUuid);
          if (index !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[index].totalAudioBlocks = totalBlockNum;
            return updatedMessages;
          }
          return prev;
        });
      },
      onError: (error: Error) => {
        setSending(false);
        console.error('发送音频失败:', error);
        
        // 移除 AI 消息占位符
        setChatHistory(prev => prev.filter(msg => msg.uuid !== aiMessageUuid));
        
        // 更新用户消息状态为 error
        updateMessage(userMessageUuid, { status: 'error' });
        
        toast({
          title: "连接失败",
          description: `语音消息发送失败: ${error.message}`,
          variant: "destructive"
        });
      },
      onComplete: () => {
        setSending(false);
        setMessageDone(aiMessageUuid);
        // 更新用户消息状态为 success
        updateMessage(userMessageUuid, { status: 'success' });
      }
    })
  }, [lessonUuid, needTts, scrollToBottom, eventBus, onExerciseReceived, toast]);

  // 重试消息
  const retryMessage = useCallback((messageId: string) => {
    const message = chatHistory.find(m => m.uuid === messageId);
    if (!message) return;

    // 删除旧消息
    setChatHistory(prev => prev.filter(m => m.uuid !== messageId));

    if (message.contentType === 'AUDIO' && message.audioUrl) {
       // 尝试从 audioUrl 获取 blob 并重试
       fetch(message.audioUrl)
         .then(r => r.blob())
         .then(blob => {
            const file = new File([blob], "retry_voice.webm", { type: blob.type });
            sendAudioFile(file);
         })
         .catch(e => {
            console.error("重试获取音频失败", e);
            toast({ title: "重试失败", description: "无法获取原始音频", variant: "destructive" });
         });
    } else {
       // 文本消息重试
       sendMessage(message.content, message.contentType as "TEXT" | "AUDIO");
    }
  }, [chatHistory, sendAudioFile]);

  // 清理资源
  useEffect(() => {
    // 当没有 lessonUuid 时，立即结束加载状态，避免空白期 UI 闪烁
    if (!lessonUuid) {
      setChatHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api.getChatHistory(lessonUuid)
      .then(res => {
        if (Array.isArray(res)) {
          for (const item of res) {
            // 初始化done参数
            item.done = true;
          }
          setChatHistory(res);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [lessonUuid]);


  // 准备上下文值
  const contextValue = {
    isLoading,
    chatHistory,
    clearHistory,
    getAllBlackboards,
    getAllMindMaps,
    getAllImages,
    sendMessage,
    sendAudioFile,
    sending,
    autoPlayMessageId,
    setAutoPlayMessageId,
    scrollToBottom,
    setScrollToBottom,
    updateMessage, // 导出 updateMessage
    activeMindMapUuid,
    setActiveMindMapUuid,
    activeBlackboardUuid,
    setActiveBlackboardUuid,
    activeImageUuid,
    setActiveImageUuid,
    isRightPanelOpen,
    setIsRightPanelOpen,
    retryMessage,
    modelConfig,
    setModelConfig
  };

  return (
    <ChatHistoryContext.Provider value={contextValue}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

export default ChatHistoryContext;
