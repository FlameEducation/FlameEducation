import React, { useEffect, useState } from 'react';
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext";
import { getImageGenerateStatus } from '@/api/image';
import { Loader2 } from 'lucide-react';
import { useImageContext } from "@/pages/chat/context/ImageContext.tsx";
import { cn } from '@/lib/utils.ts';

interface ImageDisplayComponentProps {
  uuid?: string;
}

export const ImageDisplayComponent: React.FC<ImageDisplayComponentProps> = ({ uuid }) => {
  const { getAllImages } = useChatHistoryContext();
  const { getImageState, loadImage, retryImage } = useImageContext();
  
  const imageState = uuid ? getImageState(uuid) : undefined;
  const imageUrl = imageState?.url;
  const loading = !imageUrl && (!imageState || imageState.isLoading);
  const error = imageState?.error;

  useEffect(() => {
    if (uuid) {
      const images = getAllImages();
      const image = images.find(img => img.uuid === uuid);
      
      if (image && image.url) {
        // If we have URL in chat history, we might want to update context?
        // Or just rely on context loading.
        // Ideally context should be the source of truth.
        // But chat history has static data.
        // Let's just load from context.
        loadImage(uuid);
      } else {
        loadImage(uuid);
      }
    }
  }, [uuid, loadImage, getAllImages]);

  if (loading) {
    return (
      <div className="relative w-full h-full min-h-[200px]">
        <div
          className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
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
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4">
        {error ? (
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
            <p className="text-sm text-red-600 text-center">{error || '图片生成失败'}</p>
            {uuid && (
              <button
                onClick={() => retryImage(uuid)}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                重新加载图片
              </button>
            )}
          </div>
        ) : (
          uuid ? '图片生成中或加载失败' : '请选择一张图片'
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/5 p-4 overflow-hidden">
      <img 
        src={imageUrl} 
        alt="Chat Image" 
        className="w-full h-full object-contain rounded-lg shadow-lg"
      />
    </div>
  );
};

export default ImageDisplayComponent;
