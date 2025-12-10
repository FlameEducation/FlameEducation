import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, AlertCircle, X, ZoomIn, ZoomOut, Maximize2, Monitor } from 'lucide-react';
import { getImageGenerateStatus, regenerateImage } from '@/api/image.ts';
import { createPortal } from 'react-dom';
import { useEventBus } from "@/pages/chat/context/EventBusContext.tsx";
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext.tsx";
import { useImageContext } from "@/pages/chat/context/ImageContext.tsx";

interface ImageViewProps {
  imageUuid?: string;
  imageUrl?: string;
  className?: string;
  messageId?: string;
}

export const ImageView: React.FC<ImageViewProps> = ({
  imageUuid,
  imageUrl,
  className,
  messageId
}) => {
  const eventBus = useEventBus();
  const { setIsRightPanelOpen, setActiveImageUuid, chatHistory } = useChatHistoryContext();
  const { getImageState, loadImage, retryImage } = useImageContext();
  
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imgNaturalHeight, setImgNaturalHeight] = useState<number>(0);
  const [imgNaturalWidth, setImgNaturalWidth] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  
  // Get state from context
  const imageState = imageUuid ? getImageState(imageUuid) : undefined;
  
  // Determine current display values
  const currentStatus = imageUrl ? 'COMPLETED' : (imageState?.status || 'PENDING');
  const currentImageUrl = imageUrl || imageState?.url;
  const currentError = imageState?.error;
  const isLoading = !imageUrl && (!imageState || imageState.isLoading);

  // 自动打开右侧面板逻辑
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    // 如果是宽屏模式，且是最后一条消息，且未自动打开过
    if (window.innerWidth >= 768 && !hasOpenedRef.current && imageUuid) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      const isLastMessage = messageId && lastMessage && lastMessage.uuid === messageId;
      
      if (isLastMessage) {
        handleShowInRightPanel();
        hasOpenedRef.current = true;
      }
    }
  }, [imageUuid, messageId, chatHistory]);

  // 图片加载处理
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImgNaturalHeight(img.naturalHeight);
    setImgNaturalWidth(img.naturalWidth);
  };

  useEffect(() => {
    if (imageUuid && !imageUrl) {
      loadImage(imageUuid);
    }
  }, [imageUuid, imageUrl, loadImage]);

  // 处理图片加载错误
  const handleImageError = () => {
    // If it's a context managed image, we might want to update context, 
    // but for now just local handling or maybe retry?
    // Since we don't have a way to report load error back to context easily without loop,
    // we rely on the generation status. 
    // If generation said success but load failed, it's a network issue likely.
  };

  // 重试生成图片
  const handleRetry = async () => {
    if (imageUuid) {
      await retryImage(imageUuid);
    }
  };

  // 处理点击图片打开全屏预览
  const handleImageClick = () => {
    if (currentStatus === 'COMPLETED' && currentImageUrl) {
      // PC端默认在右侧面板打开
      if (window.innerWidth >= 768) {
        handleShowInRightPanel();
      } else {
        // 移动端全屏预览
        setIsFullscreen(true);
        // 防止滚动
        document.body.style.overflow = 'hidden';
      }
    }
  };

  // 关闭全屏预览
  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setIsZoomed(false);
    // 恢复滚动
    document.body.style.overflow = '';
  };

  // 处理缩放切换
  const handleToggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setIsZoomed(!isZoomed);
  };

  // 检测Escape键关闭全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleCloseFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // 组件卸载时也恢复滚动
      if (isFullscreen) {
        document.body.style.overflow = '';
      }
    };
  }, [isFullscreen]);
  // 在侧边栏显示
  const handleShowInRightPanel = () => {
    if (imageUuid) {
      setActiveImageUuid(imageUuid);
      setIsRightPanelOpen(true);
      eventBus.emit('showImage', { uuid: imageUuid });
    }
  }

  // 生成中状态的渲染内容
  const renderGenerating = () => (
    <div className={cn(
      "relative min-h-[200px] w-full h-60",
      className
    )}>
      <div
        className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 rounded-lg">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"
                 style={{animationDirection: 'reverse'}}/>
          </div>
        </div>
        <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">图像绘制中</h3>
            <p className="text-sm text-gray-500">老师正在快马加鞭的画画，耐心等待哦~</p>
        </div>
      </div>
    </div>
  );

  // 错误状态的渲染内容
  const renderError = () => (
    <div className="w-full h-60 bg-red-50 rounded-lg flex flex-col items-center justify-center">
      <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
      <p className="text-sm text-red-600 mt-2">{currentError || '图片生成失败'}</p>
      <button
        onClick={handleRetry}
        className="mt-4 flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors"
        disabled={isLoading}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>重试</span>
      </button>
    </div>
  );

  // 成功状态的渲染内容
  const renderCompleted = () => (
    <div 
      className="w-full h-auto overflow-hidden rounded-lg shadow-sm relative cursor-pointer group"
      onClick={handleImageClick}
    >
      <img 
        src={currentImageUrl} 
        alt="AI生成的图像" 
        className="w-full h-auto object-contain"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      
      {/* 悬浮操作栏 - 仅在PC端显示 */}
      <div className="absolute top-2 right-2 hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShowInRightPanel();
          }}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors"
          title="在侧边栏查看"
        >
          <Monitor size={16} />
        </button>
        <div className="bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm">
          <ZoomIn size={16} />
        </div>
      </div>
    </div>
  );

  // 全屏预览模态框
  const renderFullscreenModal = () => {
    if (!isFullscreen) return null;
    
    // 使用Portal将模态框渲染到body上，确保真正的全屏效果
    return createPortal(
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseFullscreen}
        >
          <motion.div 
            className="relative w-full h-full flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex gap-4">
              <button 
                onClick={handleToggleZoom}
                className="bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
              >
                {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
              </button>
              <button 
                onClick={handleCloseFullscreen}
                className="bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div 
              className="p-4 w-full h-full flex items-center justify-center" 
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={currentImageUrl} 
                alt="AI生成的图像全屏预览" 
                className={cn(
                  "transition-all duration-300",
                  isZoomed 
                    ? "max-w-none max-h-none" 
                    : "max-w-[90vw] max-h-[90vh]"
                )}
                style={{
                  objectFit: 'contain',
                  cursor: isZoomed ? 'zoom-out' : 'zoom-in'
                }}
                onClick={handleToggleZoom}
              />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };
  
  return (
    <div className={cn("mt-3 mb-1", className)}>
      {currentStatus === 'PENDING' && renderGenerating()}
      {currentStatus === 'FAILED' && renderError()}
      {currentStatus === 'COMPLETED' && currentImageUrl && renderCompleted()}
      {renderFullscreenModal()}
    </div>
  );
}; 