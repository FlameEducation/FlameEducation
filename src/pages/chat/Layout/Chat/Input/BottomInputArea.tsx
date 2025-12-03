import React, { useState, useRef, useEffect } from 'react';
import { InputSwitcher } from './InputSwitcher';


import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MessageSquare, 
  Phone, 
  Radio, 
  Keyboard,
  ChevronDown,
  ChevronUp,

  Zap,
  Clock,
  Turtle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatViewMode, usePhoneSilenceDuration, useInputMode, useSelectedTeacher, useVoiceSpeed } from '@/contexts';

import { TeacherInfo } from '@/api/teacher';
import { listTtsProviders } from '@/api/tts-config';
import { getAsrActiveConfig } from '@/api/asr-active-config';

import { useClassStatusContext } from "@/pages/chat/context/ClassStatusContext";

interface BottomInputAreaProps {
  onSwitchToTeacherView?: () => void;
  onSwitchToListView?: () => void;
  isTeacherView?: boolean;
}

export const BottomInputArea: React.FC<BottomInputAreaProps> = ({
  onSwitchToTeacherView,
  onSwitchToListView,
  isTeacherView = true,
}) => {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  
  // 从Context获取教师列表
  const { availableTeachers, isTeachersLoaded } = useClassStatusContext();
  const [teachersLoading, setTeachersLoading] = useState(true);

  // 添加refs用于点击外部关闭弹窗
  const teacherSelectorRef = useRef<HTMLDivElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);
  const speedSelectorRef = useRef<HTMLDivElement>(null);
  
  // 使用新的Context hooks
  const [, setChatViewMode] = useChatViewMode();
  const [, setPhoneSilenceDuration] = usePhoneSilenceDuration();
  const [inputMode, setInputMode] = useInputMode();
  const [selectedTeacherUuid, setSelectedTeacherUuid] = useSelectedTeacher();
  const [voiceSpeed, setVoiceSpeed] = useVoiceSpeed();

  const [hasTts, setHasTts] = useState(true);
  const [hasAsr, setHasAsr] = useState(true);

  // 计算当前教师
  const currentTeacher = availableTeachers.find(t => t.uuid === selectedTeacherUuid) || availableTeachers[0] || null;

  useEffect(() => {
    const checkConfigs = async () => {
      if (!isTeachersLoaded) return;

      try {
        setTeachersLoading(true);
        
        // 1. 教师列表已由ClassStatusContext加载，这里直接使用availableTeachers
        // 但由于useEffect依赖availableTeachers，当它变化时会重新执行检查

        // 2. 检查TTS配置
        const ttsProviders = await listTtsProviders();
        const hasActiveTts = ttsProviders && ttsProviders.some(p => p.enabled);
        // 只有当有TTS服务且有可用教师时，才认为有TTS能力
        setHasTts(hasActiveTts && availableTeachers.length > 0);
        
        // 3. 检查ASR配置
        const asrConfig = await getAsrActiveConfig();
        // @ts-ignore
        const hasActiveAsr = !!asrConfig?.activeProvider || !!asrConfig?.data?.activeProvider;
        setHasAsr(hasActiveAsr);

        // 4. 初始化选中教师
        if (availableTeachers.length > 0) {
          let teacherToSelect = availableTeachers[0];
          // 如果已有选中的UUID，尝试匹配
          if (selectedTeacherUuid && !selectedTeacherUuid.startsWith('teacher-')) {
             const found = availableTeachers.find(t => t.uuid === selectedTeacherUuid);
             if (found) teacherToSelect = found;
          }
          
          // 更新选中状态
          if (teacherToSelect.uuid !== selectedTeacherUuid) {
             setSelectedTeacherUuid(teacherToSelect.uuid);
          }
        }

      } catch (error) {
        console.error("Failed to check configs", error);
      } finally {
        setTeachersLoading(false);
      }
    };
    checkConfigs();
  }, [availableTeachers, isTeachersLoaded]);

  useEffect(() => {
    if (isTeachersLoaded && !teachersLoading && !hasTts && isTeacherView) {
      handleSwitchToListView();
    }
  }, [hasTts, isTeacherView, teachersLoading, isTeachersLoaded]);

  useEffect(() => {
    if (!hasAsr && inputMode !== 'text') {
      setInputMode('text');
    }
  }, [hasAsr, inputMode]);

  // 动态获取教师配置
  const getTeacherDisplayName = (teacher: TeacherInfo) => {
    return teacher?.teacherName || '未知教师';
  };

  // 响应速度配置 - 简化为三档固定时间
  const speedConfig = {
    fast: { 
      label: '灵敏', 
      icon: Zap, 
      duration: 800, // 0.8s
      description: '快速响应',
      color: 'bg-gradient-to-r from-red-500 to-pink-500'
    },
    medium: { 
      label: '适中', 
      icon: Clock, 
      duration: 1200, // 1.2s
      description: '平衡体验',
      color: 'bg-gradient-to-r from-blue-500 to-indigo-500'
    },
    slow: { 
      label: '慢速', 
      icon: Turtle, 
      duration: 2000, // 2.0s
      description: '稳定输入',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500'
    }
  };

    // 处理切换到教师形象视图
  const handleSwitchToTeacherView = () => {
    if (!onSwitchToTeacherView) return;
    onSwitchToTeacherView();
    setChatViewMode('teacher'); // 自动开启TTS
  };

  // 处理切换到聊天模式
  const handleSwitchToListView = () => {
    if (!onSwitchToListView) return;
    onSwitchToListView();
    setChatViewMode('list'); // 自动关闭TTS
  };

  // 处理视图切换（统一按钮）
  const handleViewToggle = () => {
    if (isTeacherView) {
      handleSwitchToListView();
    } else {
      handleSwitchToTeacherView();
    }
  };

  // 处理响应速度变更
  const handleSpeedChange = (speed: keyof typeof speedConfig) => {
    setVoiceSpeed(speed);
    setPhoneSilenceDuration(speedConfig[speed].duration);
    setShowSpeedSelector(false);
  };

  // 获取当前速度配置
  const getCurrentSpeed = () => {
    return speedConfig[voiceSpeed];
  };

  // 处理教师切换
  const handleTeacherChange = (teacherUuid: string) => {
    setShowTeacherSelector(false);
    // 更新Context中的选中教师
    setSelectedTeacherUuid(teacherUuid);
  };

  // 点击外部关闭弹窗的处理函数
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // 检查教师选择器
      if (showTeacherSelector && teacherSelectorRef.current && !teacherSelectorRef.current.contains(target)) {
        setShowTeacherSelector(false);
      }
      
      // 检查模式选择器
      if (showModeSelector && modeSelectorRef.current && !modeSelectorRef.current.contains(target)) {
        setShowModeSelector(false);
      }
      
      // 检查速度选择器
      if (showSpeedSelector && speedSelectorRef.current && !speedSelectorRef.current.contains(target)) {
        setShowSpeedSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTeacherSelector, showModeSelector, showSpeedSelector]);

  // 输入模式配置
  const modeConfig = {
    text: {
      icon: Keyboard,
      label: '文字输入',
      description: '键盘打字交流',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    phone: {
      icon: Phone,
      label: '智能语音',
      description: '自然对话，智能断句',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    'walkie-talkie': {
      icon: Radio,
      label: '按键通话',
      description: '长按录音，松开发送',
      color: 'bg-gradient-to-r from-orange-500 to-red-500'
    }
  };

  const currentMode = modeConfig[inputMode];

  return (
    <div className="bottom-0 left-0 w-full relative z-[50]">
      {/* 上层：悬浮控制栏 */}
      <div className="flex items-center justify-between px-2 pb-2">
        {/* 左侧：视图切换和教师选择 */}
        <div className="flex items-center gap-1.5">
          {/* 视图切换按钮 */}
          <motion.button
            onClick={hasTts ? handleViewToggle : undefined}
            whileHover={hasTts ? { scale: 1.05 } : {}}
            whileTap={hasTts ? { scale: 0.95 } : {}}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-sm",
              "transition-all duration-200 relative group shadow-lg border border-gray-200/50",
              !hasTts ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" :
              isTeacherView 
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-400/50" 
                : "bg-white/90 text-gray-700 hover:bg-white/95"
            )}
            title={!hasTts ? "未配置语音合成服务，无法使用真人对话" : ""}
          >
            <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 
                             transition-colors duration-200" />
            {isTeacherView ? (
              <>
                <User className="w-3.5 h-3.5 relative" />
                <span className="text-xs font-medium relative">真人对话</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5 relative" />
                <span className="text-xs font-medium relative">聊天模式</span>
              </>
            )}
          </motion.button>

          {/* 教师选择器 - 仅在真人对话模式下显示 */}
          {isTeacherView && (
            <div className="relative" ref={teacherSelectorRef}>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowTeacherSelector(!showTeacherSelector)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl backdrop-blur-sm
                           bg-white/90 hover:bg-white/95 text-gray-700 transition-all duration-200 
                           relative group shadow-lg border border-gray-200/50"
              >
                <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 
                                 transition-colors duration-200" />
                <span className="text-xs font-medium relative max-w-[60px] truncate">
                  {teachersLoading ? '加载中...' : (selectedTeacherUuid ? getTeacherDisplayName(availableTeachers.find(t => t.uuid === selectedTeacherUuid) || currentTeacher || availableTeachers[0]) : '选择教师')}
                </span>
                {showTeacherSelector ? (
                  <ChevronUp className="w-3 h-3 relative flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 relative flex-shrink-0" />
                )}
              </motion.button>

              {/* 教师选择下拉框 */}
              <AnimatePresence>
                {showTeacherSelector && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full mb-4 left-0 z-50"
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
                      <div className="space-y-1">
                        {teachersLoading ? (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">加载教师列表...</div>
                        ) : availableTeachers.length > 0 ? (
                          availableTeachers.map((teacher) => (
                            <motion.button
                              key={teacher.uuid}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleTeacherChange(teacher.uuid)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-xl",
                                "transition-all duration-200 relative group min-w-[140px]",
                                selectedTeacherUuid === teacher.uuid
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                  : "text-gray-700 hover:bg-white/50"
                              )}
                            >
                              <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 
                                             transition-colors duration-200" />
                              <span className="text-sm font-medium relative">{getTeacherDisplayName(teacher)}</span>
                            </motion.button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">暂无可用教师</div>
                        )}
                      </div>
                    </div>
                    {/* 修复小三角样式 */}
                    <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/90 absolute -bottom-2 left-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 右侧：输入模式选择和响应速度 */}
        <div className="flex items-center gap-1.5">
          {/* 响应速度设置器 - 仅在智能语音模式下显示 */}
          {inputMode === 'phone' && (
            <div className="relative" ref={speedSelectorRef}>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl backdrop-blur-sm
                           bg-white/90 hover:bg-white/95 text-gray-700 transition-all duration-200 
                           relative group shadow-lg border border-gray-200/50"
              >
                <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 
                                 transition-colors duration-200" />
                {React.createElement(getCurrentSpeed().icon, { className: "w-3.5 h-3.5 relative" })}
                <span className="text-xs font-medium relative max-w-[40px] truncate">{getCurrentSpeed().label}</span>
                {showSpeedSelector ? (
                  <ChevronUp className="w-3 h-3 relative flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 relative flex-shrink-0" />
                )}
              </motion.button>

              {/* 速度选择下拉框 */}
              <AnimatePresence>
                {showSpeedSelector && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full mb-4 right-0 z-50"
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
                      <div className="space-y-1">
                        {Object.entries(speedConfig).map(([speed, config]) => (
                          <motion.button
                            key={speed}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSpeedChange(speed as keyof typeof speedConfig)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-xl",
                              "transition-all duration-200 relative group min-w-[140px]",
                              speed === voiceSpeed
                                ? config.color + " text-white"
                                : "text-gray-700 hover:bg-white/50"
                            )}
                          >
                            <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 
                                           transition-colors duration-200" />
                            <config.icon className="w-4 h-4 relative flex-shrink-0" />
                            <div className="text-left relative">
                              <div className="text-sm font-medium">{config.label}</div>
                              <div className={cn(
                                "text-xs opacity-80",
                                speed === voiceSpeed ? "text-white/80" : "text-gray-500"
                              )}>
                                {config.description}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    {/* 修复小三角样式 */}
                    <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/90 absolute -bottom-2 right-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 输入模式选择 */}
          <div className="relative" ref={modeSelectorRef}>
            <motion.button
              onClick={() => setShowModeSelector(!showModeSelector)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl backdrop-blur-sm
                         bg-white/90 hover:bg-white/95 text-gray-700 transition-all duration-200 
                         relative group shadow-lg border border-gray-200/50"
            >
              <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 
                               transition-colors duration-200" />
              <currentMode.icon className="w-3.5 h-3.5 relative" />
              <span className="text-xs font-medium relative max-w-[50px] truncate">{currentMode.label}</span>
              {showModeSelector ? (
                <ChevronUp className="w-3 h-3 relative flex-shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 relative flex-shrink-0" />
              )}
            </motion.button>

            {/* 模式选择下拉框 */}
            <AnimatePresence>
              {showModeSelector && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full mb-4 right-0 z-50"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
                    <div className="space-y-1">
                      {Object.entries(modeConfig)
                        .filter(([mode]) => hasAsr || mode === 'text')
                        .map(([mode, config]) => (
                        <motion.button
                          key={mode}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setInputMode(mode as typeof inputMode);
                            setShowModeSelector(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                            "transition-all duration-200 relative group min-w-[180px]",
                            inputMode === mode
                              ? config.color + " text-white"
                              : "text-gray-700 hover:bg-white/50"
                          )}
                        >
                          <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 
                                         transition-colors duration-200" />
                          <config.icon className="w-5 h-5 relative flex-shrink-0" />
                          <div className="text-left relative">
                            <div className="text-sm font-medium">{config.label}</div>
                            <div className={cn(
                              "text-xs opacity-80",
                              inputMode === mode ? "text-white/80" : "text-gray-500"
                            )}>
                              {config.description}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* 修复小三角样式 */}
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white/90 absolute -bottom-2 right-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 下层：输入/动作区域 */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-white/20 shadow-[0_-1px_20px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-3">
          <InputSwitcher inputMode={inputMode} currentTeacher={currentTeacher} />
        </div>
      </div>
    </div>
  );
}; 