/**
 * 全局设置Context
 * 提供类型安全的配置管理，替代字符串式配置
 */

import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';

// ==================== 类型定义 ====================

export interface GlobalSettings {
  chatViewMode: 'teacher' | 'list';
  phoneSilenceDuration: number;
  // 输入模式相关设置
  inputMode: 'phone' | 'walkie-talkie' | 'text';
  selectedTeacherUuid: string | null;
  voiceSpeed: 'fast' | 'medium' | 'slow';
  blackboardZoomLevel: number;
}

// ==================== 默认值 ====================

const DEFAULT_SETTINGS: GlobalSettings = {
  chatViewMode: 'teacher',
  phoneSilenceDuration: 1000, // 1秒，单位毫秒（适中档位）
  // 输入模式默认值
  inputMode: 'phone',
  selectedTeacherUuid: null,
  voiceSpeed: 'medium',
  blackboardZoomLevel: 1,
};

// ==================== Context定义 ====================

interface GlobalSettingsContextType {
  // 聊天视图模式
  chatViewMode: 'teacher' | 'list';
  setChatViewMode: (value: 'teacher' | 'list') => void;
  
  // 语音录制相关  
  phoneSilenceDuration: number;
  setPhoneSilenceDuration: (value: number) => void;
  
  // 输入模式相关
  inputMode: 'phone' | 'walkie-talkie' | 'text';
  setInputMode: (value: 'phone' | 'walkie-talkie' | 'text') => void;
  
  selectedTeacherUuid: string | null;
  setSelectedTeacherUuid: (value: string | null) => void;
  
  voiceSpeed: 'fast' | 'medium' | 'slow';
  setVoiceSpeed: (value: 'fast' | 'medium' | 'slow') => void;

  blackboardZoomLevel: number;
  setBlackboardZoomLevel: (value: number) => void;
  
  // 工具方法
  getAllSettings: () => GlobalSettings;
  resetToDefaults: () => void;
  getTTSConfigForAPI: () => Record<string, string | number>;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

// ==================== LocalStorage工具函数 ====================

const SETTINGS_KEY = 'global_settings_v2'; // 新版本key，避免与旧版本冲突

const loadFromStorage = (): GlobalSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 过滤掉旧版本中可能存在的 ttsConfig
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ttsConfig, ...rest } = parsed;
      return { ...DEFAULT_SETTINGS, ...rest };
    }
  } catch (error) {
    console.warn('[GlobalSettings] 读取配置失败:', error);
  }
  return DEFAULT_SETTINGS;
};

const saveToStorage = (settings: GlobalSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[GlobalSettings] 保存配置失败:', error);
  }
};

// ==================== Provider组件 ====================

interface GlobalSettingsProviderProps {
  children: ReactNode;
}

export const GlobalSettingsProvider: React.FC<GlobalSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalSettings>(loadFromStorage);

  // 保存到localStorage
  useEffect(() => {
    saveToStorage(settings);
  }, [settings]);

  // ==================== Getter和Setter方法 ====================

  // 聊天视图模式
  const setChatViewMode = useCallback((value: 'teacher' | 'list') => {
    setSettings(prev => ({ ...prev, chatViewMode: value }));
  }, []);

  // 语音录制静默持续时间
  const setPhoneSilenceDuration = useCallback((value: number) => {
    setSettings(prev => ({ ...prev, phoneSilenceDuration: value }));
  }, []);

  // 输入模式
  const setInputMode = useCallback((value: 'phone' | 'walkie-talkie' | 'text') => {
    setSettings(prev => ({ ...prev, inputMode: value }));
  }, []);

  // 选中的教师UUID
  const setSelectedTeacherUuid = useCallback((value: string | null) => {
    setSettings(prev => ({ ...prev, selectedTeacherUuid: value }));
  }, []);

  // 语音速度
  const setVoiceSpeed = useCallback((value: 'fast' | 'medium' | 'slow') => {
    setSettings(prev => ({ ...prev, voiceSpeed: value }));
  }, []);

  // 黑板缩放
  const setBlackboardZoomLevel = useCallback((value: number) => {
    setSettings(prev => ({ ...prev, blackboardZoomLevel: value }));
  }, []);

  // ==================== 工具方法 ====================

  // 获取所有设置
  const getAllSettings = useCallback((): GlobalSettings => {
    return settings;
  }, [settings]);

  // 重置为默认值
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // 为API格式化TTS配置
  const getTTSConfigForAPI = useCallback((): Record<string, string | number> => {
    // 使用默认豆包配置
    return {
      voice_type: 'zh_female_roumeinvyou_emo_v2_mars_bigtts',
      emotion: '中性',
      emotion_scale: 1.0,
      encoding: 'mp3',
      loudness_ratio: 1.0,
      rate: 24000,
      language: 'zh',
    };
  }, []);

  // ==================== Context值 ====================

  const contextValue: GlobalSettingsContextType = {
    // 基础属性
    chatViewMode: settings.chatViewMode,
    setChatViewMode,
    
    phoneSilenceDuration: settings.phoneSilenceDuration,
    setPhoneSilenceDuration,
    
    // 输入模式相关属性
    inputMode: settings.inputMode || 'phone',
    setInputMode,
    
    selectedTeacherUuid: settings.selectedTeacherUuid || null,
    setSelectedTeacherUuid,
    
    voiceSpeed: settings.voiceSpeed || 'medium',
    setVoiceSpeed,

    blackboardZoomLevel: settings.blackboardZoomLevel || 1,
    setBlackboardZoomLevel,
    
    // 工具方法
    getAllSettings,
    resetToDefaults,
    getTTSConfigForAPI,
  };

  return (
    <GlobalSettingsContext.Provider value={contextValue}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};

// ==================== Hook ====================

export const useGlobalSettings = (): GlobalSettingsContextType => {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error('useGlobalSettings 必须在 GlobalSettingsProvider 内使用');
  }
  return context;
};

// ==================== 导出便捷Hook ====================

// 单独的Hook用于特定设置
export const useChatViewMode = () => {
  const { chatViewMode, setChatViewMode } = useGlobalSettings();
  return [chatViewMode, setChatViewMode] as const;
};

export const usePhoneSilenceDuration = () => {
  const { phoneSilenceDuration, setPhoneSilenceDuration } = useGlobalSettings();
  return [phoneSilenceDuration, setPhoneSilenceDuration] as const;
};

export const useInputMode = () => {
  const { inputMode, setInputMode } = useGlobalSettings();
  return [inputMode, setInputMode] as const;
};

export const useSelectedTeacher = () => {
  const { selectedTeacherUuid, setSelectedTeacherUuid } = useGlobalSettings();
  return [selectedTeacherUuid, setSelectedTeacherUuid] as const;
};

export const useVoiceSpeed = () => {
  const { voiceSpeed, setVoiceSpeed } = useGlobalSettings();
  return [voiceSpeed, setVoiceSpeed] as const;
};

export const useBlackboardZoom = () => {
  const { blackboardZoomLevel, setBlackboardZoomLevel } = useGlobalSettings();
  return [blackboardZoomLevel, setBlackboardZoomLevel] as const;
};

export const useTTSConfig = () => {
  const {
    getTTSConfigForAPI
  } = useGlobalSettings();
  
  return {
    // 工具方法
    getTTSConfigForAPI
  };
};
