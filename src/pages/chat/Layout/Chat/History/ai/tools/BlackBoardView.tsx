import React, {useEffect} from 'react';
import {createPortal} from 'react-dom';
import {cn} from '@/lib/utils.ts';
import {DynamicComponentRenderer} from '@/components/sendbox';
import {useEventBus} from "@/pages/chat/context/EventBusContext.tsx";
import {useChatHistoryContext} from "@/pages/chat/context/ChatHistoryContext.tsx";

interface BlackBoardViewProps {
  sessionId: string;
  blackboardUuid: string;
}

export const BlackBoardView: React.FC<BlackBoardViewProps> = (
  {
    sessionId,
    blackboardUuid,
  }) => {
  // 使用 React 的 state 来控制模态框的显示状态，而不是直接操作 DOM
  const [showModal, setShowModal] = React.useState(false);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const eventBus = useEventBus();
  const { setActiveMindMapUuid } = useChatHistoryContext();

  const onRegenerateStateChange = () => {
    console.log('onRegenerateStateChange');
  }


  // 检查屏幕尺寸
  const checkScreenSize = React.useCallback(() => {
    setIsLargeScreen(window.innerWidth >= 1024);
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
              交互演示
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
            <DynamicComponentRenderer
              sessionId={sessionId}
              blackboardUuid={blackboardUuid}
              containerClassName="h-full"
              className="!h-full"
              showRegenerateButton={true}
              isRegenerating={isRegenerating}
              onRegenerateStateChange={onRegenerateStateChange}
            />
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const handleShowBlackboard = () => {
    if (isLargeScreen) {
      setActiveMindMapUuid(null);
      eventBus.emit('showBlackboard', {uuid: blackboardUuid});
    } else {
      openModal();
    }
  };

  return (
    <>
      {/* 知识卡片 */}
      <div className="group border border-purple-100 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-md transition-all duration-200">
        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between">
            {/* 左侧标题区域 */}
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-md text-white">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">知识小黑板</span>
                <span className="text-xs text-purple-100">点击按钮查看详细内容</span>
              </div>
            </div>

            {/* 右侧按钮 */}
            <button
              className={cn(
                "flex items-center gap-2",
                isLargeScreen
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white text-purple-600 border-transparent",
                "rounded-md px-3 py-1.5 border backdrop-blur-sm",
                "text-xs font-medium",
                "transition-all duration-200"
              )}
              onClick={handleShowBlackboard}
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
