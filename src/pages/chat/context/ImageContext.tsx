import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { getImageGenerateStatus, regenerateImage, ImageGenerateStatusResponse } from '@/api/image';

interface ImageState {
  uuid: string;
  url?: string;
  title?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  error?: string;
  isLoading: boolean;
}

interface ImageContextType {
  imageMap: Map<string, ImageState>;
  getImageState: (uuid: string) => ImageState | undefined;
  loadImage: (uuid: string) => void;
  retryImage: (uuid: string) => Promise<void>;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within ImageProvider');
  }
  return context;
};

export const ImageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [imageMap, setImageMap] = useState<Map<string, ImageState>>(new Map());
  
  // Keep track of active polling intervals to avoid duplicates
  const pollingRefs = useRef<Map<string, number>>(new Map());
  // Ref for state to access in intervals
  const imageMapRef = useRef(imageMap);

  useEffect(() => {
    imageMapRef.current = imageMap;
  }, [imageMap]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      pollingRefs.current.forEach(intervalId => clearInterval(intervalId));
      pollingRefs.current.clear();
    };
  }, []);

  const updateImageState = useCallback((uuid: string, updates: Partial<ImageState>) => {
    setImageMap(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(uuid) || { 
        uuid, 
        status: 'PENDING', 
        isLoading: true 
      };
      newMap.set(uuid, { ...current, ...updates });
      return newMap;
    });
  }, []);

  const stopPolling = useCallback((uuid: string) => {
    const intervalId = pollingRefs.current.get(uuid);
    if (intervalId) {
      clearInterval(intervalId);
      pollingRefs.current.delete(uuid);
    }
  }, []);

  const fetchImageStatus = useCallback(async (uuid: string) => {
    try {
      const data = await getImageGenerateStatus(uuid);
      
      if (!data) return;

      if (data.generateOver) {
        stopPolling(uuid);
        
        if (data.generateError) {
          updateImageState(uuid, { 
            status: 'FAILED', 
            error: '图片生成失败',
            isLoading: false 
          });
        } else {
          updateImageState(uuid, { 
            status: 'COMPLETED', 
            url: data.url,
            title: data.title,
            isLoading: false 
          });
        }
      } else {
        updateImageState(uuid, { status: 'PENDING', isLoading: true });
      }
    } catch (error) {
      console.error('图片状态轮询失败:', error);
      stopPolling(uuid);
      updateImageState(uuid, { 
        status: 'FAILED', 
        error: '图片生成超时',
        isLoading: false 
      });
    }
  }, [stopPolling, updateImageState]);

  const startPolling = useCallback((uuid: string) => {
    // If already polling, don't start another
    if (pollingRefs.current.has(uuid)) return;

    // Initial fetch
    fetchImageStatus(uuid);

    // Start interval
    const intervalId = window.setInterval(() => {
      fetchImageStatus(uuid);
    }, 1000); // Poll every 1 second

    pollingRefs.current.set(uuid, intervalId);
  }, [fetchImageStatus]);

  const loadImage = useCallback((uuid: string) => {
    const current = imageMapRef.current.get(uuid);
    
    // If already completed or failed, don't reload unless explicitly asked (retry)
    if (current && (current.status === 'COMPLETED' || current.status === 'FAILED')) {
      return;
    }

    // If not in map or pending, start polling
    if (!current || current.status === 'PENDING') {
      updateImageState(uuid, { isLoading: true, status: 'PENDING' });
      startPolling(uuid);
    }
  }, [startPolling, updateImageState]);

  const retryImage = useCallback(async (uuid: string) => {
    try {
      updateImageState(uuid, { status: 'PENDING', error: undefined, isLoading: true });
      await regenerateImage(uuid);
      startPolling(uuid);
    } catch (error) {
      console.error('重试生成失败:', error);
      updateImageState(uuid, { 
        status: 'FAILED', 
        error: '重试请求失败',
        isLoading: false 
      });
    }
  }, [startPolling, updateImageState]);

  const getImageState = useCallback((uuid: string) => {
    return imageMap.get(uuid);
  }, [imageMap]);

  return (
    <ImageContext.Provider value={{ imageMap, getImageState, loadImage, retryImage }}>
      {children}
    </ImageContext.Provider>
  );
};
