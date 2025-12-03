import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StartLessonButtonProps {
  onStartLesson: () => void;
  isLoading?: boolean;
  showIcon?: boolean; // 控制是否显示图标，默认为true
}

export const StartLessonButton: React.FC<StartLessonButtonProps> = ({
  onStartLesson,
  isLoading = false,
  showIcon = true
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* 主要内容 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center space-y-6 relative z-10 max-w-sm"
      >
        {/* 图标区域 - 根据showIcon参数控制显示 */}
        {showIcon && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* 外圈动画 */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-sm"
            />
            
            {/* 主图标 */}
            <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
              
              {/* 小装饰图标 */}
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-2 h-2 text-white" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* 文字内容 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: showIcon ? 0.4 : 0.2 }}
          className={`text-center ${showIcon ? 'space-y-3' : 'space-y-4'}`}
        >
          <h3 className="text-lg font-bold text-gray-800">
            准备好开始学习了吗？
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            点击下方按钮开启学习之旅
          </p>
        </motion.div>

        {/* 主按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: showIcon ? 0.6 : 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={onStartLesson}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                      text-white px-6 py-3 rounded-full shadow-md hover:shadow-lg 
                      transition-all duration-300 font-medium text-base
                      disabled:opacity-50 disabled:cursor-not-allowed
                      relative overflow-hidden"
          >
            {/* 按钮背景动画 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
              animate={{
                x: [-100, 200]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <div className="flex items-center space-x-2 relative z-10">
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>连接中...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>开始这节课</span>
                </>
              )}
            </div>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}; 