import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles } from 'lucide-react';
import { LessonSettlement } from './LessonSettlement';
import { useClassStatusContext } from '@/pages/chat/context/ClassStatusContext';

export const LessonSettlementButton: React.FC = () => {
  const [showSettlement, setShowSettlement] = useState(false);
  const { lessonInfo, lessonUuid } = useClassStatusContext();

  const handleOpenSettlement = () => {
    setShowSettlement(true);
  };

  const handleCloseSettlement = () => {
    setShowSettlement(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {/* 课程完成提示 */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ 
            duration: 0.6,
            type: "spring",
            stiffness: 200
          }}
          className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-gray-800">恭喜！课程已完成</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-sm text-gray-600 text-center">
            您已成功完成本节课的学习，快来查看学习成果吧！
          </p>
        </motion.div>

        {/* 结算按钮 */}
        <Button
          onClick={handleOpenSettlement}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Trophy className="w-5 h-5" />
            </motion.div>
            <span className="text-lg">查看学习成果</span>
            <motion.div
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          </div>
        </Button>

        {/* 提示文字 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-500 mt-2"
        >
          点击按钮领取本次学习的奖励
        </motion.p>
      </motion.div>

      {/* 课程结算模态框 */}
      <LessonSettlement
        isOpen={showSettlement}
        onClose={handleCloseSettlement}
        lessonUuid={lessonUuid || ''}
        lessonTitle={lessonInfo?.lessonName || '课程学习'}
      />
    </>
  );
}; 