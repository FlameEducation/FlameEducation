import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioPlayStatus } from "@/pages/chat/context/AudioContext.tsx";
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext.tsx";
import { useExerciseContext } from "@/pages/chat/context/ExerciseContext.tsx";
import { useEventBus } from "@/pages/chat/context/EventBusContext.tsx";
import { ChatMessage } from "@/types/ChatMessage.ts";
import RealTeacherAvatar from '@/components/tutor/RealTeacherAvatar';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
// 导入需要的组件
import { BlackBoardView } from '@/pages/chat/Layout/Chat/History/ai/tools/BlackBoardView.tsx';
import { MindMapView } from '@/pages/chat/Layout/Chat/History/ai/tools/MindMapView.tsx';
import { ImageView } from '@/pages/chat/Layout/Chat/History/ai/tools/ImageView.tsx';
import { ExerciseInfoCard } from '@/pages/chat/Layout/Chat/History/ai/ExerciseInfoCard.tsx';
import { CrystalRewardTag } from '@/pages/chat/Layout/Chat/History/ai/CrystalRewardTag.tsx';
import { useSearchParams } from 'react-router-dom';

import { useSelectedTeacher } from "@/contexts";
import { useClassStatusContext } from "@/pages/chat/context/ClassStatusContext";

interface GalgameStyleViewProps {
}

