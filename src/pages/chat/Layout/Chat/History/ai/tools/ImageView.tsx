import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, AlertCircle, X, ZoomIn, ZoomOut } from 'lucide-react';
import { getImageGenerateStatus, regenerateImage } from '@/api/image.ts';
import { createPortal } from 'react-dom';

interface ImageViewProps {
  imageUuid?: string;
  imageUrl?: string;
  className?: string;
}

export const ImageView: React.FC<ImageViewProps> = ({
  imageUuid,
  imageUrl,
  className
}) => {
  const [status, setStatus] = useState<'PENDING' | 'COMPLETED' | 'FAILED'>('PENDING');
  const [finalImageUrl, setFinalImageUrl] = useState<string | undefined>(imageUrl);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imgNaturalHeight, setImgNaturalHeight] = useState<number>(0);
  const [imgNaturalWidth, setImgNaturalWidth] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const pollingTimerRef = useRef<number | null>(null);
  
  // 用于保持图片区域高度稳定
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  
  // 图片加载处理
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImgNaturalHeight(img.naturalHeight);
    setImgNaturalWidth(img.naturalWidth);
    
    // 在图片加载完成后，更新容器高度以匹配图片实际高度，避免空白区域
    setContainerHeight(img.offsetHeight);
  };

  const clearPollingTimer = () => {
    if (pollingTimerRef.current !== null) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  const fetchImageStatus = async () => {
    if (!imageUuid) {
      return;
    }

    try {
      const data = await getImageGenerateStatus(imageUuid);

      if (!data) {
        return;
      }

      if (data.generateOver) {
        clearPollingTimer();
        setIsPolling(false);

        if (data.generateError) {
          setStatus('FAILED');
          setErrorMessage('图片生成失败');
        } else {
          setStatus('COMPLETED');
          setFinalImageUrl(data.url || undefined);
        }
      } else {
        setStatus('PENDING');
      }
    } catch (error) {
      console.error('图片状态轮询失败:', error);
      clearPollingTimer();
      setIsPolling(false);
      setStatus('FAILED');
      setErrorMessage('图片生成超时');
    }
  };

  const startPolling = () => {
    if (!imageUuid) {
      return;
    }

    clearPollingTimer();
    setStatus('PENDING');
    setErrorMessage(null);
    setIsPolling(true);

    fetchImageStatus();
    pollingTimerRef.current = window.setInterval(fetchImageStatus, 1000);
  };

  useEffect(() => {
    // 如果已有图片URL，直接显示并停止轮询
    if (imageUrl) {
      clearPollingTimer();
      setIsPolling(false);
      setStatus('COMPLETED');
      setFinalImageUrl(imageUrl);
      return;
    }

    if (imageUuid && !imageUrl) {
      startPolling();
    }

    return () => {
      clearPollingTimer();
    };
  }, [imageUuid, imageUrl]);

  // 处理图片加载错误
  const handleImageError = () => {
    setStatus('FAILED');
    setErrorMessage('图片加载失败');
  };

  // 重试生成图片
  const handleRetry = async () => {
    if (imageUuid) {
      try {
        setStatus('PENDING');
        setErrorMessage(null);
        await regenerateImage(imageUuid);
        startPolling();
      } catch (error) {
        console.error('重试生成失败:', error);
        setStatus('FAILED');
        setErrorMessage('重试请求失败');
      }
    }
  };

  // 处理点击图片打开全屏预览
  const handleImageClick = () => {
    if (status === 'COMPLETED' && finalImageUrl) {
      setIsFullscreen(true);
      // 防止滚动
      document.body.style.overflow = 'hidden';
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
      clearPollingTimer();
    };
  }, [isFullscreen]);

  // 生成中状态的渲染内容
  const renderGenerating = () => (
    <div className="w-full h-60 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
      <p className="text-sm text-gray-600 mt-4">图片生成中，请稍候...</p>
      <p className="text-xs text-gray-400 mt-1">
        正在绘制图像
      </p>
    </div>
  );

  // 错误状态的渲染内容
  const renderError = () => (
    <div className="w-full h-60 bg-red-50 rounded-lg flex flex-col items-center justify-center">
      <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
      <p className="text-sm text-red-600 mt-2">{errorMessage || '图片生成失败'}</p>
      <button
        onClick={handleRetry}
        className="mt-4 flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors"
        disabled={isPolling}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>重试</span>
      </button>
    </div>
  );

  // 成功状态的渲染内容
  const renderCompleted = () => (
    <div 
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg shadow-sm relative cursor-pointer"
      style={{ 
        height: containerHeight !== undefined ? `${Math.min(containerHeight, 400)}px` : '240px',
        transition: 'height 0.3s ease'
      }}
      onClick={handleImageClick}
    >
      <img 
        src={finalImageUrl} 
        alt="AI生成的图像" 
        className="w-full h-auto object-contain"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      <div className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1.5 opacity-75 hover:opacity-100 transition-opacity">
        <ZoomIn size={16} />
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
                src={finalImageUrl} 
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
      {status === 'PENDING' && renderGenerating()}
      {status === 'FAILED' && renderError()}
      {status === 'COMPLETED' && finalImageUrl && renderCompleted()}
      {renderFullscreenModal()}
    </div>
  );
}; 