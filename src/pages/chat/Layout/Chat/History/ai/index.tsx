import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils.ts';
import { formatRelativeTime } from '../../../../utils.ts';
import { BlackBoardView } from './tools/BlackBoardView.tsx';
import { MindMapView } from './tools/MindMapView.tsx';
import { ImageView } from './tools/ImageView.tsx';
import { ExerciseInfoCard } from '@/pages/chat/Layout/Chat/History/ai/ExerciseInfoCard.tsx';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { ChatMessage } from "@/types/ChatMessage.ts";
import { useSearchParams } from "react-router-dom";
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext.tsx";
import { useAudioPlayStatus } from "@/pages/chat/context/AudioContext.tsx";
import { CrystalRewardTag } from '@/pages/chat/Layout/Chat/History/ai/CrystalRewardTag.tsx';
import { Loader2 } from 'lucide-react';

export const AiMessageCard = ({ messageId }: { messageId: string }) => {

  const [searchParams] = useSearchParams();
  const [message, setSetMessage] = React.useState<ChatMessage | null>(null);
  
  const paramLessonUuid = searchParams.get('lessonUuid');
  const currentAddAudioBlockNum = useRef<number>(1);
  const hasAutoPlayRef = useRef<boolean>(false);

  const {
    chatHistory,
    autoPlayMessageId
  } = useChatHistoryContext();

  useEffect(() => {
    const msg = chatHistory.find(m => m.uuid === messageId);
    setSetMessage(msg || null);
  }, [chatHistory, messageId]);

  const {
    playChunkAudio,
    stop,
    isPlaying,
    playAudio,
    playingAudioId,
    setTotalBlocks
  } = useAudioPlayStatus();

  // 🔑 监听totalAudioBlocks变化，及时通知AudioContext
  useEffect(() => {
    if (message?.totalAudioBlocks && playingAudioId === messageId && message.audioType === 'stream') {
      console.log(`📊 [AiMessageCard] 收到总块数，通知AudioContext: ${message.totalAudioBlocks}`);
      setTotalBlocks(messageId, message.totalAudioBlocks);
    }
  }, [message?.totalAudioBlocks, playingAudioId, messageId, message?.audioType, setTotalBlocks]);


  const {
    createdAt,
    content,
    imageUuid,
    blackboardUuid,
    blackboardTitle,
    mindMapUuid,
    mindMapTitle,
    imageUrl,
    audioUrl,
    exerciseUuid,
    rewardUuid,
    audioBlocks,
    audioBlocksLength,
    done,
    isLoading,
  } = message || {};


  const handleStop = () => {
    stop();
    currentAddAudioBlockNum.current = 1;
    hasAutoPlayRef.current = false;
  }

  const handlePlay = () => {
    if (!message) return;
    
    console.log(`🎬 [handlePlay] 开始播放音频消息 ${messageId.slice(-8)}`, {
      audioType: message.audioType,
      audioBlocksSize: message.audioBlocks?.size || 0,
      currentBlockNum: currentAddAudioBlockNum.current,
      isPlaying,
      playingAudioId: playingAudioId?.slice(-8)
    });
    
    if (message.audioType === 'stream') {
      if (message.audioBlocks && message.audioBlocks.size > 0) {
        // 🔑 重新播放时重置到第一个块
        currentAddAudioBlockNum.current = 1;
        
        while (message.audioBlocks.has(currentAddAudioBlockNum.current)) {
          const audioData = message.audioBlocks.get(currentAddAudioBlockNum.current);
          if (audioData) {
            console.log(`🎵 [handlePlay] 添加播放块 ${currentAddAudioBlockNum.current}`);
            // 🔑 传递totalAudioBlocks给播放器
            playChunkAudio(
              currentAddAudioBlockNum.current, 
              audioData, 
              messageId, 
              message.totalAudioBlocks
            );
          }
          currentAddAudioBlockNum.current += 1;
        }
      } else {
        console.log(`⚠️ [handlePlay] 没有可播放的音频块`);
      }
    } else {
      if (isPlaying && playingAudioId === messageId) {
        stop()
        return
      }
      message.audioUrl && playAudio(message.audioUrl, messageId)
    }
  }

  useEffect(() => {
    if (audioBlocks === undefined || audioBlocks.size === 0) return;
    if (autoPlayMessageId === messageId) {
      if (!!audioBlocks && audioBlocks.size > 0) {
        if (!hasAutoPlayRef.current) {
          // hasAutoPlayRef.current = true;
          handlePlay()
          // setAutoPlayMessageId(null)
        }
      }
    }
  }, [audioBlocksLength, audioBlocks]);


  useEffect(() => {
    for (let i = 0; i < chatHistory.length; i++) {
      if (chatHistory[i].uuid === messageId) {
        setSetMessage(chatHistory[i]);
        break;
      }
    }
  }, [chatHistory]);


  if (!message) {
    // 可以渲染一个加载占位符，或者返回 null
    return null;
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={cn(
        "relative group rounded-2xl bg-white shadow-sm transition-all duration-300 border border-transparent",
        "hover:shadow-md hover:border-gray-100",
        isLoading ? "animate-pulse" : "",
        isPlaying && playingAudioId === messageId ? "ring-2 ring-blue-50 bg-blue-50/30" : ""
      )}>
        <div className="p-5 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-medium text-gray-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
              {
                done ? (createdAt ? formatRelativeTime(createdAt) : '刚刚') :(
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    <span className="relative overflow-hidden">
                      <span className="bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent bg-[length:300%_100%] animate-shimmer font-medium">
                        处理中...
                      </span>
                    </span>
                  </div>
                )
              }
            </div>
            {(!!audioUrl || (audioBlocks && audioBlocks.size > 0)) && (
              <button
                onClick={isPlaying && playingAudioId === messageId ? handleStop : handlePlay}
                className={cn(
                  "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-300",
                  "shadow-sm hover:shadow hover:scale-105 active:scale-95",
                  isPlaying && playingAudioId === messageId 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600",
                )}
              >
                {isPlaying && playingAudioId === messageId ? (
                    // 暂停图标
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="10" y1="7" x2="10" y2="17" />
                      <line x1="14" y1="7" x2="14" y2="17" />
                    </svg>
                  ) : (
                    // 播放图标
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="7 5 17 12 7 19" fill="currentColor" />
                    </svg>
                  )}
              </button>
            )}
          </div>

          <div className="prose prose-slate max-w-none text-base leading-relaxed text-gray-700">
            <ReactMarkdown 
              remarkPlugins={[remarkBreaks]} 
              rehypePlugins={[rehypeRaw]}
              components={{
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {!isLoading && blackboardUuid && paramLessonUuid && (
            <div className="mt-6">
              <BlackBoardView 
                sessionId={paramLessonUuid} 
                blackboardUuid={blackboardUuid} 
                title={blackboardTitle} 
                messageId={messageId}
              />
            </div>
          )}

          {!isLoading && mindMapUuid && (
            <div className="mt-6">
              <MindMapView 
                mindMapUuid={mindMapUuid} 
                title={mindMapTitle} 
                messageId={messageId}
              />
            </div>
          )}

          {(imageUrl || imageUuid) && (
            <div className="mt-6">
              <ImageView 
                imageUrl={imageUrl} 
                imageUuid={imageUuid} 
                className="rounded-xl overflow-hidden shadow-sm border border-gray-100" 
                messageId={messageId}
              />
            </div>
          )}

          {exerciseUuid && (
            <div className="mt-6">
              <ExerciseInfoCard exerciseUuid={exerciseUuid} messageId={messageId} />
            </div>
          )}
        </div>

        {rewardUuid && <CrystalRewardTag rewardUuid={rewardUuid} lessonUuid={paramLessonUuid || ''} />}
      </div>
    </div>
  );
};

export default AiMessageCard;
