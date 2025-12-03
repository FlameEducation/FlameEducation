import React, {useState, useRef, useCallback, useEffect} from 'react';
import {ChatHeader} from './Layout/Header/ChatHeader.tsx';
import {ClassStatusContextProvider} from "@/pages/chat/context/ClassStatusContext.tsx";
import {AudioPlayStatusProvider} from '@/pages/chat/context/AudioContext.tsx';
import {ExerciseProvider, useExerciseContext} from './context/ExerciseContext.tsx';
import { ChatHistoryProvider, useChatHistoryContext } from './context/ChatHistoryContext.tsx';
import {LessonInfoDialog} from "@/pages/chat/components/LessonInfoDialog.tsx";
import {SettingsDialog} from "@/pages/chat/Layout/Header/SettingsDialog.tsx";
import ChatComponent from "@/pages/chat/Layout/Chat";
import RightPanelComponent from "@/pages/chat/Layout/RightPannel";

import {ExerciseModal} from './components/ExerciseModal.tsx';
import { EnergyOrbProvider } from './context/EnergyOrbContext.tsx';
import { useChatViewMode, useSelectedTeacher } from '@/contexts';

interface ChatMainAreaProps {
  chatViewMode: 'teacher' | 'list';
  setChatViewMode: (mode: 'teacher' | 'list') => void;
}

const ChatMainArea: React.FC<ChatMainAreaProps> = ({
  chatViewMode,
  setChatViewMode,
}) => {
  const { getAllBlackboards, getAllMindMaps } = useChatHistoryContext();
  const { showExerciseInRightPanel } = useExerciseContext();
  
  const hasBlackboards = getAllBlackboards().length > 0;
  const hasMindMaps = getAllMindMaps().length > 0;
  const showRightPanel = showExerciseInRightPanel || hasBlackboards || hasMindMaps;

  // 新增：分割线拖拽相关状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    // 从localStorage读取保存的宽度，默认32%
    const saved = localStorage.getItem('chat-panel-width');
    return saved ? parseFloat(saved) : 32;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 保存宽度到localStorage
  const saveWidthToStorage = useCallback((width: number) => {
    localStorage.setItem('chat-panel-width', width.toString());
  }, []);

  // 处理鼠标按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    
    // 计算新的左侧面板宽度百分比
    const newLeftWidth = (mouseX / containerWidth) * 100;
    
    // 限制最小和最大宽度（20% - 60%）
    const clampedWidth = Math.max(20, Math.min(60, newLeftWidth));
    setLeftPanelWidth(clampedWidth);
  }, [isDragging]);

  // 处理鼠标释放事件
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // 拖拽结束时保存宽度
      saveWidthToStorage(leftPanelWidth);
    }
  }, [isDragging, leftPanelWidth, saveWidthToStorage]);

  // 添加全局事件监听器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // 防止文本选择
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
        <main className="flex flex-1 overflow-hidden" ref={containerRef}>
          {/* 左侧聊天区域 */}
          <div 
            className="h-full w-full max-w-full min-w-0"
            style={{ 
              width: isDesktop && showRightPanel ? `${leftPanelWidth}%` : '100%' 
            }}
          >
            <ChatComponent
              chatViewMode={chatViewMode}
              setChatViewMode={setChatViewMode}
            />
          </div>

          {/* 桌面端分割线 - 只在桌面端显示 */}
          {isDesktop && showRightPanel && (
            <div 
              className="relative group bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              style={{ width: '8px' }}
            >
              {/* 可拖拽的分割线主体 */}
              <div
                className={`absolute inset-0 cursor-col-resize ${
                  isDragging ? 'bg-blue-100' : ''
                }`}
                onMouseDown={handleMouseDown}
              />
              
              {/* 分割线中间的拖拽指示器 - 三个竖线 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-6 bg-gray-400 rounded-full"></div>
                  <div className="w-0.5 h-6 bg-gray-400 rounded-full"></div>
                  <div className="w-0.5 h-6 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              
              {/* 拖拽时的蓝色指示线 */}
              {isDragging && (
                <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-blue-500 rounded-full"></div>
              )}
            </div>
          )}

          {/* 右侧面板区域 - 只在桌面端显示 */}
          {isDesktop && showRightPanel && (
            <div 
              className="h-full"
              style={{ 
                width: `${100 - leftPanelWidth}%` 
              }}
            >
              <RightPanelComponent/>
            </div>
          )}
        </main>
  );
}

// 内部组件，使用ExerciseContext
const ChatContent: React.FC = () => {
  
  const [showSettings, setShowSettings] = useState(false);
  const [showLessonInfo, setShowLessonInfo] = useState(false);
  
  // 教学模式相关状态 - 使用全局设置
  const [chatViewMode, setChatViewMode] = useChatViewMode();
  const [selectedTeacherUuid, setSelectedTeacherUuid] = useSelectedTeacher();

  // 确保有默认教师
  useEffect(() => {
    if (!selectedTeacherUuid) {
      setSelectedTeacherUuid('teacher-3');
    }
  }, [selectedTeacherUuid, setSelectedTeacherUuid]);

  return (
    <ExerciseProvider>
      <ChatHistoryProvider
        isTeacherMode={chatViewMode === 'teacher'}
        selectedteacherUuid={selectedTeacherUuid || 'teacher-3'}
      >
        <div className="flex h-screen-stable">
          <div className="flex-1 overflow-hidden flex flex-col">


        <ChatHeader
          onOpenSettings={() => setShowSettings(true)}
          onOpenLessonInfo={() => setShowLessonInfo(true)}
        />

        <ChatMainArea 
           chatViewMode={chatViewMode}
           setChatViewMode={setChatViewMode}
        />

        {/* 课程详情模态窗口 */}
        <LessonInfoDialog
          open={showLessonInfo}
          onOpenChange={setShowLessonInfo}
        />

        {/* 设置模态窗口 */}
        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
        />

        {/* 移动设备练习模态框 - 内部会自动判断是否为移动设备 */}
        <ExerciseModal />

        </div>

      </div>
      </ChatHistoryProvider>
    </ExerciseProvider>
  );
};


// 主导出组件，包装在Provider中
export const ChatIndexPage: React.FC = () => {
  return (
    <EnergyOrbProvider>
      <ExerciseProvider>
        <ClassStatusContextProvider>
          <AudioPlayStatusProvider>
            <ChatContent/>
          </AudioPlayStatusProvider>
        </ClassStatusContextProvider>
      </ExerciseProvider>
    </EnergyOrbProvider>
  );
};


export default ChatIndexPage;
