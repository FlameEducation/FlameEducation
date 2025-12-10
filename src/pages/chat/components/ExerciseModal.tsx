import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { UnifiedExerciseComponent } from './UnifiedExerciseComponent';
import { useExerciseContext } from '@/pages/chat/context/ExerciseContext';

export const ExerciseModal: React.FC = () => {
  const { rightPanelExercise, setRightPanelExerciseId, showExerciseInRightPanel, rightPanelExerciseId } = useExerciseContext();
  const [isMobile, setIsMobile] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  
  // 检查是否为编程题
  const isProgrammingExercise = rightPanelExercise?.exerciseType === 'programming';

  // 监听屏幕尺寸变化
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md断点是768px
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 监听练习题数据变化，确保内容准备好后再显示动画
  useEffect(() => {
    if (rightPanelExercise && rightPanelExerciseId && showExerciseInRightPanel) {
      // 稍微延迟一下，确保内容渲染完成
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [rightPanelExercise, rightPanelExerciseId, showExerciseInRightPanel]);

  const handleClose = () => {
    // 立即关闭，不等待动画
    setContentReady(false);
    setRightPanelExerciseId(null);
  };

  const handleComplete = (exerciseId: string) => {
    // 练习完成后可以选择是否关闭
    // handleClose();
  };

  // 只在移动设备且有练习时显示模态框
  if (!isMobile) {
    return null;
  }

  return (
    <AnimatePresence>
      {showExerciseInRightPanel && rightPanelExercise && rightPanelExerciseId && contentReady && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* 模态框容器 - 使用flexbox居中 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.25,
                type: "spring",
                damping: 20,
                stiffness: 280 
              }}
              className={`relative w-[95vw] ${isProgrammingExercise ? 'h-[90vh]' : 'h-[85vh]'} bg-white rounded-xl 
                        shadow-2xl border border-gray-200 flex flex-col overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full 
                          bg-white/90 hover:bg-white shadow-lg border border-gray-200 
                          transition-all duration-200 hover:shadow-xl flex items-center 
                          justify-center hover:scale-105"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>

              {/* 练习题内容 */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <UnifiedExerciseComponent
                  exerciseId={rightPanelExerciseId}
                  onComplete={handleComplete}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}; 