import React, { useEffect } from 'react';
import { formatRelativeTime, formatTime } from '../../../../utils.ts';
import { cn } from '@/lib/utils.ts';
import { Button } from '@/components/ui/button.tsx';
import { Square, PlayCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAudioPlayStatus } from '../../../../context/AudioContext.tsx';
import { ChatMessage } from "@/types/ChatMessage.ts";
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext.tsx";

interface UserMessageProps {
  messageId: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ messageId }) => {
  const [message, setMessage] = React.useState<ChatMessage>({} as ChatMessage);
  const { chatHistory, retryMessage } = useChatHistoryContext();

  const {
    content,
    createdAt,
    audioUrl,
    status
  } = message;

  const {
    isPlaying,
    playAudio,
    playingAudioId,
    stop
  } = useAudioPlayStatus();

  // 从聊天历史中找到对应的消息
  useEffect(() => {
    for (let i = 0; i < chatHistory.length; i++) {
      if (chatHistory[i].uuid === messageId) {
        setMessage(chatHistory[i]);
        break;
      }
    }
  }, [chatHistory, messageId]);

  // 处理音频播放
  const handlePlayClicked = async () => {
    try {
      if (isPlaying && playingAudioId === messageId) {
        // 如果当前正在播放且是同一条消息，停止播放
        stop();
      } else {
        playAudio(audioUrl, messageId);
      }
    } catch (error) {
      console.error('播放失败:', error);
    }
  };

  // 处理重试
  const handleRetry = () => {
    retryMessage(messageId);
  };

  // 检查是否有音频
  const hasAudio = audioUrl && audioUrl.trim() !== '';
  const isCurrentlyPlaying = isPlaying && playingAudioId === messageId;

  return (
    <div className="flex justify-end mb-2 items-end gap-2">
      {/* 左侧状态图标 */}
      {status === 'error' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRetry}
          className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors mb-1"
          title="发送失败，点击重试"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
      
      {status === 'sending' && (
         <div className="h-8 w-8 flex items-center justify-center mb-1">
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
         </div>
      )}

      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className={cn(
          "transition-all duration-300 rounded-lg shadow-sm relative",
          isCurrentlyPlaying
            ? "bg-gradient-to-r from-blue-600/95 to-blue-500/95 shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-[1.02]"
            : status === 'error'
              ? "bg-red-500/90 hover:shadow-md border border-red-200" // 错误状态
              : "bg-blue-500/95 hover:shadow-md",
          status === 'sending' && "opacity-80"
        )}>
          
          <div className="px-4 py-3">
            {/* 文本内容 */}
            {content && (
              <p className="text-base text-white break-words whitespace-pre-wrap leading-relaxed mb-2">
                {content}
              </p>
            )}
            
            {/* 音频播放区域 */}
            {hasAudio && (
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayClicked}
                  className={cn(
                    "h-8 w-8 rounded-full flex-shrink-0 transition-all duration-300",
                    isCurrentlyPlaying
                      ? "bg-white/30 hover:bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                      : "bg-white/10 hover:bg-white/20",
                    "transform hover:scale-105 active:scale-95"
                  )}
                >
                  {!audioUrl ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    isCurrentlyPlaying ? (
                      <Square className="h-4 w-4 text-white animate-[pulse_1.5s_ease-in-out_infinite]" />
                    ) : (
                      <PlayCircle className="h-4 w-4 text-white" />
                    )
                  )}
                </Button>

                <div className={cn(
                  "flex-1 h-8 rounded-md overflow-hidden transition-all duration-300",
                  isCurrentlyPlaying
                    ? "bg-white/25 shadow-inner"
                    : "bg-white/10"
                )}>
                  {isCurrentlyPlaying && (
                    <div className="h-full flex items-center justify-around px-2">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-[2px] rounded-full transition-all",
                            isCurrentlyPlaying
                              ? "bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)] animate-[wave_1s_ease-in-out_infinite]"
                              : "bg-white/60",
                          )}
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                            animationDelay: `${i * 30}ms`,
                            animationDuration: isCurrentlyPlaying ? `${600 + Math.random() * 400}ms` : '0ms'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 时间戳 */}
            <div className="text-[0.7rem] text-gray-300 text-right">
              {hasAudio ? formatRelativeTime(createdAt) : formatTime(createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
