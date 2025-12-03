import React from 'react';
import { AiMessageCard } from '@/pages/chat/Layout/Chat/History/ai';
import { UserMessage } from './user/UserMessage.tsx';
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext.tsx";
import { StartLessonButton } from "@/pages/chat/components/StartLessonButton.tsx";



export const Index: React.FC = ({}) => {
    const { chatHistory, sendMessage, sending, isLoading } = useChatHistoryContext();

    // 处理开始课程按钮点击
    const handleStartLesson = () => {
        sendMessage("老师好，我准备好开始这节课了！", "TEXT");
    };

    // 如果没有聊天记录且不在加载中，显示开始课程按钮
    if (chatHistory.length === 0 && !isLoading) {
        return (
            <div className="h-full min-h-[400px] flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <StartLessonButton 
                        onStartLesson={handleStartLesson}
                        isLoading={sending}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {chatHistory.map((message) => {
                if (message.role === 'user') {
                    return <UserMessage key={message.uuid} messageId={message.uuid} />;
                }

                // AI Message
                return (
                    <AiMessageCard key={message.uuid} messageId={message.uuid} />
                );
            })}
        </div>
    );
}; 