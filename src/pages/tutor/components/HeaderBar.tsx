import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    MessageSquare, Plus, Trash2, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    getUserSessions, deleteSession, updateSession, GeneralChatSession
} from '@/api/general-chat';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Contexts
import { GeneralChatProvider } from './context/GeneralChatContext';
import { GlobalSettingsProvider, useSelectedTeacher } from '@/contexts/GlobalSettingsContext';
import { listAiProviders } from '@/api/ai-provider';

// Components
import ChatComponent from '@/pages/chat/Layout/Chat';



const HeaderBar: React.FC = () => {
    return (
        <div className="bg-white border-b border-gray-200 flex items-center justify-between p-4">
            <h1 className="text-lg font-semibold">导师聊天</h1>
            {/* 其他头部内容可以放在这里 */}
        </div>
    );
};

export default HeaderBar;