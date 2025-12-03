import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    MessageSquare, Plus, Trash2, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeneralChatSession } from '@/api/general-chat';

interface SideBarProps {
    sidebarOpen: boolean,
    sessions: GeneralChatSession[],
    currentSession: GeneralChatSession | null,
    setCurrentSession: (session: GeneralChatSession) => void,
    handleCreateSession: () => void,
    handleDeleteSession: (uuid: string, e: React.MouseEvent) => void;
    setSidebarOpen?: (open: boolean) => void; // Add this to allow closing sidebar on mobile selection
}

const SessionGroup = ({ 
    title, 
    sessions, 
    currentSession, 
    setCurrentSession, 
    handleDeleteSession,
    onSelect
}: {
    title: string,
    sessions: GeneralChatSession[],
    currentSession: GeneralChatSession | null,
    setCurrentSession: (session: GeneralChatSession) => void,
    handleDeleteSession: (uuid: string, e: React.MouseEvent) => void,
    onSelect?: () => void
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (sessions.length === 0) return null;

    return (
        <div className="mb-2">
            <div 
                className="flex items-center px-3 py-1 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                {title}
            </div>
            
            {isExpanded && (
                <div className="space-y-0.5 mt-1">
                    {sessions.map(session => (
                        <div
                            key={session.uuid}
                            onClick={() => {
                                setCurrentSession(session);
                                onSelect?.();
                            }}
                            className={cn(
                                "group flex items-center justify-between px-3 py-2 mx-2 rounded-md cursor-pointer text-sm transition-colors",
                                currentSession?.uuid === session.uuid
                                    ? "bg-blue-50 text-blue-700"
                                    : "hover:bg-gray-100 text-gray-700"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate overflow-hidden">
                                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate text-xs">{session.title}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => handleDeleteSession(session.uuid, e)}
                            >
                                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SideBar: React.FC<SideBarProps> = (
    { sidebarOpen,
        sessions,
        currentSession,
        setCurrentSession,
        handleCreateSession,
        handleDeleteSession,
        setSidebarOpen
    }
) => {
    
    const groupedSessions = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = new Date(today - 86400000).getTime();
        const last7Days = new Date(today - 86400000 * 7).getTime();

        const groups = {
            today: [] as GeneralChatSession[],
            yesterday: [] as GeneralChatSession[],
            last7Days: [] as GeneralChatSession[],
            older: [] as GeneralChatSession[]
        };

        // Sort sessions by updatedAt desc first
        const sortedSessions = [...sessions].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        sortedSessions.forEach(session => {
            const date = new Date(session.updatedAt).getTime();
            if (date >= today) {
                groups.today.push(session);
            } else if (date >= yesterday) {
                groups.yesterday.push(session);
            } else if (date >= last7Days) {
                groups.last7Days.push(session);
            } else {
                groups.older.push(session);
            }
        });
        return groups;
    }, [sessions]);

    const handleSelect = () => {
        // On mobile, close sidebar after selection
        if (window.innerWidth < 768 && setSidebarOpen) {
            setSidebarOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    onClick={() => setSidebarOpen?.(false)}
                />
            )}
            
            <div className={cn(
                "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-full z-[100]",
                // Mobile: fixed, Desktop: relative/flex-item
                "fixed md:relative inset-y-0 left-0",
                sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 md:opacity-100 overflow-hidden"
            )}>
                <div className="p-3 border-b border-gray-100">
                    <Button
                        className="w-full justify-start gap-2 h-9 text-sm"
                        onClick={() => {
                            handleCreateSession();
                            handleSelect();
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        新建对话
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                    <SessionGroup 
                        title="今天" 
                        sessions={groupedSessions.today} 
                        currentSession={currentSession}
                        setCurrentSession={setCurrentSession}
                        handleDeleteSession={handleDeleteSession}
                        onSelect={handleSelect}
                    />
                    <SessionGroup 
                        title="昨天" 
                        sessions={groupedSessions.yesterday} 
                        currentSession={currentSession}
                        setCurrentSession={setCurrentSession}
                        handleDeleteSession={handleDeleteSession}
                        onSelect={handleSelect}
                    />
                    <SessionGroup 
                        title="7天内" 
                        sessions={groupedSessions.last7Days} 
                        currentSession={currentSession}
                        setCurrentSession={setCurrentSession}
                        handleDeleteSession={handleDeleteSession}
                        onSelect={handleSelect}
                    />
                    <SessionGroup 
                        title="更早" 
                        sessions={groupedSessions.older} 
                        currentSession={currentSession}
                        setCurrentSession={setCurrentSession}
                        handleDeleteSession={handleDeleteSession}
                        onSelect={handleSelect}
                    />
                </div>
            </div>
        </>
    );
};

export default SideBar;
