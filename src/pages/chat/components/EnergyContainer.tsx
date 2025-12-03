import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useEnergyOrb } from '../context/EnergyOrbContext.tsx';

// 能量容器组件Props
interface EnergyContainerProps {
  isTransformed: boolean;
  liquidPercentage: number;
  className?: string;
  // 尺寸控制参数
  widthRatio?: number; // 横向占父容器比例 (0-1)
  heightRatio?: number; // 纵向占父容器比例 (0-1)
  // 容器标识
  containerId: string;
}

// 独立的能量容器组件
export const EnergyContainer: React.FC<EnergyContainerProps> = ({
  isTransformed,
  liquidPercentage,
  className,
  widthRatio = 0.8,
  heightRatio = 0.8,
  containerId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 300, height: 200 });
  const { registerContainer, unregisterContainer, containerHitStates, showPercentage, energyOrbs } = useEnergyOrb();

  const [forceTransformed, setForceTransformed] = useState(false);
  const transform = isTransformed || forceTransformed;

  useEffect(() => {
    setForceTransformed(energyOrbs.length > 0);
  }, [energyOrbs]);

  // 获取当前容器的碰撞状态
  const isHit = containerHitStates.get(containerId) || false;

  // 动态计算容器尺寸
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const parentElement = containerRef.current.parentElement;
      if (!parentElement) return;

      // 获取父容器的实际可用空间
      const parentRect = parentElement.getBoundingClientRect();
      const parentWidth = parentRect.width;
      const parentHeight = parentRect.height;

      if (transform) {
        // 圆柱状态：根据比例占用父容器宽度和高度
        const targetWidth = parentWidth * widthRatio;
        const targetHeight = Math.min(parentHeight * heightRatio, parentHeight * 0.8); // 圆柱高度不超过父容器0.8
        setContainerSize({
          width: targetWidth,
          height: targetHeight
        });
      } else {
        // 圆形状态：根据比例计算正方形尺寸，取较小值保持圆形
        const availableSpace = Math.min(parentWidth * widthRatio, parentHeight * heightRatio);
        setContainerSize({
          width: availableSpace,
          height: availableSpace
        });
      }
    };

    // 初始计算
    updateSize();

    // 监听窗口大小变化
    window.addEventListener('resize', updateSize);

    // 监听父容器尺寸变化（使用ResizeObserver）
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(updateSize, 100); // 延迟执行确保DOM更新完成
      });
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [transform, widthRatio, heightRatio]);

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
      // 重新注册以更新位置
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
  }, [containerId, containerSize, registerContainer, unregisterContainer]);

  // 增强的液体形变动画
  const containerVariants = {
    circle: {
      width: containerSize.width,
      height: containerSize.height,
      borderRadius: containerSize.width / 2,
      // 圆球状态：定位在右侧
      position: 'absolute' as const,
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      // 碰撞反馈效果 - 微妙的3%放大
      scale: isHit ? 1.03 : 1,
      boxShadow: isHit
        ? '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3)'
        : '0 0 10px rgba(0, 0, 0, 0.2)',
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 0.8,
        duration: 0.1
      }
    },
    cylinder: {
      width: containerSize.width,
      height: containerSize.height,
      borderRadius: containerSize.height / 2,
      // 圆柱状态：占据父容器，右侧对齐不变，向左延伸
      position: 'absolute' as const,
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      // 碰撞反馈效果 - 微妙的3%放大
      scale: isHit ? 1.03 : 1,
      boxShadow: isHit
        ? '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3)'
        : '0 0 10px rgba(0, 0, 0, 0.2)',
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 0.8,
        duration: 0.1
      }
    }
  };

  // 液体动画变体
  const liquidVariants = {
    circle: {
      width: '100%',
      height: `${liquidPercentage}%`,
      borderRadius: `0 0 ${containerSize.width / 2}px ${containerSize.width / 2}px`,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        mass: 2,
        duration: 2.5
      }
    },
    cylinder: {
      width: `${liquidPercentage}%`,
      height: '100%',
      borderRadius: `${containerSize.height / 2 - 4}px`,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        mass: 2,
        duration: 2.5
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 动画容器 */}
      <motion.div
        ref={containerRef}
        className="border-4 border-gray-400/40 shadow-2xl overflow-hidden backdrop-blur-sm"
        variants={containerVariants}
        animate={transform ? "cylinder" : "circle"}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* 增强的液体主体 */}
        <motion.div
          className="absolute bottom-0 left-0 overflow-hidden"
          variants={liquidVariants}
          animate={transform ? "cylinder" : "circle"}
          style={{
            background: 'linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4)',
            backgroundSize: '300% 300%',
            filter: 'blur(0.5px)',
            boxShadow: `
              0 0 30px rgba(59, 130, 246, 0.4),
              inset 0 0 30px rgba(139, 92, 246, 0.2),
              inset 0 -10px 20px rgba(255, 255, 255, 0.1)
            `
          }}
        >
          {/* 背景渐变动画 */}
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              background: 'linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4)',
              backgroundSize: '300% 300%'
            }}
          />

          {/* 液体表面主要波动 */}
          <motion.div
            className="absolute bg-gradient-to-r from-white/60 via-white/40 to-white/20"
            animate={transform ? {
              top: 0,
              right: 0,
              width: [4, 8, 6, 4, 5],
              height: '100%',
              opacity: [0.7, 1, 0.8, 0.9, 0.7],
              scaleY: [1, 1.05, 0.98, 1.02, 1],
              borderRadius: [2, 4, 3, 2, 3]
            } : {
              top: 0,
              left: 0,
              width: '100%',
              height: [4, 8, 6, 4, 5],
              opacity: [0.7, 1, 0.8, 0.9, 0.7],
              scaleX: [1, 1.02, 0.99, 1.01, 1],
              borderRadius: [2, 4, 3, 2, 3]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
          />

          {/* 次级波纹层 */}
          <motion.div
            className="absolute bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={transform ? {
              top: '15%',
              right: 0,
              width: [2, 5, 3, 2, 4],
              height: '70%',
              opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
              scaleY: [1, 1.08, 0.95, 1.03, 1]
            } : {
              top: 0,
              left: '15%',
              width: '70%',
              height: [2, 5, 3, 2, 4],
              opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
              scaleX: [1, 1.03, 0.97, 1.01, 1]
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7
            }}
          />

          {/* 内部光泽增强 */}
          <motion.div
            className="absolute inset-1"
            animate={transform ? {
              borderRadius: `${containerSize.height / 2 - 5}px`,
              opacity: [0.3, 0.5, 0.4, 0.3],
              background: [
                'radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 70%)',
                'radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.5) 0%, transparent 70%)',
                'radial-gradient(ellipse at 30% 80%, rgba(255,255,255,0.4) 0%, transparent 70%)',
                'radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 70%)'
              ]
            } : {
              borderRadius: `0 0 ${containerSize.width / 2 - 4}px ${containerSize.width / 2 - 4}px`,
              opacity: [0.3, 0.6, 0.4, 0.3],
              background: [
                'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 70%)',
                'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.6) 0%, transparent 70%)',
                'radial-gradient(ellipse at 40% 10%, rgba(255,255,255,0.5) 0%, transparent 70%)',
                'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 70%)'
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* 动态气泡效果 */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white/50 rounded-full"
              animate={transform ? {
                x: [
                  20 + Math.random() * (containerSize.width - 60),
                  30 + Math.random() * (containerSize.width - 80),
                  10 + Math.random() * (containerSize.width - 40)
                ],
                y: [
                  15 + Math.random() * (containerSize.height - 40),
                  25 + Math.random() * (containerSize.height - 60),
                  20 + Math.random() * (containerSize.height - 50)
                ],
                scale: [0.3, 1.5, 0.8, 1.2, 0.4],
                opacity: [0, 0.8, 0.9, 0.6, 0],
                width: [2, 4, 3, 2, 1],
                height: [2, 4, 3, 2, 1]
              } : {
                x: [
                  30 + Math.random() * (containerSize.width - 80),
                  40 + Math.random() * (containerSize.width - 100),
                  20 + Math.random() * (containerSize.width - 60)
                ],
                y: [
                  40 + Math.random() * (containerSize.height - 100),
                  60 + Math.random() * (containerSize.height - 140),
                  50 + Math.random() * (containerSize.height - 120)
                ],
                scale: [0.3, 1.5, 0.8, 1.2, 0.4],
                opacity: [0, 0.8, 0.9, 0.6, 0],
                width: [2, 4, 3, 2, 1],
                height: [2, 4, 3, 2, 1]
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: i * 1.2,
                ease: "easeInOut"
              }}
            />
          ))}

          {/* 深度阴影效果 */}
          <motion.div
            className="absolute inset-0"
            animate={transform ? {
              borderRadius: `${containerSize.height / 2 - 4}px`,
              background: [
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 30%, transparent 100%)',
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 30%, transparent 100%)'
              ]
            } : {
              borderRadius: `0 0 ${containerSize.width / 2}px ${containerSize.width / 2}px`,
              background: [
                'linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.1) 30%, transparent 100%)',
                'linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                'linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.1) 30%, transparent 100%)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* 容器内壁反射 */}
        <motion.div
          className="absolute inset-3 border border-white/15 pointer-events-none"
          animate={transform ? {
            borderRadius: `${containerSize.height / 2 - 8}px`,
          } : {
            borderRadius: `${containerSize.width / 2 - 8}px`,
          }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 120,
            duration: 2
          }}
        />

        {/* 百分比数字显示 - 仅在圆形状态下显示 */}
        {showPercentage && !transform && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="text-white font-bold text-center drop-shadow-lg"
              style={{
                fontSize: Math.min(containerSize.width * 0.25, 48),
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.3)'
              }}
              animate={isHit ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              } : {}}
              transition={{ duration: 0.1 }}
            >
              {Math.round(liquidPercentage)}%
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}; 