const GalgameStyleView: React.FC<GalgameStyleViewProps> = () => {
  
  // 从Context获取状态
  const [selectedTeacherUuid] = useSelectedTeacher();
  const { availableTeachers } = useClassStatusContext();
  
  // 计算当前教师
  const currentTeacher = React.useMemo(() => {
    if (!availableTeachers || availableTeachers.length === 0) return null;
    if (!selectedTeacherUuid) return availableTeachers[0];
    return availableTeachers.find(t => t.uuid === selectedTeacherUuid) || availableTeachers[0];
  }, [availableTeachers, selectedTeacherUuid]);

  // 当前的消息
  const [currentDisplayMessage, setCurrentDisplayMessage] = React.useState<ChatMessage | null>(null);
  const currentMessageRef = useRef<ChatMessage | null>(null);


  // 当前显示的文字
  const [displayText, setDisplayText] = React.useState<string>('');

  // 当前显示的文字号
  const [currentDisplayTextNum, setCurrentDisplayTextNum] = useState<number>(0);
  const currentDisplayTextNumRef = useRef<number>(0);

  // 打字机效果相关状态
  const [typewriterText, setTypewriterText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showFullText, setShowFullText] = useState<boolean>(false);
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [maxDisplayTextNum, setMaxDisplayTextNum] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const {
    chatHistory,
    sending,
    setIsRightPanelOpen,
    setActiveBlackboardUuid,
    setActiveMindMapUuid,
    setActiveImageUuid,
    retryMessage
  } = useChatHistoryContext();

  const { setRightPanelExerciseId } = useExerciseContext();

  const eventBus = useEventBus();

  const {
    isPlaying,
    playChannelAudio,
    stop
  } = useAudioPlayStatus();

  const [searchParams] = useSearchParams();
  const paramLessonUuid = searchParams.get('lessonUuid');

  // 抑制音频播放的Ref，用于控制初始加载时不自动播放
  const suppressAudioRef = useRef<boolean>(false);
  // 记录当前正在等待音频的blockNum，防止重复启动等待任务
  const waitingBlockNumRef = useRef<number>(-1);
  // 标记是否正在等待下一个文本块（用于自动播放时，下一块还没到的情况）
  const isWaitingForNextBlockRef = useRef<boolean>(false);

  // 组件卸载时停止播放
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  // 获取当前显示的消息并处理流式数据
  useEffect(() => {
    if (chatHistory.length === 0) {
      setCurrentDisplayMessage(null);
      setDisplayText('');
      return;
    }

    // 获取最新的AI消息
    const latestAiMessage = [...chatHistory].reverse().find(msg => msg.role === 'assistant');

    if (latestAiMessage) {
      // 移除 content 非空检查，只要有消息对象就处理，确保状态及时重置
      // 检查是否是新的消息
      const isNewMessage = latestAiMessage.uuid !== currentMessageRef.current?.uuid;

      if (isNewMessage) {
        console.log('🆕 [新消息] 检测到新消息，重置状态');

        // 立即停止当前播放
        stop();

        // 新消息时重置所有状态
        setCurrentDisplayMessage(latestAiMessage);
        currentMessageRef.current = latestAiMessage;
        
        // 计算最大key值而不是size
        const keys = Array.from(latestAiMessage.textBlocks?.keys() || []);
        const maxKey = keys.length > 0 ? Math.max(...keys) : 0;
        setMaxDisplayTextNum(maxKey);

        // 判断是否为正在发送的消息
        // 如果是正在发送的消息（未完成），从头开始播放
        // 如果是历史消息（已完成），直接显示最后一段，且不自动播放
        // 注意：这里去掉了 sending 的判断，因为在流式传输过程中 sending 可能已经变为 false，
        // 但只要消息未完成(!done)，就应该视为正在生成的新消息进行播放
          if (!latestAiMessage.done) {
            setCurrentDisplayTextNum(1);
            currentDisplayTextNumRef.current = 1;
            suppressAudioRef.current = false;
            setHasPlayedFirstAudio(false); // 重置音频播放状态
            waitingBlockNumRef.current = -1; // 重置等待状态
            isWaitingForNextBlockRef.current = false;
          } else {
            // 历史消息，显示最后一段
            const lastBlock = maxKey > 0 ? maxKey : 1;
            setCurrentDisplayTextNum(lastBlock);
            currentDisplayTextNumRef.current = lastBlock;
            suppressAudioRef.current = true; // 抑制自动播放
            setHasPlayedFirstAudio(true); // 标记为已播放，避免触发第一段的特殊逻辑
            waitingBlockNumRef.current = -1; // 重置等待状态
            isWaitingForNextBlockRef.current = false;
          }        setShowFullText(false);
        setIsTyping(false);

        // 清理打字机定时器
        if (typewriterTimerRef.current) {
          clearTimeout(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
      } else {
        // 同一消息的更新，只更新最大文字数量
        const keys = Array.from(latestAiMessage.textBlocks?.keys() || []);
        const maxKey = keys.length > 0 ? Math.max(...keys) : 0;
        setMaxDisplayTextNum(maxKey);
        
        setCurrentDisplayMessage(latestAiMessage);
        currentMessageRef.current = latestAiMessage;

        // 检查是否在等待下一个块，且新块已到达
        if (isWaitingForNextBlockRef.current && autoPlayEnabled) {
           const nextTextNum = keys.sort((a, b) => a - b).find(k => k > currentDisplayTextNum);
           if (nextTextNum !== undefined) {
             console.log(`[自动播放] 等待的下一块 ${nextTextNum} 已到达，跳转播放`);
             setCurrentDisplayTextNum(nextTextNum);
             currentDisplayTextNumRef.current = nextTextNum;
             suppressAudioRef.current = false;
             isWaitingForNextBlockRef.current = false;
           }
        }

        // 关键修复：如果当前显示的文本块内容更新了（例如之前没收到，现在收到了），需要更新显示
        if (latestAiMessage.textBlocks && latestAiMessage.textBlocks.has(currentDisplayTextNum)) {
          const newText = latestAiMessage.textBlocks.get(currentDisplayTextNum) || '';
          if (newText !== displayText) {
            setDisplayText(newText);
          }
        }
      }
    }
  }, [chatHistory]);

  // 处理文字框点击 - 第一次停止打字机，第二次切换到下一段文字
  const handleTextBoxClick = () => {
    if (isTyping) {
      // 第一次点击：停止打字机，显示完整文字
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      setIsTyping(false);
      setShowFullText(true);
      setTypewriterText(displayText || '');
    } else {
      // 第二次点击或没有在打字时：切换到下一段文字
      // 查找下一段
      const keys = Array.from(currentMessageRef.current?.textBlocks?.keys() || []).sort((a, b) => a - b);
      const nextTextNum = keys.find(k => k > currentDisplayTextNum);
      
      if (nextTextNum === undefined) {
        return;
      }
      
      setCurrentDisplayTextNum(nextTextNum);
      currentDisplayTextNumRef.current = nextTextNum;
      setShowFullText(false);
      suppressAudioRef.current = false;
      // 手动切换时，取消等待状态
      isWaitingForNextBlockRef.current = false;
    }
  };

  // 打字机效果
  useEffect(() => {
    // 清理之前的定时器
    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }


    if (!displayText) {
      setTypewriterText('');
      setIsTyping(false);
      return;
    }

    if (showFullText) {
      setTypewriterText(displayText);
      setIsTyping(false);
      return;
    }

    // 重置打字机状态
    setTypewriterText('');
    setIsTyping(true);

    let currentIndex = 0;
    const typeSpeed = 50; // 打字速度（毫秒）

    const typeNextChar = () => {
      if (currentIndex < displayText.length) {
        const char = displayText[currentIndex];
        setTypewriterText(prev => {
          const newText = prev + char;
          return newText;
        });
        currentIndex++;
        typewriterTimerRef.current = setTimeout(typeNextChar, typeSpeed);
      } else {
        setIsTyping(false);
      }
    };

    typewriterTimerRef.current = setTimeout(typeNextChar, typeSpeed);

    return () => {
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    };
  }, [displayText, showFullText]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sending) {
      // 停止播放
      stop();
      
      setCurrentDisplayTextNum(0);
      currentDisplayTextNumRef.current = 0;
      setShowFullText(false);
      setIsTyping(false);
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }

      // 当前消息
      setCurrentDisplayMessage(null);
      currentMessageRef.current = null;
      
      // 重置播放状态
      setHasPlayedFirstAudio(false);
      suppressAudioRef.current = false;
      waitingBlockNumRef.current = -1;
      isWaitingForNextBlockRef.current = false;
    }
  }, [sending]);

  // 模拟的 sleep 函数
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 自动打开右侧面板逻辑
  useEffect(() => {
    if (!currentDisplayMessage) return;

    // 检查是否有需要展示的内容，并触发右侧面板
    // 使用 setTimeout 确保在渲染更新后执行，避免状态冲突
    const timer = setTimeout(() => {
      if (currentDisplayMessage.blackboardUuid) {
        setIsRightPanelOpen(true);
        setActiveBlackboardUuid(currentDisplayMessage.blackboardUuid);
        eventBus.emit('showBlackboard', { uuid: currentDisplayMessage.blackboardUuid });
      } else if (currentDisplayMessage.mindMapUuid) {
        setIsRightPanelOpen(true);
        setActiveMindMapUuid(currentDisplayMessage.mindMapUuid);
        eventBus.emit('showMindMap', { uuid: currentDisplayMessage.mindMapUuid });
      } else if (currentDisplayMessage.exerciseUuid) {
        setIsRightPanelOpen(true);
        setRightPanelExerciseId(currentDisplayMessage.exerciseUuid);
        eventBus.emit('showExercise', { uuid: currentDisplayMessage.exerciseUuid });
      } else if (currentDisplayMessage.imageUuid) {
        setIsRightPanelOpen(true);
        setActiveImageUuid(currentDisplayMessage.imageUuid);
        eventBus.emit('showImage', { uuid: currentDisplayMessage.imageUuid });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    currentDisplayMessage?.uuid,
    currentDisplayMessage?.blackboardUuid,
    currentDisplayMessage?.mindMapUuid,
    currentDisplayMessage?.exerciseUuid,
    currentDisplayMessage?.imageUuid,
    setIsRightPanelOpen,
    setActiveBlackboardUuid,
    setActiveMindMapUuid,
    setActiveImageUuid,
    setRightPanelExerciseId,
    eventBus
  ]);

  // 自动播放控制状态
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(() => {
    // 从localStorage读取用户设置，默认为true
    const saved = localStorage.getItem('galgame-auto-play-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // 跟踪当前消息是否已经播放过第一段音频
  const [hasPlayedFirstAudio, setHasPlayedFirstAudio] = useState<boolean>(false);

  // 保存自动播放设置到localStorage
  const toggleAutoPlay = useCallback(() => {
    const newValue = !autoPlayEnabled;
    setAutoPlayEnabled(newValue);
    localStorage.setItem('galgame-auto-play-enabled', JSON.stringify(newValue));
  }, [autoPlayEnabled]);

  // 自动连续播放语音的策略
  const playNextAudio = useCallback(() => {
    if (!autoPlayEnabled || !currentMessageRef.current?.audioBlocks) return;
    
    // 获取所有已有的文本块key并排序
    const keys = Array.from(currentMessageRef.current.textBlocks?.keys() || []).sort((a, b) => a - b);
    // 找到当前块之后的下一个块
    const nextTextNum = keys.find(k => k > currentDisplayTextNum);
    
    if (nextTextNum !== undefined) {
      // 如果找到了下一个块，直接跳转
      setCurrentDisplayTextNum(nextTextNum);
      currentDisplayTextNumRef.current = nextTextNum;
      suppressAudioRef.current = false;
      isWaitingForNextBlockRef.current = false;
    } else {
      // 如果没找到下一个块，但消息还没结束，进入等待状态
      if (!currentMessageRef.current.done) {
        console.log(`[自动播放] 当前块 ${currentDisplayTextNum} 播放完毕，下一块尚未到达，进入等待状态`);
        isWaitingForNextBlockRef.current = true;
      } else {
        console.log(`[自动播放] 消息已结束，没有更多块`);
      }
    }
  }, [currentDisplayTextNum, autoPlayEnabled]);

  useEffect(() => {
    if (currentMessageRef.current) {
      if (currentMessageRef.current.textBlocks && currentMessageRef.current.textBlocks.size > 0) {
        // 流式消息模式：严格匹配 blockNum
        if (currentMessageRef.current.textBlocks.has(currentDisplayTextNum)) {
          setDisplayText(currentMessageRef.current.textBlocks.get(currentDisplayTextNum) || '');

          // 检查是否被抑制播放
          if (suppressAudioRef.current) {
            // 不在这里重置状态，而是在用户交互（点击下一段、重播）或新消息时重置
            // 这样可以防止因为 displayText 更新导致的重复执行绕过抑制
            return;
          }

          // 检查是否已经播放过第一段音频
          if (currentDisplayTextNum === 1 && hasPlayedFirstAudio) {
            return;
          }

          // 防止重复启动等待任务
          // 如果当前正在等待的block就是目标block，则跳过
          if (waitingBlockNumRef.current === currentDisplayTextNum) {
            return;
          }

          // 异步等待音频数据准备就绪
          const waitForAudioData = async () => {
            const max_retry = 10;
            let current_retry = 0;
            const targetDisplayTextNum = currentDisplayTextNum;
            
            // 标记正在等待该block
            waitingBlockNumRef.current = targetDisplayTextNum;

            console.log(`[音频等待] 开始等待音频块 ${targetDisplayTextNum}`, {
              hasMessage: !!currentMessageRef.current,
              hasAudioBlocks: !!currentMessageRef.current?.audioBlocks,
              audioKeys: currentMessageRef.current ? Array.from(currentMessageRef.current.audioBlocks.keys()) : []
            });

            try {
              while (current_retry < max_retry) {

                if (currentDisplayTextNumRef.current !== targetDisplayTextNum) {
                  // 用户已经切换到其他段文字，停止等待
                  console.log('用户已切换文字段，停止等待音频', targetDisplayTextNum);
                  break;
                }

                if (!currentMessageRef.current) {
                  console.log('当前消息已变更，停止等待音频', targetDisplayTextNum);
                }

                // 检查是否有音频数据
                if (currentMessageRef.current?.audioBlocks.has(targetDisplayTextNum)) {
                  const audioBase64 = currentMessageRef.current.audioBlocks.get(targetDisplayTextNum) || '';
                  console.log(`[音频播放] 找到音频块 ${targetDisplayTextNum}，准备播放`, { length: audioBase64.length });
                  
                  // 标记第一段音频已播放
                  if (targetDisplayTextNum === 1) {
                    setHasPlayedFirstAudio(true);
                  }
                  
                  // 播放成功，清除等待标记
                  waitingBlockNumRef.current = -1;
                  
                  playChannelAudio("ai-message", audioBase64, {
                    onComplete: () => {
                      console.log(`[音频播放] 块 ${targetDisplayTextNum} 播放完成，自动播放开启: ${autoPlayEnabled}`);
                      if (autoPlayEnabled) {
                        setTimeout(() => {
                          playNextAudio();
                        }, 200);
                      }
                    },
                    onInterrupt: () => {
                      console.log(`[音频播放] 块 ${targetDisplayTextNum} 被中断`);
                    },
                    onError: (err) => {
                      console.error(`[音频播放] 块 ${targetDisplayTextNum} 播放错误:`, err);
                    }
                  });
                  return; // 成功找到并播放后退出函数
                } else {
                  // 健壮性优化：即使收到了后续的音频块，也尽量等待当前块，避免跳跃
                  // 只有在重试次数非常多的时候才考虑跳过
                  const hasFutureBlocks = Array.from(currentMessageRef.current?.audioBlocks.keys() || []).some(k => k > targetDisplayTextNum);
                  
                  if (hasFutureBlocks) {
                     console.log(`${targetDisplayTextNum}音频缺失但存在后续音频，继续等待...`);
                     // 如果有后续块，我们等待更久一点（例如5秒），而不是2秒就跳过
                     // 这样可以解决乱序到达的问题
                     if (current_retry > 8) {
                       console.log(`${targetDisplayTextNum}音频跳过 (存在后续块且等待超时)`);
                       playNextAudio();
                       break;
                     }
                  }

                  console.log(`${targetDisplayTextNum}等待音频数据... 重试 ${current_retry + 1}/${max_retry}`);
                }
                current_retry++;
                await sleep(1000);
              }

              if (current_retry >= max_retry) {
                console.log(`[音频等待] 块 ${targetDisplayTextNum} 超时，跳过`);
                // 超过最大重试次数，直接播放下一段音频
                playNextAudio();
              }
            } finally {
              // 无论成功失败，只要退出了循环（且不是因为成功播放return了），都清除标记
              // 注意：如果成功播放，上面已经return了，所以这里主要是处理超时或中断的情况
              // 但为了保险，我们在上面成功播放前也清除了标记
              if (waitingBlockNumRef.current === targetDisplayTextNum) {
                 waitingBlockNumRef.current = -1;
              }
            }

          };

          waitForAudioData();

        } else {
          // 如果是流式消息但当前块还没到，显示空或者等待状态，绝对不能回退显示 content
          // 因为 content 可能是乱序拼接的，或者是所有块的集合
          setDisplayText(''); 
        }
      } else {
        // 非流式消息（旧数据或一次性消息），使用 content
        setDisplayText(currentMessageRef.current.content || '');
      }
    }
  }, [currentDisplayTextNum, hasPlayedFirstAudio, displayText]);

  // 显示逻辑
  const shouldShowThinking = sending && !isPlaying && !currentMessageRef.current?.content;
  const shouldShowBubble = !!(currentDisplayMessage && displayText.trim());

  // 检查是否有附加内容需要显示
  // 不用useMemo，直接声明变量
  const hasAdditionalContent = !!(
    currentDisplayMessage &&
    (currentDisplayMessage.imageUrl ||
      currentDisplayMessage.imageUuid ||
      currentDisplayMessage.blackboardUuid ||
      currentDisplayMessage.mindMapUuid ||
      currentDisplayMessage.exerciseUuid ||
      currentDisplayMessage.rewardUuid)
  );

  // 生成稳定的key值，避免播放完成后闪烁
  const bubbleKey = useMemo(() => {
    if (shouldShowThinking) return 'thinking';
    if (shouldShowBubble && currentDisplayMessage) {
      // 使用消息UUID作为稳定key，避免播放状态变化导致的闪烁
      return `bubble-${currentDisplayMessage.uuid}`;
    }
    return null;
  }, [shouldShowThinking, shouldShowBubble, currentDisplayMessage]);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentMessageRef.current) return;

    // 停止当前播放
    stop();

    // 重置状态以从头播放
    setHasPlayedFirstAudio(false);
    suppressAudioRef.current = false;

    // 设置为第一段
    setCurrentDisplayTextNum(1);
    currentDisplayTextNumRef.current = 1;
    waitingBlockNumRef.current = -1;
    isWaitingForNextBlockRef.current = false;
  };

  // 查找发送失败的用户消息
  const failedUserMessage = useMemo(() => {
    return [...chatHistory].reverse().find(msg => msg.role === 'user' && msg.status === 'error');
  }, [chatHistory]);

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center bg-white min-h-full relative">

      {/* 发送失败提示与重试 */}
      <AnimatePresence>
        {failedUserMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-16 left-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-xl p-3 shadow-lg flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-red-600 font-medium">消息发送失败</div>
                  <div className="text-xs text-gray-600 truncate">
                    {failedUserMessage.contentType === 'AUDIO' ? '[语音消息]' : failedUserMessage.content}
                  </div>
                </div>
              </div>
              <button
                onClick={() => retryMessage(failedUserMessage.uuid)}
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100 shadow-sm transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重试
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 自动播放控制按钮 */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleAutoPlay}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${autoPlayEnabled
            ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          title={autoPlayEnabled ? '自动播放已开启' : '自动播放已关闭'}
        >
          <div className="flex items-center gap-2">
            {autoPlayEnabled ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd" />
                </svg>
                <span>自动播放</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd" />
                </svg>
                <span>手动播放</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* 文字气泡区域和真人头像区域堆叠居中 */}
      <div className="flex flex-col items-center justify-center relative w-full">
        {/* 悬浮在头像上方的文字气泡区域 */}

        <div className={`p-4 ${hasAdditionalContent ? 'w-full' : 'mb-4'} flex items-end justify-center pointer-events-none`}
          style={{ zIndex: 30 }}>

          <AnimatePresence mode="wait">
            {shouldShowThinking ? (
              <motion.div
                ref={bubbleRef}
                key="thinking"
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -8 }}
                transition={{
                  type: "spring",
                  duration: 0.3,
                  stiffness: 300,
                  damping: 25
                }}
                className={`bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg 
                          border-2 border-gray-200 relative w-full pointer-events-auto cursor-pointer  transition-all duration-200 ${hasAdditionalContent ? '' : 'w-full'}`}
                onClick={handleTextBoxClick}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="text-gray-600">思考中</div>
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                </div>

                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 
                               bg-white border-2 border-t-0 border-l-0 border-gray-200 rotate-45 "/>
              </motion.div>
            ) : shouldShowBubble ? (
              <motion.div
                ref={bubbleRef}
                key={bubbleKey}
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -8 }}
                transition={{
                  type: "spring",
                  duration: 0.3,
                  stiffness: 300,
                  damping: 25
                }}
                className={`bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg 
                          border-2 border-gray-200 relative w-full pointer-events-auto cursor-pointer  transition-all duration-200 ${hasAdditionalContent ? '' : 'w-full'}`}
                onClick={handleTextBoxClick}
              >
                {/* 说话人名字和迷你头像 */}
                <div className="flex items-center gap-3 mb-3">
                  {hasAdditionalContent && currentTeacher?.avatarUrl && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
                      <img
                        src={currentTeacher.avatarUrl}
                        alt={currentTeacher.teacherName || '老师'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="text-gray-900 font-bold text-base flex-1">
                    {currentTeacher?.teacherName || '老师'}
                  </div>

                  {currentDisplayTextNum === maxDisplayTextNum && (
                    <button
                      onClick={handleReplay}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      title="从头重播"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 对话文本 */}
                <div className="text-gray-800 text-base leading-relaxed text-sm">
                  <ReactMarkdown 
                    remarkPlugins={[remarkBreaks]} 
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {typewriterText || (displayText && !isTyping ? displayText : '')}
                  </ReactMarkdown>
                  {/*{isTyping && (*/}
                  {/*  <span className="inline-block w-2 h-4 bg-gray-600 ml-1 animate-pulse align-middle"></span>*/}
                  {/*)}*/}
                </div>

                {/* 进度指示器 */}
                {maxDisplayTextNum > 1 && (
                  <div className="mt-3 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 font-medium">进度</span>
                      </div>
                      <div className="text-gray-800 font-semibold">
                        {
                          currentDisplayTextNum > maxDisplayTextNum ? maxDisplayTextNum : currentDisplayTextNum
                        }
                      </div>
                      <div className="text-gray-400">/</div>
                      <div className="text-gray-600">
                        {maxDisplayTextNum}
                      </div>
                    </div>
                  </div>
                )}

                {
                  !hasAdditionalContent && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4
                               bg-white border-2 border-t-0 border-l-0 border-gray-200 rotate-45 "/>)
                }

              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* 真人头像展示区域 */}
        {!hasAdditionalContent && (

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2, delay: 0.3 }}
          >
            <div ref={avatarRef} className="relative z-10">
              <RealTeacherAvatar
                size="lg"
                mood={'happy'}
                speaking={isPlaying}
                teacherUuid={currentTeacher?.uuid || selectedTeacherUuid || undefined}
              />
            </div>
          </motion.div>

        )}


        {/* 附加内容展示区域 - 图片、小黑板、练习题 - 放在头像下方 */}
        {hasAdditionalContent && currentDisplayMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-2xl space-y-3 p-4 flex flex-col items-center justify-center"
          >
            {/* 小黑板 */}
            {currentDisplayMessage.blackboardUuid && paramLessonUuid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="w-full bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md border border-purple-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 flex items-center justify-center bg-purple-100 rounded-md">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="text-purple-800 font-medium text-sm">{currentDisplayMessage.blackboardTitle || '知识小黑板'}</span>
                </div>
                <BlackBoardView
                  sessionId={paramLessonUuid}
                  blackboardUuid={currentDisplayMessage.blackboardUuid}
                  title={currentDisplayMessage.blackboardTitle}
                />
              </motion.div>
            )}

            {/* 思维导图 */}
            {currentDisplayMessage.mindMapUuid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="w-full bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md border border-cyan-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 flex items-center justify-center bg-cyan-100 rounded-md">
                    <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <span className="text-cyan-800 font-medium text-sm">{currentDisplayMessage.mindMapTitle || '思维导图'}</span>
                </div>
                <MindMapView
                  mindMapUuid={currentDisplayMessage.mindMapUuid}
                  title={currentDisplayMessage.mindMapTitle}
                />
              </motion.div>
            )}

            {/* 图片 */}
            {(currentDisplayMessage.imageUrl || currentDisplayMessage.imageUuid) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-md border border-blue-200 w-full"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 flex items-center justify-center bg-blue-100 rounded-md">
                    <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-blue-800 font-medium text-sm">{currentDisplayMessage.imageTitle || '相关图片'}</span>
                </div>
                <div className="rounded-lg overflow-hidden shadow-sm">
                  <ImageView
                    imageUrl={currentDisplayMessage.imageUrl}
                    imageUuid={currentDisplayMessage.imageUuid}
                    className="w-full h-full"
                  />
                </div>
              </motion.div>
            )}

            {/* 练习题 */}
            {currentDisplayMessage.exerciseUuid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="w-full bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md border border-green-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 flex items-center justify-center bg-green-100 rounded-md">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="text-green-800 font-medium text-sm">练习题</span>
                </div>
                <ExerciseInfoCard exerciseUuid={currentDisplayMessage.exerciseUuid} />
              </motion.div>
            )}

            {/* 智慧星奖励 */}
            {currentDisplayMessage.rewardUuid && paramLessonUuid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="w-full bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md border border-orange-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded-md">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-orange-800 font-medium text-sm">智慧星奖励</span>
                </div>
                <CrystalRewardTag
                  rewardUuid={currentDisplayMessage.rewardUuid}
                  lessonUuid={paramLessonUuid}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

    </div>
  );
};

export default GalgameStyleView;
