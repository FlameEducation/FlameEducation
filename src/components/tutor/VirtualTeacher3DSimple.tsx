import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface VirtualTeacher3DSimpleProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'thinking' | 'teaching' | 'listening';
  speaking?: boolean;
  className?: string;
}

// 简化版3D教师组件 - 使用CSS 3D效果模拟
const VirtualTeacher3DSimple: React.FC<VirtualTeacher3DSimpleProps> = ({
  size = 'md',
  mood = 'happy',
  speaking = false,
  className
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载时间
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // 尺寸映射
  const sizeMap = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96'
  };

  // 心情颜色映射
  const moodColors = {
    happy: 'from-green-400 to-blue-500',
    thinking: 'from-yellow-400 to-orange-500',
    teaching: 'from-blue-400 to-purple-500',
    listening: 'from-purple-400 to-pink-500'
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200",
        sizeMap[size],
        className
      )}
      animate={{
        scale: speaking ? [1, 1.02, 1] : 1,
      }}
      transition={{
        repeat: speaking ? Infinity : 0,
        duration: 2,
        ease: "easeInOut"
      }}
      style={{
        perspective: '1000px'
      }}
    >
      {/* 加载状态 */}
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* 3D效果容器 */}
          <motion.div
            className="w-full h-full relative"
            animate={{
              rotateY: speaking ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              repeat: speaking ? Infinity : 0,
              duration: 3,
              ease: "easeInOut"
            }}
            style={{
              transformStyle: 'preserve-3d'
            }}
          >
            {/* 虚拟教师形象 - 使用渐变和阴影创建深度感 */}
            <div className="absolute inset-4 rounded-xl overflow-hidden">
              {/* 背景层 */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-20",
                moodColors[mood]
              )} />
              
              {/* 头部 */}
              <motion.div
                className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg"
                animate={{
                  y: speaking ? [0, -5, 0] : 0,
                }}
                transition={{
                  repeat: speaking ? Infinity : 0,
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
                {/* 眼睛 */}
                <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-gray-800 rounded-full" />
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-gray-800 rounded-full" />
                
                {/* 嘴巴 */}
                <motion.div
                  className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-8 h-2 bg-gray-600 rounded-full"
                  animate={speaking ? {
                    scaleY: [1, 1.5, 1],
                  } : {}}
                  transition={{
                    repeat: speaking ? Infinity : 0,
                    duration: 0.5,
                  }}
                />
              </motion.div>
              
              {/* 身体 */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-gray-400 to-gray-500 rounded-t-3xl shadow-xl" />
              
              {/* 3D光影效果 */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
            </div>
          </motion.div>

          {/* 状态指示器 */}
          <div className="absolute bottom-4 right-4">
            <motion.div
              className={cn(
                "w-3 h-3 rounded-full shadow-md",
                mood === 'happy' && "bg-green-400",
                mood === 'thinking' && "bg-yellow-400",
                mood === 'teaching' && "bg-blue-400",
                mood === 'listening' && "bg-purple-400"
              )}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* 语音波纹效果 */}
          {speaking && (
            <div className="absolute inset-0 pointer-events-none">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-full h-full"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.3, 0],
                    scale: [0.8, 1.2, 1.4],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    delay: index * 0.3,
                  }}
                >
                  <div className="w-full h-full rounded-full border-2 border-primary/20" />
                </motion.div>
              ))}
            </div>
          )}

          {/* 底部信息 */}
          {size === 'lg' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm
                       rounded-lg px-3 py-2 shadow-md"
            >
              <p className="text-sm font-medium">3D虚拟教师</p>
              <p className="text-xs text-gray-500">AI驱动的教学助手</p>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default VirtualTeacher3DSimple;