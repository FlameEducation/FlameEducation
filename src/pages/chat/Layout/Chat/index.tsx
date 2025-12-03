import React, { useState } from "react";
import { motion } from "framer-motion";
import { Index } from "@/pages/chat/Layout/Chat/History";
import { BottomInputArea } from "@/pages/chat/Layout/Chat/Input/BottomInputArea";
import GalgameStyleView from "@/pages/chat/Layout/Chat/AiCharacter/GalgameStyleView";
import { useScrollToBottom } from "@/pages/chat/hooks/useScrollToBottom";
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext";

interface ChatComponentProps {
  chatViewMode: 'teacher' | 'list';
  setChatViewMode: (mode: 'teacher' | 'list') => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  chatViewMode,
  setChatViewMode,
}) => {
  const { chatHistory, setScrollToBottom: registerScrollToBottom, isLoading, sending } = useChatHistoryContext();
  const { scrollRef, scrollToBottom } = useScrollToBottom([chatHistory]);

  const isInitialLoading = isLoading;

  // 注册滚动函数到Context，以便在发送消息时使用
  React.useEffect(() => {
    // 只在消息列表模式下注册滚动函数
    if (chatViewMode === 'list') {
      registerScrollToBottom(() => scrollToBottom(true));
    } else {
      registerScrollToBottom(null);
    }

    return () => {
      registerScrollToBottom(null);
    };
  }, [registerScrollToBottom, scrollToBottom, chatViewMode]);

  return (
    <div className="w-full h-full max-w-full flex flex-col border-r border-gray-200 bg-white relative overflow-hidden">

      {isInitialLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-gray-500">加载聊天记录...</div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* 内容显示区域 - 与 BottomInputArea 共同占用高度 */}
          <div className="flex-1 overflow-y-scroll overflow-x-hidden [&::-webkit-scrollbar]:hidden">
            {/* 教师形象视图 - 使用 if 条件渲染 */}
            {chatViewMode === 'teacher' && (chatHistory.length > 0 || sending || isLoading) ? (
              <GalgameStyleView />
            ) : (
              <div className="h-full overflow-y-auto overflow-x-hidden overscroll-none chat-container [&::-webkit-scrollbar]:hidden">
                <div
                  ref={scrollRef}
                  className="h-full overflow-y-auto overflow-x-hidden overscroll-none [&::-webkit-scrollbar]:hidden"
                >
                  <div className="space-y-8 py-4 px-2 sm:px-4 max-w-4xl mx-auto w-full">
                    <Index />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <BottomInputArea
        onSwitchToTeacherView={() => setChatViewMode('teacher')}
        onSwitchToListView={() => setChatViewMode('list')}
        isTeacherView={chatViewMode === 'teacher'}
      />
    </div>
  )
}

export default ChatComponent;