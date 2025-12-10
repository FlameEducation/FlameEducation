import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import api from '@/api';
import { BlackboardContent } from '@/api/blackboard';

interface BlackboardState {
  uuid: string;
  content?: string;
  title?: string;
  over: boolean;
  error: boolean;
  isLoading: boolean;
  errorMessage?: string;
}

interface BlackboardContextType {
  blackboardMap: Map<string, BlackboardState>;
  getBlackboardState: (uuid: string) => BlackboardState | undefined;
  loadBlackboard: (uuid: string) => void;
  loadAllBlackboards: (uuids: string[]) => void;
  regenerateBlackboard: (uuid: string) => Promise<void>;
}

const BlackboardContext = createContext<BlackboardContextType | undefined>(undefined);

export const useBlackboardContext = () => {
  const context = useContext(BlackboardContext);
  if (!context) {
    throw new Error('useBlackboardContext must be used within BlackboardProvider');
  }
  return context;
};

export const BlackboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [blackboardMap, setBlackboardMap] = useState<Map<string, BlackboardState>>(new Map());
  
  const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const blackboardMapRef = useRef(blackboardMap);
  const loadedUuidsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    blackboardMapRef.current = blackboardMap;
  }, [blackboardMap]);

  useEffect(() => {
    return () => {
      pollingRefs.current.forEach(intervalId => clearInterval(intervalId));
      pollingRefs.current.clear();
    };
  }, []);

  const updateBlackboardState = useCallback((uuid: string, updates: Partial<BlackboardState>) => {
    setBlackboardMap(prev => {
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
    const intervalId = pollingRefs.current.get(uuid);
    if (intervalId) {
      clearInterval(intervalId);
      pollingRefs.current.delete(uuid);
    }
  }, []);

  const fetchContent = useCallback(async (uuid: string) => {
    try {
      const response = await api.getBlackboardContent(uuid) as BlackboardContent;

      if (response.error) {
        updateBlackboardState(uuid, { 
          error: true, 
          errorMessage: '内容生成失败',
          isLoading: false 
        });
        stopPolling(uuid);
        return;
      }

      if (response.over) {
        updateBlackboardState(uuid, { 
          content: response.content,
          title: response.title,
          over: true,
          isLoading: false 
        });
        stopPolling(uuid);
      } else {
        // Still generating, update content if available (streaming effect)
        updateBlackboardState(uuid, { 
          content: response.content,
          title: response.title,
          over: false,
          isLoading: true 
        });
      }
    } catch (error) {
      console.error('获取小黑板内容失败:', error);
      updateBlackboardState(uuid, { 
        error: true, 
        errorMessage: '获取内容失败',
        isLoading: false 
      });
      stopPolling(uuid);
    }
  }, [stopPolling, updateBlackboardState]);

  const startPolling = useCallback((uuid: string) => {
    if (pollingRefs.current.has(uuid)) return;

    fetchContent(uuid);

    const intervalId = setInterval(() => {
      fetchContent(uuid);
    }, 2000); // Poll every 2 seconds

    pollingRefs.current.set(uuid, intervalId);
  }, [fetchContent]);

  const loadBlackboard = useCallback((uuid: string) => {
    const current = blackboardMapRef.current.get(uuid);
    
    // 如果已经加载完成或正在加载，则跳过
    if (current && (current.over || current.isLoading)) {
      return;
    }

    // 如果已经发起过加载且没有报错，也跳过（避免重复请求）
    if (loadedUuidsRef.current.has(uuid) && !current?.error) {
      return;
    }

    loadedUuidsRef.current.add(uuid);
    updateBlackboardState(uuid, { isLoading: true });
    startPolling(uuid);
  }, [startPolling, updateBlackboardState]);

  // 自动加载所有未加载的小黑板
  const loadAllBlackboards = useCallback((uuids: string[]) => {
    uuids.forEach(uuid => {
      loadBlackboard(uuid);
    });
  }, [loadBlackboard]);

  const regenerateBlackboard = useCallback(async (uuid: string) => {
    try {
      updateBlackboardState(uuid, { 
        over: false, 
        error: false, 
        isLoading: true,
        errorMessage: undefined
      });
      await api.regenerateBlackboard(uuid);
      startPolling(uuid);
    } catch (error) {
      console.error('重新生成失败:', error);
      updateBlackboardState(uuid, { 
        error: true, 
        errorMessage: '重新生成请求失败',
        isLoading: false 
      });
    }
  }, [startPolling, updateBlackboardState]);

  const getBlackboardState = useCallback((uuid: string) => {
    return blackboardMap.get(uuid);
  }, [blackboardMap]);
  return (
    <BlackboardContext.Provider value={{ blackboardMap, getBlackboardState, loadBlackboard, loadAllBlackboards, regenerateBlackboard }}>
      {children}
    </BlackboardContext.Provider>
  );
};
