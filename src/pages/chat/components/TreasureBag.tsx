import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnergyOrb } from '@/pages/chat/context/EnergyOrbContext.tsx';

// 钱袋子组件Props
interface TreasureBagProps {
  size: number; // 1:1正方形尺寸
  coinCount: number; // 金币数量，用于计算阶段
  containerId: string;
  className?: string;
}

// 钱袋子组件
export const TreasureBag: React.FC<TreasureBagProps> = ({
  size,
  coinCount,
  containerId,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerContainer, unregisterContainer, containerHitStates, energyOrbs } = useEnergyOrb();

  // 获取当前容器的碰撞状态
  const isHit = containerHitStates.get(containerId) || false;

  // 钱袋四个阶段：空(0-24)、少量(25-49)、中等(50-74)、满载(75-100)
  const getStage = (count: number) => {
    if (count <= 24) return { 
      stage: 'empty', 
      name: '空袋',
      fallbackEmoji: '👜'
    };
    if (count <= 49) return { 
      stage: 'light', 
      name: '少量',
      fallbackEmoji: '🪙'
    };
    if (count <= 74) return { 
      stage: 'medium', 
      name: '中等',
      fallbackEmoji: '💰'
    };
    return { 
      stage: 'full', 
      name: '满载',
      fallbackEmoji: '💎'
    };
  };

  const currentStage = getStage(coinCount);

  // 图片加载状态
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 注册容器位置到Context
  useEffect(() => {
    const getPosition = () => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // 计算容器的绝对中心位置
      const centerX = rect.left + rect.width / 2 + scrollX;
      const centerY = rect.top + rect.height / 2 + scrollY;

      return { x: centerX, y: centerY };
    };

    // 注册容器
    registerContainer(containerId, getPosition);

    // 监听滚动事件，实时更新位置
    const handleScroll = () => {
      registerContainer(containerId, getPosition);
    };

    // 监听窗口大小变化
    const handleResize = () => {
      registerContainer(containerId, getPosition);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // 高频率更新位置确保准确性
    const timer = setInterval(() => {
      registerContainer(containerId, getPosition);
    }, 50); // 50ms间隔更新

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearInterval(timer);
      unregisterContainer(containerId);
    };
  }, [containerId, registerContainer, unregisterContainer]);

  // 钱袋动画变体
  const bagVariants = {
    initial: {
      scale: 1,
      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))',
    },
    hit: {
      scale: 1.05,
      filter: 'drop-shadow(0 15px 35px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 30px rgba(255, 215, 0, 0.4))',
      transition: {
        duration: 0.15,
        ease: "easeOut"
      }
    }
  };

  // 根据金币数量计算金光强度
  const getGlowIntensity = () => {
    if (coinCount === 0) return 0;
    return Math.min(coinCount / 50, 1); // 50个金币达到最大效果
  };

  const glowIntensity = getGlowIntensity();

  return (
    <div className={`relative ${className}`}>
      {/* 精致流光溢彩效果 */}
      {glowIntensity > 0 && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          {/* 流光扫过效果 */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                `linear-gradient(45deg, 
                  transparent 0%, 
                  transparent 30%, 
                  rgba(255, 215, 0, ${glowIntensity * 0.3}) 50%, 
                  rgba(255, 193, 7, ${glowIntensity * 0.5}) 52%, 
                  rgba(255, 235, 59, ${glowIntensity * 0.4}) 54%, 
                  transparent 70%, 
                  transparent 100%)`,
                `linear-gradient(45deg, 
                  transparent 0%, 
                  transparent 80%, 
                  rgba(255, 215, 0, ${glowIntensity * 0.3}) 90%, 
                  rgba(255, 193, 7, ${glowIntensity * 0.5}) 92%, 
                  rgba(255, 235, 59, ${glowIntensity * 0.4}) 94%, 
                  transparent 100%)`,
                `linear-gradient(45deg, 
                  rgba(255, 215, 0, ${glowIntensity * 0.3}) 0%, 
                  rgba(255, 193, 7, ${glowIntensity * 0.5}) 2%, 
                  rgba(255, 235, 59, ${glowIntensity * 0.4}) 4%, 
                  transparent 20%, 
                  transparent 100%)`
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* 边缘金光勾勒 */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              boxShadow: `inset 0 0 0 1px rgba(255, 215, 0, ${glowIntensity * 0.4})`,
              background: `
                radial-gradient(circle at 20% 20%, rgba(255, 215, 0, ${glowIntensity * 0.15}) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 193, 7, ${glowIntensity * 0.15}) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 235, 59, ${glowIntensity * 0.1}) 0%, transparent 50%),
                radial-gradient(circle at 20% 80%, rgba(255, 215, 0, ${glowIntensity * 0.1}) 0%, transparent 50%)
              `
            }}
            animate={{
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* 顶部高光条 */}
          <motion.div
            className="absolute top-2 left-1/4 right-1/4 h-0.5 rounded-full"
            style={{
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 255, 255, ${glowIntensity * 0.8}) 50%, 
                transparent 100%)`
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scaleX: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </motion.div>
      )}

      {/* 微妙吸引效果 */}
      <AnimatePresence>
        {energyOrbs.length > 0 && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* 边缘吸引光晕 */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                boxShadow: `
                  inset 0 0 0 1px rgba(139, 69, 19, 0.2),
                  0 0 8px rgba(139, 69, 19, 0.1)
                `
              }}
              animate={{
                boxShadow: [
                  `inset 0 0 0 1px rgba(139, 69, 19, 0.2), 0 0 8px rgba(139, 69, 19, 0.1)`,
                  `inset 0 0 0 1px rgba(139, 69, 19, 0.4), 0 0 12px rgba(139, 69, 19, 0.2)`,
                  `inset 0 0 0 1px rgba(139, 69, 19, 0.2), 0 0 8px rgba(139, 69, 19, 0.1)`
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* 内部吸引涟漪 */}
            <motion.div
              className="absolute inset-2 rounded-xl opacity-20"
              style={{
                background: `radial-gradient(circle, 
                  transparent 0%, 
                  rgba(139, 69, 19, 0.1) 70%, 
                  transparent 100%)`
              }}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 钱袋主体容器 */}
      <motion.div
        ref={containerRef}
        className="relative overflow-visible"
        animate={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        variants={bagVariants}
        initial="initial"
        style={isHit ? bagVariants.hit : bagVariants.initial}
      >
        {/* 钱袋图片或降级显示 */}
        {!imageError ? (
          <motion.img
            src="/assets/treasure-bag.png"
            alt={`钱袋-${currentStage.name}`}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
            style={{
              filter: isHit ? 'brightness(1.2) saturate(1.3)' : 'brightness(1)',
              transition: 'filter 0.15s ease-out'
            }}
          />
        ) : (
          // 降级显示：使用emoji和简单样式
          <motion.div
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-200 rounded-2xl border-4 border-amber-300"
            animate={isHit ? {
              scale: [1, 1.1, 1],
              backgroundColor: ['#FEF3C7', '#FDE68A', '#FEF3C7']
            } : {}}
            transition={{ duration: 0.2 }}
          >
            <div 
              className="text-center"
              style={{ fontSize: `${size * 0.3}px` }}
            >
              {currentStage.fallbackEmoji}
            </div>
          </motion.div>
        )}

        {/* 加载状态 */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-2xl animate-pulse">
            <div className="text-gray-400 text-sm">💎</div>
          </div>
        )}

        {/* 碰撞时的闪光效果 */}
        {isHit && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)',
              zIndex: 20
            }}
          />
        )}


      </motion.div>
    </div>
  );
}; 