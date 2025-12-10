import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import api from '@/api';

interface MindMapContent {
  uuid: string;
  title?: string;
  content: string;
  over: boolean;
  error: boolean;
}

interface MindMapState {
  uuid: string;
  content?: string;
  title?: string;
  over: boolean;
  error: boolean;
  isLoading: boolean;
  errorMessage?: string;
}

interface MindMapContextType {
  mindMapMap: Map<string, MindMapState>;
  getMindMapState: (uuid: string) => MindMapState | undefined;
  loadMindMap: (uuid: string) => void;
  regenerateMindMap: (uuid: string) => Promise<void>;
}

const MindMapContext = createContext<MindMapContextType | undefined>(undefined);

export const useMindMapContext = () => {
  const context = useContext(MindMapContext);
  if (!context) {
    throw new Error('useMindMapContext must be used within MindMapProvider');
  }
  return context;
};

export const MindMapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mindMapMap, setMindMapMap] = useState<Map<string, MindMapState>>(new Map());
  
  const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const mindMapMapRef = useRef(mindMapMap);

  useEffect(() => {
    mindMapMapRef.current = mindMapMap;
  }, [mindMapMap]);

  useEffect(() => {
    return () => {
      pollingRefs.current.forEach(timer => clearTimeout(timer));
      pollingRefs.current.clear();
    };
  }, []);

  const updateMindMapState = useCallback((uuid: string, updates: Partial<MindMapState>) => {
    setMindMapMap(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(uuid) || { 
        uuid, 
        over: false, 
        error: false, 
        isLoading: true 
      };
      newMap.set(uuid, { ...current, ...updates });
      return newMap;
    });
  }, []);

  const stopPolling = useCallback((uuid: string) => {
    const timer = pollingRefs.current.get(uuid);
    if (timer) {
      clearTimeout(timer);
      pollingRefs.current.delete(uuid);
    }
  }, []);

  const fetchContent = useCallback(async (uuid: string) => {
    try {
      const response = await api.getMindMapContent(uuid) as MindMapContent;

      if (response.error) {
        updateMindMapState(uuid, { 
          error: true, 
          errorMessage: '内容生成失败',
          isLoading: false 
        });
        stopPolling(uuid);
        return;
      }

      if (response.over) {
        updateMindMapState(uuid, { 
          content: response.content,
          title: response.title,
          over: true,
          isLoading: false 
        });
        stopPolling(uuid);
      } else {
        updateMindMapState(uuid, { 
          content: response.content,
          title: response.title,
          over: false,
          isLoading: true 
        });
        
        // Schedule next poll
        const timer = setTimeout(() => fetchContent(uuid), 2000);
        pollingRefs.current.set(uuid, timer);
      }
    } catch (error) {
      console.error('获取思维导图失败:', error);
      updateMindMapState(uuid, { 
        error: true, 
        errorMessage: '获取内容失败',
        isLoading: false 
      });
      stopPolling(uuid);
    }
  }, [stopPolling, updateMindMapState]);

  const startPolling = useCallback((uuid: string) => {
    if (pollingRefs.current.has(uuid)) return;
    fetchContent(uuid);
  }, [fetchContent]);

  const loadMindMap = useCallback((uuid: string) => {
    const current = mindMapMapRef.current.get(uuid);
    
    if (current && (current.over || current.error)) {
      return;
    }

    if (!current || !current.over) {
      updateMindMapState(uuid, { isLoading: true });
      startPolling(uuid);
    }
  }, [startPolling, updateMindMapState]);

  const regenerateMindMap = useCallback(async (uuid: string) => {
    try {
      updateMindMapState(uuid, { 
        over: false, 
        error: false, 
        isLoading: true,
        errorMessage: undefined
      });
      await api.regenerateMindMap(uuid);
      startPolling(uuid);
    } catch (error) {
      console.error('重新生成失败:', error);
      updateMindMapState(uuid, { 
        error: true, 
        errorMessage: '重新生成请求失败',
        isLoading: false 
      });
    }
  }, [startPolling, updateMindMapState]);

  const getMindMapState = useCallback((uuid: string) => {
    return mindMapMap.get(uuid);
  }, [mindMapMap]);

  return (
    <MindMapContext.Provider value={{ mindMapMap, getMindMapState, loadMindMap, regenerateMindMap }}>
      {children}
    </MindMapContext.Provider>
  );
};
