import React, {useEffect, useState, useRef, useCallback} from 'react';
import {useSearchParams} from 'react-router-dom';
import request from '@/utils/request.ts';
import ReactCode from '@/components/sendbox/ReactCode.tsx';
import {cn} from '@/lib/utils.ts';
import api from '@/api/index.ts';
import {useClassStatusContext} from "@/pages/chat/context/ClassStatusContext.tsx";

interface BlackboardContent {
  uuid: string;
  title: string;
  content: string;
  over: boolean;
  error: boolean;
}

interface DynamicComponentRendererProps {
  sessionId: string;
  blackboardUuid: string;
  className?: string;
  containerClassName?: string;
  onContentLoad?: (height: number) => void;
  showRegenerateButton?: boolean;
  isRegenerating?: boolean;
  onRegenerateStateChange?: (state: boolean) => void;
}

const regenerateBlackboard = async (blackboardUuid: string) => {
  try {
    await api.regenerateBlackboard(blackboardUuid);
  } catch (error) {
    console.error('重新生成失败:', error);
    throw error;
  }
};

export const DynamicComponentRenderer: React.FC<DynamicComponentRendererProps> = ({
  sessionId,
  blackboardUuid,
  containerClassName,
  className,
  showRegenerateButton = false,
  isRegenerating = false,
  onRegenerateStateChange
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalRegenerating, setIsLocalRegenerating] = useState(false);
  
  const {
    courseUuid,
    chapterUuid,
    lessonUuid
  } = useClassStatusContext();
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRegenerateTimeRef = useRef<number>(0);

  // 获取小黑板内容
  const fetchContent = useCallback(async () => {
    try {
      const response = await api.getBlackboardContent(blackboardUuid) as BlackboardContent;

      if (response.error) {
        setError('内容生成失败');
        setIsLoading(false);
        return false;
      }

      if (response.over && response.content) {
        setContent(response.content);
        setIsLoading(false);
        return false;
      }

      return true; // 继续轮询
    } catch (error) {
      console.error('获取小黑板内容失败:', error);
      setError('获取内容失败');
      setIsLoading(false);
      return false;
    }
  }, [sessionId, blackboardUuid]);

  // 开始轮询
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setIsLoading(true);
    setError(null);
    setContent(null);
    
    pollingIntervalRef.current = setInterval(() => {
      fetchContent().then(shouldContinue => {
        if (!shouldContinue && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      });
    }, 2000);
    fetchContent()
  }, [fetchContent]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 重新生成
  const handleRegenerate = useCallback(async () => {
    if (isLocalRegenerating) return;
    
    try {
      setIsLocalRegenerating(true);
      onRegenerateStateChange?.(true);
      await regenerateBlackboard(blackboardUuid);
      startPolling();
    } catch (error) {
      console.error('重新生成失败:', error);
      setError('重新生成失败');
    } finally {
      setIsLocalRegenerating(false);
      onRegenerateStateChange?.(false);
    }
  }, [sessionId, blackboardUuid, startPolling, isLocalRegenerating, onRegenerateStateChange]);

  // 发送消息到 iframe
  const sendCodeToIframe = useCallback(() => {
    if (content && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'CODE_CONTENT',
        content: content,
        courseUuid,
        chapterUuid,
        lessonUuid,
        blackboardUuid
      }, '*');
    }
  }, [content, courseUuid, chapterUuid, lessonUuid, blackboardUuid]);

  // 初始化轮询
  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling]);

  // 监听外部重新生成状态
  useEffect(() => {
    if (isRegenerating) {
      handleRegenerate().catch(console.error);
    }
  }, [isRegenerating, handleRegenerate]);

  // 监听 iframe 消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'IFRAME_READY') {
        sendCodeToIframe();
      } else if (event.data?.type === 'CODE_ERROR' && 
                 event.data?.blackboardUuid === blackboardUuid) {
        // 收到代码错误，自动重新生成（添加防抖，避免频繁重新生成）
        const now = Date.now();
        if (now - lastRegenerateTimeRef.current > 5000) { // 5秒内只重新生成一次
          lastRegenerateTimeRef.current = now;
          console.log('检测到代码错误，自动重新生成...');
          handleRegenerate().catch(console.error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendCodeToIframe, handleRegenerate, blackboardUuid]);

  // 内容变化时发送消息
  useEffect(() => {
    sendCodeToIframe();
  }, [sendCodeToIframe]);

  if (isLoading) {
    return (
      <div className={cn(
        "relative min-h-[200px]",
        containerClassName
      )}>
        <div
          className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"
                   style={{animationDirection: 'reverse'}}/>
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">课程内容准备中</h3>
            <p className="text-sm text-gray-500">老师正在为你准备精彩的互动示例...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center",
        containerClassName
      )}>
        <div className="min-h-[100px] flex flex-col items-center justify-center p-6 rounded-lg">
          <svg
            className="w-12 h-12 text-red-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-red-700 mb-2">加载遇到问题</h3>
          <p className="text-sm text-red-600 text-center">抱歉，课程示例加载失败了</p>
          <button
            onClick={handleRegenerate}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            重新加载课程
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", containerClassName)}>
      {showRegenerateButton && (
        <button
          onClick={handleRegenerate}
          className={cn(
            "absolute bottom-3 right-3 z-50",
            "p-1.5 rounded-lg bg-white/90 hover:bg-white",
            "border border-gray-200 shadow-sm hover:shadow",
            "text-gray-500 hover:text-gray-700",
            "transition-all duration-200",
            "flex items-center gap-2",
            "scale-90",
            (isLoading || isLocalRegenerating) && "opacity-50 cursor-not-allowed"
          )}
          disabled={isLoading || isLocalRegenerating}
        >
          <svg
            className={cn(
              "w-3.5 h-3.5",
              (isLoading || isLocalRegenerating) && "animate-spin"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}

      {content && (
        <iframe
          ref={iframeRef}
          src="/codePreview"
          className={cn(
            "w-full border-0 rounded-lg",
            "bg-transparent",
            className
          )}
          style={{
            minHeight: "200px",
            overflow: 'auto'
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
};

const IndexPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const blackboardUuid = searchParams.get('blackboardUuid');

  if (!sessionId || !blackboardUuid) {
    return (
      <div className="h-screen-dynamic flex items-center justify-center">
        <div className="text-gray-500">缺少必要参数</div>
      </div>
    );
  }

  return (
    <div className="h-full absolute inset-0">
      <DynamicComponentRenderer
        sessionId={sessionId}
        blackboardUuid={blackboardUuid}
        showRegenerateButton={true}
      />
    </div>
  );
};

export default IndexPage;