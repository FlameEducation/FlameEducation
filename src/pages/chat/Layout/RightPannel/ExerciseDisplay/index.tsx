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
        {/* 练习题内容 */}
        <div className="flex-1 overflow-auto pt-4">
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