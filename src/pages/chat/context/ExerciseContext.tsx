import React, {createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect} from 'react';
import {getExerciseResult, ExerciseResultData, ProgramExerciseResult} from '@/api/exercise';

// 练习题基础状态接口
interface ExerciseState {
  // 所有练习题数据缓存 - 核心数据存储
  exerciseDataMap: Map<string, ExerciseResultData>;
  // 当前活跃的练习题ID（显示在BottomInputArea）
  currentExerciseId: string | null;
  // 右侧面板显示的练习题ID
  rightPanelExerciseId: string | null;
  // 加载状态跟踪
  loadingExercises: Set<string>;
}

// Context接口 - 参考ChatHistoryContext的设计
interface ExerciseContextType {
  // 核心状态
  exerciseDataMap: Map<string, ExerciseResultData | ProgramExerciseResult>;
  currentExerciseId: string | null;
  rightPanelExerciseId: string | null;
  loadingExercises: Set<string>;

  // 计算属性
  currentExercise: ExerciseResultData | null;
  rightPanelExercise: ExerciseResultData | null;
  hasActiveExercise: boolean;
  showExerciseInRightPanel: boolean;

  // 基础操作方法
  setCurrentExerciseId: (exerciseId: string | null) => void;
  setRightPanelExerciseId: (exerciseId: string | null) => void;

  // 练习题数据管理 - 类似ChatHistoryContext的消息管理
  getExerciseById: (exerciseId: string) => ExerciseResultData | null;
  loadExerciseData: (exerciseId: string) => Promise<ExerciseResultData | null>;
  updateExerciseData: (exerciseId: string, updatedData: Partial<ExerciseResultData>) => void;
  addExerciseData: (exerciseId: string, exerciseData: ExerciseResultData) => void;
  addExerciseFromSSE: (messageId: string, exerciseUuid: string, exerciseType: string, questionData: any) => void;
  
  // 练习题操作
  startExercise: (exerciseId: string) => Promise<void>;
  viewExercise: (exerciseId: string) => Promise<void>;
  clearExerciseState: () => void;
  
  // 工具方法
  isExerciseLoading: (exerciseId: string) => boolean;
  isExerciseCompleted: (exerciseId: string) => boolean;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export const useExerciseContext = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExerciseContext must be used within ExerciseProvider');
  }
  return context;
};

interface ExerciseProviderProps {
  children: ReactNode;
}

