import React, {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {cn} from '@/lib/utils.ts';
import {useChatHistoryContext} from "@/pages/chat/context/ChatHistoryContext.tsx";
import {MindMapDisplayComponent} from "@/pages/chat/Layout/RightPannel/MindMapDisplay";
import {useMindMapContext} from "@/pages/chat/context/MindMapContext.tsx";
import {useEventBus} from "@/pages/chat/context/EventBusContext.tsx";

interface MindMapViewProps {
  mindMapUuid: string;
  title?: string;
  messageId?: string;
}

export const MindMapView: React.FC<MindMapViewProps> = (
  {
    mindMapUuid,
    title,
    messageId
  }) => {
  // 使用 React 的 state 来控制模态框的显示状态，而不是直接操作 DOM
  const [showModal, setShowModal] = React.useState(false);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  const eventBus = useEventBus();

  const { setActiveMindMapUuid, setIsRightPanelOpen, chatHistory } = useChatHistoryContext();
  const { getMindMapState } = useMindMapContext();
  
  const mindMapState = getMindMapState(mindMapUuid);
  const displayTitle = title || mindMapState?.title || '思维导图';
  const hasOpenedRef = useRef(false);

  // 自动打开右侧面板逻辑
  useEffect(() => {
    // 如果是宽屏模式，且是最后一条消息，且未自动打开过
    if (window.innerWidth >= 768 && !hasOpenedRef.current && mindMapUuid) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      const isLastMessage = messageId && lastMessage && lastMessage.uuid === messageId;
      
      if (isLastMessage) {
        setActiveMindMapUuid(mindMapUuid);
        setIsRightPanelOpen(true);
        hasOpenedRef.current = true;
      }
    }
  }, [mindMapUuid, messageId, chatHistory, setActiveMindMapUuid, setIsRightPanelOpen]);

  // 检查屏幕尺寸
  const checkScreenSize = React.useCallback(() => {
    setIsLargeScreen(window.innerWidth >= 768);
  }, []);

  // 处理屏幕尺寸变化
  React.useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkScreenSize]);


  // 在组件卸载时确保清理
  useEffect(() => {
    return () => {
      if (!isLargeScreen && showModal) {
        document.body.style.overflow = 'auto';
      }
    };
  }, [isLargeScreen, showModal]);

  // 打开模态框
  const openModal = () => {
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    document.body.style.overflow = 'auto';
  };

  // 创建模态框内容
  const renderModal = () => {
    if (!showModal || isLargeScreen) return null;

    return createPortal(
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <div className="absolute inset-4 bg-white rounded-xl shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-400 
                          bg-clip-text text-transparent">
              {displayTitle}
            </h3>
            <button
              className={cn(
                "p-2 hover:bg-gray-100 rounded-lg transition-colors",
                "active:scale-95"
              )}
              onClick={closeModal}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
             <MindMapDisplayComponent uuid={mindMapUuid} />
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const handleShowMindMap = () => {
    if (isLargeScreen) {
      setActiveMindMapUuid(mindMapUuid);
      setIsRightPanelOpen(true);
      eventBus.emit('showMindMap', { uuid: mindMapUuid });
    } else {
      openModal();
    }
  };

  return (
    <>
      {/* 知识卡片 */}
      <div className="group border border-blue-100 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 hover:shadow-md transition-all duration-200">
        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between">
            {/* 左侧标题区域 */}
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-md text-white">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{displayTitle}</span>
                <span className="text-xs text-blue-100">点击按钮查看详细内容</span>
              </div>
            </div>

            {/* 右侧按钮 */}
            <button
              className={cn(
                "flex items-center gap-2",
                isLargeScreen
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white text-blue-600 border-transparent",
                "rounded-md px-3 py-1.5 border backdrop-blur-sm",
                "text-xs font-medium",
                "transition-all duration-200"
              )}
              onClick={handleShowMindMap}
            >
              {isLargeScreen ? (
                <>
                  查看演示
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </>
              ) : (
                <>
                  全屏查看
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 使用 Portal 渲染模态框到 body */}
      {renderModal()}
    </>
  );
};
