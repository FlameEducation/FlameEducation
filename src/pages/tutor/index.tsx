import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, SlidersHorizontal } from 'lucide-react';

import {
  getUserSessions, deleteSession, GeneralChatSession, updateSession
} from '@/api/general-chat';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Contexts
import { GeneralChatProvider } from './context/GeneralChatContext';
import { GlobalSettingsProvider, useChatViewMode, useSelectedTeacher } from '@/contexts/GlobalSettingsContext';
import { listAiProviders } from '@/api/ai-provider';
import SideBar from './components/SideBar';
import { AudioPlayStatusProvider } from '@/pages/chat/context/AudioContext.tsx';

// Components
import ChatComponent from '@/pages/chat/Layout/Chat';
import {ExerciseProvider} from "@/pages/chat/context/ExerciseContext.tsx";
import {ImageProvider} from "@/pages/chat/context/ImageContext.tsx";
import {BlackboardProvider} from "@/pages/chat/context/BlackboardContext.tsx";
import {MindMapProvider} from "@/pages/chat/context/MindMapContext.tsx";
import {ClassStatusContextProvider} from "@/pages/chat/context/ClassStatusContext.tsx";


// Header Model Selector
const HeaderModelSelector = ({ models, selectedModelUuid, setSelectedModelUuid }:
  {
    models: { uuid: string; label: string; provider: string }[],
    selectedModelUuid: string | null,
    setSelectedModelUuid: (modelUuid: string) => void
  }) => {


  if (!models || models.length === 0) {
    return (
      <span className="text-xs text-red-500 cursor-pointer hover:underline"
        onClick={() => toast.error("请前往设置中心配置模型服务商")}>
        无可用模型 (点击配置)
      </span>
    );
  }

  return (
    <Select value={selectedModelUuid || undefined} onValueChange={setSelectedModelUuid}>
      <SelectTrigger
        className="w-[110px] md:w-auto md:min-w-[150px] h-8 text-xs border-none bg-gray-100 hover:bg-gray-200 transition-colors focus:ring-0">
        <SelectValue placeholder="选择模型" />
      </SelectTrigger>
      <SelectContent>
        {models.map((m) => (
          <SelectItem key={m.uuid} value={m.uuid} className="text-xs">
            {m.label} <span className="text-gray-400 ml-1">({m.provider})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const InnerTutorPage = () => {
  // 状态管理
  const [sessions, setSessions] = useState<GeneralChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<GeneralChatSession | null>(null);
  // 默认在宽屏下打开侧边栏，移动端关闭
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [selectedModelUuid, setSelectedModelUuid] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<{ uuid: string; label: string; provider: string }[]>([]);
  // 教学模式相关状态 - 使用全局设置
  const [chatViewMode, setChatViewMode] = useChatViewMode();
  const [selectedTeacherUuid] = useSelectedTeacher();
  
  // Prompt Dialog State
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [thinkingStatus, setThinkingStatus] = useState<number>(-1);

  // 加载会话列表
  useEffect(() => {
    loadSessions();
    // load model providers for header selector
    listAiProviders().then(providers => {
      const models = providers.flatMap(p => p.models.map(m => ({
        uuid: `${p.providerName}:${m}`,
        label: m,
        provider: p.providerName
      })));
      setModelOptions(models);
    }).catch(err => console.error('加载模型失败', err));
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getUserSessions();
      setSessions(data || []);

      if (data && data.length > 0) {
        if (!currentSession) {
          setCurrentSession(data[0]);
        } else {
          // 尝试找到当前会话的最新版本
          const updated = data.find(s => s.uuid === currentSession.uuid);
          if (updated) {
            setCurrentSession(updated);
          } else if (currentSession.uuid !== 'draft') {
            // 当前会话可能已被删除，选中第一个
            setCurrentSession(data[0]);
          }
        }
      } else if (!currentSession || currentSession.uuid !== 'draft') {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('加载会话失败', error);
      toast.error('加载会话失败');
    }
  };


  // 更换 Session 时同步模型选择
  const handleSessionSelect = (session: GeneralChatSession) => {
    const modelUuid = modelOptions.find(s => s.provider === session.provider && s.label === session.model)?.uuid;
    if (modelUuid) {
      setSelectedModelUuid(modelUuid);
    }
    setCurrentSession(session);
  }

  const handleOpenPromptDialog = () => {
    if (currentSession) {
      setPromptValue(currentSession.prompt || '');
      setThinkingStatus(currentSession.thinkingStatus ?? -1);
      setPromptDialogOpen(true);
    }
  };

  const handleSavePrompt = async () => {
    if (!currentSession) return;

    try {
      // Update local state
      const updatedSession = { ...currentSession, prompt: promptValue, thinkingStatus };
      setCurrentSession(updatedSession);
      setSessions(prev => prev.map(s => s.uuid === currentSession.uuid ? updatedSession : s));

      // Update backend
      if (currentSession.uuid !== 'draft') {
        await updateSession(currentSession.uuid, undefined, undefined, undefined, promptValue, thinkingStatus);
        toast.success('提示词已更新');
      }
      setPromptDialogOpen(false);
    } catch (error) {
      console.error('更新提示词失败', error);
      toast.error('更新提示词失败');
    }
  };

  const handleModelSelected = (modelUuid: string) => {
    if (!!selectedModelUuid && !!currentSession?.uuid) {
      const modelConfig = modelOptions.find(m => m.uuid === modelUuid);
      if (modelConfig) {
        // 更新当前 session 的模型配置
        setCurrentSession(prev => prev ? ({ ...prev, provider: modelConfig.provider, model: modelConfig.label }) : null);
        setSessions(prevSessions => prevSessions.map(s =>
          s.uuid === currentSession.uuid
            ? { ...s, provider: modelConfig.provider, model: modelConfig.label }
            : s
        ));
        updateSession(currentSession.uuid, undefined, modelConfig.provider, modelConfig.label)
          .then(() => {
            console.log('会话模型更新成功');
          })
      }
    }
    setSelectedModelUuid(modelUuid);
  }

  useEffect(() => {
    if (currentSession) {
      handleSessionSelect(currentSession);
    }
  }, [currentSession]);


  // 更换模型时更新 Session配置
  useEffect(() => {
    if (currentSession?.uuid === 'draft' && selectedModelUuid) {
      const parts = selectedModelUuid.split(':');
      if (parts.length === 2) {
        const [provider, model] = parts;
        if (currentSession.provider !== provider || currentSession.model !== model) {
          setCurrentSession(prev => prev ? ({ ...prev, provider, model }) : null);
        }
      }
    }
  }, [selectedModelUuid, currentSession?.uuid]);

  const handleCreateSession = () => {
    // Determine provider and model
    let provider = 'openai';
    let model = 'gpt-3.5-turbo';

    if (selectedModelUuid) {
      const parts = selectedModelUuid.split(':');
      if (parts.length === 2) {
        provider = parts[0];
        model = parts[1];
      }
    } else if (modelOptions.length > 0) {
      // Fallback to first available
      const parts = modelOptions[0].uuid.split(':');
      if (parts.length === 2) {
        provider = parts[0];
        model = parts[1];
      }
    }

    const draftSession: GeneralChatSession = {
      id: 0,
      uuid: 'draft',
      userUuid: '',
      title: '新对话',
      provider,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentSession(draftSession);
  };

  const handleDeleteSession = async (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个会话吗？')) return;

    try {
      await deleteSession(uuid);
      toast.success('删除成功');
      const updatedSessions = sessions.filter(s => s.uuid !== uuid);
      setSessions(updatedSessions);
      if (currentSession?.uuid === uuid) {
        setCurrentSession(updatedSessions.length > 0 ? updatedSessions[0] : null);
      }
    } catch (error) {
      console.error('删除失败', error);
      toast.error('删除失败');
    }
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* 侧边栏 */}
      <SideBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sessions={sessions}
        currentSession={currentSession}
        setCurrentSession={(session) => {
          handleSessionSelect(session);
          // 移动端选择会话后自动关闭侧边栏
          if (window.innerWidth < 768) {
            setSidebarOpen(false);
          }
        }}
        handleCreateSession={() => {
          handleCreateSession();
          if (window.innerWidth < 768) {
            setSidebarOpen(false);
          }
        }}
        handleDeleteSession={handleDeleteSession}
      />

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* 顶部栏 */}
        <div
          className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 z-10 relative">
          <div className="flex items-center gap-3 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </Button>
            <h1 className="font-medium text-gray-800 truncate">
              {currentSession?.title || '未选择会话'}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {currentSession && (
              <>
                <HeaderModelSelector models={modelOptions}
                  selectedModelUuid={selectedModelUuid}
                  setSelectedModelUuid={handleModelSelected} />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleOpenPromptDialog} 
                        className="hidden md:flex"
                      >
                        <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs break-words">
                        {currentSession.prompt ? (
                          currentSession.prompt.length > 100 
                            ? currentSession.prompt.substring(0, 100) + '...' 
                            : currentSession.prompt
                        ) : "未设置提示词"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Mobile Prompt Button */}
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleOpenPromptDialog} 
                  className="md:hidden"
                >
                  <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 聊天组件 */}
        <div className="flex-1 overflow-hidden relative">
          {currentSession ? (
            <GeneralChatProvider
              currentSession={currentSession}
              onSessionCreated={(newSession: GeneralChatSession) => {
                setCurrentSession(newSession);
                loadSessions();
              }}
              isTeacherMode={chatViewMode === 'teacher'}
              selectedTeacherUuid={selectedTeacherUuid}
            >
              <ChatComponent
                chatViewMode={chatViewMode}
                setChatViewMode={setChatViewMode}
              />
            </GeneralChatProvider>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <p>请选择或创建一个会话</p>
              <Button onClick={handleCreateSession} className="mt-4">
                开始新对话
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Dialog */}
      <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>设置提示词 (System Prompt)</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">思考状态</label>
              <div className="flex gap-2">
                {[
                  { value: -1, label: '默认' },
                  { value: 0, label: '关闭' },
                  { value: 1, label: '开启' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={thinkingStatus === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThinkingStatus(option.value)}
                    className="flex-1"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea 
              value={promptValue} 
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder="输入系统提示词，例如：你是一个专业的英语老师..."
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              提示词将作为 System Message 发送给模型，用于定义 AI 的行为和角色。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptDialogOpen(false)}>取消</Button>
            <Button onClick={handleSavePrompt}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TutorPage: React.FC = () => {
  return (
    <AudioPlayStatusProvider>
      <GlobalSettingsProvider>
        <ExerciseProvider>
          <ImageProvider>
            <BlackboardProvider>
              <MindMapProvider>
                <InnerTutorPage />
              </MindMapProvider>
            </BlackboardProvider>
          </ImageProvider>
        </ExerciseProvider>
      </GlobalSettingsProvider>
    </AudioPlayStatusProvider>
  );
};

export default TutorPage;