export const ExerciseProvider: React.FC<ExerciseProviderProps> = ({children}) => {
  const [state, setState] = useState<ExerciseState>({
    exerciseDataMap: new Map(),
    currentExerciseId: null,
    rightPanelExerciseId: null,
    loadingExercises: new Set()
  });

  // 使用ref来存储数据引用，避免依赖循环
  const dataMapRef = useRef(state.exerciseDataMap);
  const loadingRef = useRef(state.loadingExercises);

  // 同步引用
  useEffect(() => {
    dataMapRef.current = state.exerciseDataMap;
    loadingRef.current = state.loadingExercises;
  }, [state.exerciseDataMap, state.loadingExercises]);

  // 计算属性 - 类似ChatHistoryContext的方式
  const currentExercise = state.currentExerciseId ? state.exerciseDataMap.get(state.currentExerciseId) || null : null;
  const rightPanelExercise = state.rightPanelExerciseId ? state.exerciseDataMap.get(state.rightPanelExerciseId) || null : null;
  const hasActiveExercise = state.currentExerciseId !== null;
  const showExerciseInRightPanel = state.rightPanelExerciseId !== null;

  // 基础设置方法
  const setCurrentExerciseId = useCallback((exerciseId: string | null) => {
    setState(prev => ({
      ...prev,
      currentExerciseId: exerciseId
    }));
  }, []);

  const setRightPanelExerciseId = useCallback((exerciseId: string | null) => {
    setState(prev => ({
      ...prev,
      rightPanelExerciseId: exerciseId
    }));
  }, []);

  // 根据ID获取练习题数据
  const getExerciseById = useCallback((exerciseId: string): ExerciseResultData | null => {
    return dataMapRef.current.get(exerciseId) || null;
  }, []);

  // 加载练习题数据 - 类似ChatHistoryContext的API调用模式
  const loadExerciseData = useCallback(async (exerciseId: string): Promise<ExerciseResultData | null> => {
    try {
      // 如果已经在缓存中，直接返回
      if (dataMapRef.current.has(exerciseId)) {
        return dataMapRef.current.get(exerciseId)!;
      }

      // 如果正在加载，等待加载完成
      if (loadingRef.current.has(exerciseId)) {
        // 简单的轮询等待，实际项目中可以使用Promise缓存
        return new Promise((resolve) => {
          const checkLoading = () => {
            if (!loadingRef.current.has(exerciseId)) {
              resolve(dataMapRef.current.get(exerciseId) || null);
            } else {
              setTimeout(checkLoading, 100);
            }
          };
          checkLoading();
        });
      }

      // 开始加载
      setState(prev => ({
        ...prev,
        loadingExercises: new Set(prev.loadingExercises).add(exerciseId)
      }));

      // 从API获取数据
      const response = await getExerciseResult(exerciseId);
      const exerciseData = response as unknown as ExerciseResultData;

      // 更新状态
      setState(prev => {
        const newDataMap = new Map(prev.exerciseDataMap);
        newDataMap.set(exerciseId, exerciseData);
        
        const newLoadingSet = new Set(prev.loadingExercises);
        newLoadingSet.delete(exerciseId);

        return {
          ...prev,
          exerciseDataMap: newDataMap,
          loadingExercises: newLoadingSet
        };
      });

      return exerciseData;
    } catch (error) {
      console.error('加载练习题数据失败:', error);
      
      // 移除加载状态
      setState(prev => {
        const newLoadingSet = new Set(prev.loadingExercises);
        newLoadingSet.delete(exerciseId);
        return {
          ...prev,
          loadingExercises: newLoadingSet
        };
      });
      
      return null;
    }
  }, []);

  // 更新练习题数据 - 类似ChatHistoryContext的updateMessage
  const updateExerciseData = useCallback((exerciseId: string, updatedData: Partial<ExerciseResultData>) => {
    setState(prev => {
      const currentData = prev.exerciseDataMap.get(exerciseId);
      if (currentData) {
        const newDataMap = new Map(prev.exerciseDataMap);
        const updatedExercise = { ...currentData, ...updatedData };
        newDataMap.set(exerciseId, updatedExercise);

        return {
          ...prev,
          exerciseDataMap: newDataMap
        };
      }
      return prev;
    });
  }, []);

  // 添加新练习题数据 - 用于测试或模拟数据
  const addExerciseData = useCallback((exerciseId: string, exerciseData: ExerciseResultData) => {
    setState(prev => {
      const newDataMap = new Map(prev.exerciseDataMap);
      newDataMap.set(exerciseId, exerciseData);

      return {
        ...prev,
        exerciseDataMap: newDataMap
      };
    });
  }, []);

  // 从SSE添加新练习题 - 类似ChatHistoryContext的addExercise
  const addExerciseFromSSE = useCallback((messageId: string, exerciseUuid: string, exerciseType: string, questionData: any) => {
    console.log("ExerciseContext - 从SSE添加练习题:", messageId, exerciseUuid, exerciseType);

    // 创建初始练习题数据
    const initialExerciseData: ExerciseResultData = {
      exerciseUuid,
      exerciseType,
      questionData,
      answerData: undefined,
      status: {
        isCompleted: false,
        isCorrect: false
      },
      isCompleted: false,
      isCorrect: false,
      score: 0,
      feedback: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 添加到数据缓存
    setState(prev => {
      const newDataMap = new Map(prev.exerciseDataMap);
      newDataMap.set(exerciseUuid, initialExerciseData);

      return {
        ...prev,
        exerciseDataMap: newDataMap,
        // 设置为当前活跃练习题，这样会在BottomInputArea中显示
        currentExerciseId: exerciseUuid
      };
    });
  }, []);

  // 开始练习（未完成的练习题）
  const startExercise = useCallback(async (exerciseId: string) => {
    const exerciseData = await loadExerciseData(exerciseId);
    if (exerciseData) {
      setCurrentExerciseId(exerciseId);
      setRightPanelExerciseId(exerciseId);
    }
  }, [loadExerciseData, setCurrentExerciseId, setRightPanelExerciseId]);

  // 查看练习（已完成的练习题）
  const viewExercise = useCallback(async (exerciseId: string) => {
    const exerciseData = await loadExerciseData(exerciseId);
    if (exerciseData) {
      // 查看模式不设置currentExerciseId，只打开右侧面板
      setRightPanelExerciseId(exerciseId);
    }
  }, [loadExerciseData, setRightPanelExerciseId]);

  // 清理练习状态
  const clearExerciseState = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentExerciseId: null,
      rightPanelExerciseId: null
    }));
  }, []);

  // 工具方法
  const isExerciseLoading = useCallback((exerciseId: string): boolean => {
    return loadingRef.current.has(exerciseId);
  }, []);

  const isExerciseCompleted = useCallback((exerciseId: string): boolean => {
    const exercise = dataMapRef.current.get(exerciseId);
    return exercise?.status?.isCompleted ?? exercise?.isCompleted ?? false;
  }, []);

  const contextValue: ExerciseContextType = {
    // 核心状态
    exerciseDataMap: state.exerciseDataMap,
    currentExerciseId: state.currentExerciseId,
    rightPanelExerciseId: state.rightPanelExerciseId,
    loadingExercises: state.loadingExercises,

    // 计算属性
    currentExercise,
    rightPanelExercise,
    hasActiveExercise,
    showExerciseInRightPanel,

    // 基础操作方法
    setCurrentExerciseId,
    setRightPanelExerciseId,

    // 练习题数据管理
    getExerciseById,
    loadExerciseData,
    updateExerciseData,
    addExerciseData,
    addExerciseFromSSE,

    // 练习题操作
    startExercise,
    viewExercise,
    clearExerciseState,

    // 工具方法
    isExerciseLoading,
    isExerciseCompleted
  };

  return (
    <ExerciseContext.Provider value={contextValue}>
      {children}
    </ExerciseContext.Provider>
  );
}; 