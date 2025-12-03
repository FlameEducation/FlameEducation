import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedExerciseComponent } from '@/pages/chat/components/UnifiedExerciseComponent';
import { useExerciseContext } from '@/pages/chat/context/ExerciseContext';

export const ExerciseDisplayComponent: React.FC = () => {
  const { rightPanelExercise, setRightPanelExerciseId, setCurrentExerciseId, rightPanelExerciseId } = useExerciseContext();


  const handleClose = () => {
    setRightPanelExerciseId(null);
  };

  const handleComplete = (exerciseId: string) => {
    // 练习完成后清除当前练习和右侧面板
    setCurrentExerciseId(null);
    setRightPanelExerciseId(null);
  };

  const handleUnifiedComplete = (result: any) => {
    // 练习完成后的处理逻辑
  };

  if (!rightPanelExercise || !rightPanelExerciseId) {
    console.log('ExerciseDisplayComponent - No exercise, returning null');
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ 
          duration: 0.25,
          type: "spring",
          damping: 20,
          stiffness: 280 
        }}
        className="w-full h-full bg-white flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {rightPanelExercise.questionData?.title || '练习题'}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:scale-105 transition-transform"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 练习题内容 */}
        <div className="flex-1 overflow-auto">
          <UnifiedExerciseComponent
            exerciseId={rightPanelExerciseId}
            onComplete={handleUnifiedComplete}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExerciseDisplayComponent; 