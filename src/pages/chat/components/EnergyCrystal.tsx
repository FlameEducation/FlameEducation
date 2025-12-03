import React, { useState } from 'react';
import { motion } from 'framer-motion';

// 能量水晶组件Props
interface EnergyCrystalProps {
  orb: {
    id: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    color: string;
    delay: number;
    hasHit: boolean;
  };
  onAnimationComplete: (orbId: string) => void;
}

// 能量水晶组件
export const EnergyCrystal: React.FC<EnergyCrystalProps> = ({ orb, onAnimationComplete }) => {
  const [imageError, setImageError] = useState(false);
  
  // 根据颜色选择对应的水晶图片
  const getCrystalImage = (color: string) => {
    const colorMap: { [key: string]: string } = {
      '#ff6b6b': '/assets/crystal-red.png',
      '#4ecdc4': '/assets/crystal-cyan.png', 
      '#45b7d1': '/assets/crystal-blue.png',
      '#96ceb4': '/assets/crystal-green.png',
      '#feca57': '/assets/crystal-yellow.png',
      '#ff9ff3': '/assets/crystal-pink.png'
    };
    return colorMap[color] || '/assets/crystal-blue.png'; // 默认蓝色
  };

  // 能量水晶动画变体
  const crystalVariants = {
    initial: {
      x: orb.startX - 16,
      y: orb.startY - 16,
      scale: 0,
      opacity: 0,
      rotate: 0
    },
    animate: {
      x: orb.targetX - 16,
      y: orb.targetY - 16,
      scale: [0, 1.2, 1, 1.5, 0],
      opacity: [0, 1, 1, 1, 0],
      rotate: [0, 180, 360, 540, 720],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        times: [0, 0.2, 0.7, 0.9, 1],
        delay: orb.delay
      }
    }
  };

  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      variants={crystalVariants}
      initial="initial"
      animate="animate"
      exit={{ scale: 0, opacity: 0 }}
      onAnimationComplete={() => onAnimationComplete(orb.id)}
      style={{
        width: 32,
        height: 32,
        top: 0,
        left: 0
      }}
    >
      {/* 能量水晶图片或降级显示 */}
      {!imageError ? (
        <motion.img
          src={getCrystalImage(orb.color)}
          alt="能量水晶"
          className="w-full h-full object-contain"
          style={{
            filter: `drop-shadow(0 0 8px ${orb.color}aa) drop-shadow(0 0 16px ${orb.color}66)`,
          }}
          onError={() => setImageError(true)}
          animate={{
            filter: [
              `drop-shadow(0 0 8px ${orb.color}aa) drop-shadow(0 0 16px ${orb.color}66)`,
              `drop-shadow(0 0 12px ${orb.color}ff) drop-shadow(0 0 24px ${orb.color}aa)`,
              `drop-shadow(0 0 8px ${orb.color}aa) drop-shadow(0 0 16px ${orb.color}66)`
            ]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ) : (
        // 降级显示：使用CSS创建水晶形状
        <motion.div
          className="w-full h-full relative"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${orb.color}ff, ${orb.color}aa, ${orb.color}66)`,
            boxShadow: `
              0 0 20px ${orb.color}aa,
              0 0 40px ${orb.color}66,
              inset 2px 2px 4px rgba(255,255,255,0.3)
            `,
            clipPath: 'polygon(50% 0%, 80% 30%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 30%)',
          }}
          animate={{
            boxShadow: [
              `0 0 20px ${orb.color}aa, 0 0 40px ${orb.color}66, inset 2px 2px 4px rgba(255,255,255,0.3)`,
              `0 0 30px ${orb.color}ff, 0 0 60px ${orb.color}aa, inset 2px 2px 4px rgba(255,255,255,0.5)`,
              `0 0 20px ${orb.color}aa, 0 0 40px ${orb.color}66, inset 2px 2px 4px rgba(255,255,255,0.3)`
            ]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* 水晶内部闪光 */}
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: [0.3, 0.8, 0.5, 0.9, 0.4],
              scale: [0.8, 1.1, 0.9, 1.2, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.6) 0%, transparent 70%)',
              clipPath: 'polygon(50% 0%, 80% 30%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 30%)'
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}; 