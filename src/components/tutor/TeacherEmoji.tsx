import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TeacherEmojiProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'thinking' | 'teaching' | 'listening';
  speaking?: boolean;
  character?: 'duck' | 'cat' | 'bear' | 'robot';
}

const TeacherEmoji: React.FC<TeacherEmojiProps> = ({ 
  size = 'md', 
  mood = 'happy',
  speaking = false,
  character = 'duck'
}) => {
  // 不同角色的颜色主题
  const themes = {
    duck: {
      body: "from-yellow-300 to-yellow-400",
      belly: "bg-yellow-200",
      cheek: "bg-pink-300/60",
      mouth: "bg-orange-400",
      // 添加鸭子特有的喙
      beak: "before:absolute before:bottom-[28%] before:left-1/2 before:-translate-x-1/2 before:w-[30%] before:h-[15%] before:bg-orange-400 before:rounded-full",
      // 添加鸭子特有的翅膀
      wings: "after:absolute after:top-1/2 after:left-0 after:w-[20%] after:h-[30%] after:bg-yellow-300 after:rounded-full after:transform after:-translate-x-1/4 after:-rotate-15 before:absolute before:top-1/2 before:right-0 before:w-[20%] before:h-[30%] before:bg-yellow-300 before:rounded-full before:transform before:translate-x-1/4 before:rotate-15"
    },
    cat: {
      body: "from-gray-200 to-gray-300",
      belly: "bg-white",
      cheek: "bg-pink-200/60",
      mouth: "bg-pink-300",
      // 猫耳朵更可爱的版本
      ears: "before:absolute before:-top-[15%] before:left-[15%] before:w-[30%] before:h-[40%] before:bg-gray-300 before:rounded-tl-[100px] before:rounded-tr-[100px] before:rotate-[-15deg] after:absolute after:-top-[15%] after:right-[15%] after:w-[30%] after:h-[40%] after:bg-gray-300 after:rounded-tl-[100px] after:rounded-tr-[100px] after:rotate-[15deg]",
      // 添加猫胡须
      whiskers: "before:absolute before:top-[45%] before:left-0 before:w-[40%] before:h-[1px] before:bg-gray-400 before:-translate-x-[60%] after:absolute after:top-[45%] after:right-0 after:w-[40%] after:h-[1px] after:bg-gray-400 after:translate-x-[60%]",
      // 添加猫尾巴
      tail: "after:absolute after:bottom-0 after:right-0 after:w-[60%] after:h-[80%] after:border-r-4 after:border-gray-300 after:rounded-full after:transform after:translate-x-1/2 after:rotate-45"
    },
    bear: {
      body: "from-amber-400 to-amber-500",
      belly: "bg-amber-200",
      cheek: "bg-amber-200/60",
      mouth: "bg-amber-700",
      // 熊耳朵更立体的版本
      ears: "before:absolute before:-top-[10%] before:left-[10%] before:w-[35%] before:h-[35%] before:bg-amber-500 before:rounded-full before:shadow-inner after:absolute after:-top-[10%] after:right-[10%] after:w-[35%] after:h-[35%] after:bg-amber-500 after:rounded-full after:shadow-inner",
      // 添加熊鼻子
      nose: "before:absolute before:top-[40%] before:left-1/2 before:-translate-x-1/2 before:w-[15%] before:h-[15%] before:bg-amber-900 before:rounded-full",
      // 添加熊爪子
      paws: "after:absolute after:bottom-[10%] after:left-[10%] after:w-[20%] after:h-[20%] after:bg-amber-600 after:rounded-full after:shadow-inner before:absolute before:bottom-[10%] before:right-[10%] before:w-[20%] before:h-[20%] before:bg-amber-600 before:rounded-full before:shadow-inner"
    },
    robot: {
      body: "from-blue-500 to-blue-600",
      belly: "bg-gray-200",
      cheek: "bg-blue-300/40",
      mouth: "bg-gray-700",
      // 机器人天线更复杂的版本
      antenna: "before:absolute before:-top-[20%] before:left-1/2 before:-translate-x-1/2 before:w-[10%] before:h-[20%] before:bg-yellow-400 before:rounded-full before:shadow-glow-yellow after:absolute after:-top-[30%] after:left-1/2 after:-translate-x-1/2 after:w-[20%] after:h-[5%] after:bg-blue-300 after:rounded-full",
      // 添加机器人装饰性元素
      circuits: "after:absolute after:inset-[10%] after:border-2 after:border-blue-300 after:rounded-lg after:opacity-50",
      // 添加机械眼睛的发光效果
      eyeGlow: "before:absolute before:inset-0 before:bg-blue-400 before:opacity-20 before:animate-pulse"
    }
  };

  const theme = themes[character];

  return (
    <motion.div
      className={cn(
        "relative",
        size === 'sm' && "w-16 h-16",
        size === 'md' && "w-24 h-24",
        size === 'lg' && "w-64 h-64",
        theme.circuits, // 添加电路图案
        theme.whiskers, // 添加猫胡须
        theme.paws, // 添加熊爪子
        character === 'robot' && theme.eyeGlow // 添加机器人眼睛发光效果
      )}
      animate={{
        scale: speaking ? [1, 1.05, 1] : 1,
      }}
      transition={{ repeat: speaking ? Infinity : 0, duration: 1 }}
    >
      {/* 身体 */}
      <div className={cn(
        "absolute inset-0",
        character === 'robot' && "rounded-2xl",
        character !== 'robot' && "rounded-3xl",
        theme.ears
      )}>
        <div className={cn(
          "w-full h-full bg-gradient-to-b",
          theme.body
        )} />
        {/* 肚子 */}
        <div className={cn(
          "absolute inset-x-[20%] bottom-[20%] top-[40%] rounded-full",
          theme.belly,
          character === 'robot' && "rounded-lg grid grid-cols-2 gap-2 p-2"
        )}>
          {character === 'robot' ? (
            <>
              <div className="bg-blue-300 rounded" />
              <div className="bg-blue-300 rounded" />
              <div className="bg-blue-300 rounded" />
              <div className="bg-blue-300 rounded" />
            </>
          ) : (
            <>
              <div className="absolute inset-x-[20%] bottom-[20%] top-[40%] bg-yellow-200 rounded-full" />
            </>
          )}
        </div>
      </div>

      {/* 眼睛 */}
      <motion.div 
        className="absolute w-full h-full"
        animate={mood === 'thinking' ? {
          rotate: [-5, 5, -5]
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {character === 'robot' ? (
          // 机器人的像素风格眼睛
          <>
            <div className="absolute top-[30%] left-[25%] w-[15%] h-[15%] bg-blue-200 rounded-sm">
              <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-white rounded-sm" />
            </div>
            <div className="absolute top-[30%] right-[25%] w-[15%] h-[15%] bg-blue-200 rounded-sm">
              <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-white rounded-sm" />
            </div>
          </>
        ) : (
          // 其他角色的圆形眼睛
          <>
            <div className="absolute top-[30%] left-[25%] w-[15%] h-[15%] bg-white rounded-full">
              <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-black rounded-full" />
            </div>
            <div className="absolute top-[30%] right-[25%] w-[15%] h-[15%] bg-white rounded-full">
              <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-black rounded-full" />
            </div>
          </>
        )}
      </motion.div>

      {/* 嘴巴 */}
      <motion.div 
        className={cn(
          "absolute left-1/2 -translate-x-1/2 w-[40%] h-[10%]",
          mood === 'happy' ? "bottom-[30%]" : "bottom-[25%]"
        )}
        animate={mood === 'happy' ? {
          height: ['10%', '15%', '10%']
        } : mood === 'thinking' ? {
          x: [-5, 5, -5]
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className={cn(
          "w-full h-full rounded-full",
          theme.mouth
        )} />
        {mood === 'happy' && (
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 w-[80%] h-[60%] rounded-full",
            character === 'robot' ? "bg-gray-500" : "bg-red-300"
          )} />
        )}
      </motion.div>

      {/* 腮红 */}
      {character !== 'robot' && (
        <>
          <div className={cn(
            "absolute top-[40%] left-[15%] w-[12%] h-[12%] rounded-full opacity-60",
            theme.cheek
          )} />
          <div className={cn(
            "absolute top-[40%] right-[15%] w-[12%] h-[12%] rounded-full opacity-60",
            theme.cheek
          )} />
        </>
      )}

      {/* 机器人特有的装饰 */}
      {character === 'robot' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10%] h-[10%] bg-yellow-400 rounded-full" />
      )}
    </motion.div>
  );
};

export default TeacherEmoji; 