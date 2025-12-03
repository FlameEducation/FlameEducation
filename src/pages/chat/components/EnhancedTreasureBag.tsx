import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnergyOrb } from '@/pages/chat/context/EnergyOrbContext.tsx';

// 光点粒子接口
export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  angle: number;
  distance: number;
  color: string;
  delay: number;
}

// 钱袋子组件Props
export interface EnhancedTreasureBagProps {
  size: number;
  particleCount: number;
  isBlackHole: boolean;
  glowIntensity: number;
  particleSize: number;
  particleOpacity: number;
  containerId: string; // 添加回 containerId
  brightness?: number; // 新增亮度属性
  className?: string; // 添加 className
}

export const EnhancedTreasureBag: React.FC<EnhancedTreasureBagProps> = ({ 
  size, 
  particleCount, 
  isBlackHole, 
  glowIntensity,
  particleSize,
  particleOpacity,
  containerId, // 添加回 containerId
  brightness = 1, // 默认亮度为1
  className = '', // 添加 className
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerContainer, unregisterContainer, containerHitStates } = useEnergyOrb(); // 获取碰撞状态
  const isHit = containerHitStates.get(containerId) || false;

  // 注册容器位置
  useEffect(() => {
    if (!containerRef.current) return;
    
    const getPosition = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      return {
        x: rect.left + rect.width / 2 + scrollX,
        y: rect.top + rect.height / 2 + scrollY,
      };
    };

    registerContainer(containerId, getPosition);

    return () => {
      unregisterContainer(containerId);
    };
  }, [containerId, registerContainer, unregisterContainer, size]); // size 变化时需要重新注册

  // 生成粒子系统
  useEffect(() => {
    const newParticles: Particle[] = [];
    const centerX = size / 2;
    const centerY = size / 2;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const distance = size * 0.4 + Math.random() * (size * 0.2); // 距离中心40%-60%
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      const colors = [
        'rgba(255, 215, 0, 1)',   // 金色
        'rgba(255, 193, 7, 1)',   // 琥珀色
        'rgba(255, 235, 59, 1)',  // 亮黄色
        'rgba(255, 255, 255, 1)', // 纯白色
        'rgba(255, 206, 84, 1)',  // 浅金色
        'rgba(255, 165, 0, 1)',   // 橙色
      ];

      newParticles.push({
        id: i,
        x,
        y,
        size: particleSize * (0.8 + Math.random() * 0.4),
        opacity: particleOpacity * (0.6 + Math.random() * 0.8),
        speed: 0.5 + Math.random() * 1.5,
        angle,
        distance,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2
      });
    }
    
    setParticles(newParticles);
  }, [particleCount, size, particleSize, particleOpacity]);

  return (
    <motion.div 
      className="relative" 
      initial={false} // 禁止首次渲染时的尺寸动画
      animate={{ width: size, height: size }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      {/* 粒子系统容器 */}
      <div 
        ref={containerRef} // 将 ref 应用到这个容器
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ zIndex: 1 }}
      >
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
                filter: `drop-shadow(0 0 ${2 + particle.size}px ${particle.color}) blur(0.2px)`,
              }}
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
                scale: 0,
              }}
              animate={
                isBlackHole ? {
                  // 黑洞模式：向中心汇聚
                  x: size / 2,
                  y: size / 2,
                  opacity: [particle.opacity, 1, 0],
                  scale: [1, 1.5, 0],
                } : {
                  // 正常模式：围绕闪烁
                  x: [
                    particle.x,
                    particle.x + Math.cos(particle.angle + Math.PI/4) * (size * 0.05),
                    particle.x + Math.cos(particle.angle + Math.PI/2) * (size * 0.08),
                    particle.x + Math.cos(particle.angle + Math.PI) * (size * 0.03),
                    particle.x
                  ],
                  y: [
                    particle.y,
                    particle.y + Math.sin(particle.angle + Math.PI/4) * (size * 0.05),
                    particle.y + Math.sin(particle.angle + Math.PI/2) * (size * 0.08),
                    particle.y + Math.sin(particle.angle + Math.PI) * (size * 0.03),
                    particle.y
                  ],
                  opacity: [
                    particle.opacity,
                    particle.opacity * 1.5,
                    particle.opacity * 0.5,
                    particle.opacity * 1.2,
                    particle.opacity
                  ],
                  scale: [
                    1,
                    1.5,
                    0.8,
                    1.3,
                    1
                  ],
                }
              }
              transition={
                isBlackHole ? {
                  duration: 2 + Math.random(),
                  delay: particle.delay * 0.5,
                  ease: [0.55, 0.055, 0.675, 0.19], // "easeInQuint"
                  repeat: Infinity,
                  repeatDelay: 1, // 每次循环之间的延迟
                } : {
                  duration: 4 + particle.speed,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: "easeInOut"
                }
              }
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 钱袋图片 */}
      <div className="relative" style={{ zIndex: 2 }}>
        <motion.img
          src="/assets/treasure-bag.png"
          alt="treasure bag"
          className="w-full h-full object-contain"
          animate={{
            scale: isHit ? 1.15 : 1,
            filter: `${
              isBlackHole
                ? `brightness(${brightness * 1.2}) contrast(1.1) drop-shadow(0 0 ${10 * glowIntensity}px rgba(255, 215, 0, ${0.6 * glowIntensity}))`
                : `brightness(${brightness}) contrast(1) drop-shadow(0 0 ${5 * glowIntensity}px rgba(255, 215, 0, ${0.3 * glowIntensity}))`
            } ${isHit ? 'brightness(1.5) saturate(1.2)' : ''}`
          }}
          transition={{ 
            scale: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }, // "easeOutQuint" for scale
            filter: { duration: 0.1, ease: "easeOut" } // Faster transition for filter
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
          }}
        />
        
        {/* 降级显示 */}
        <div 
          className="w-full h-full bg-amber-100 rounded-2xl border-2 border-amber-300 hidden items-center justify-center text-6xl"
          style={{ fontSize: `${size * 0.4}px` }}
        >
          👜
        </div>
      </div>

      {/* 中心吸引场效果（仅黑洞模式） */}
      {isBlackHole && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ zIndex: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 中心发光核心 */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: '8px',
              height: '8px',
              marginLeft: '-4px',
              marginTop: '-4px',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 215, 0, 0.8) 50%, transparent 100%)',
              filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))',
            }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* 吸引涟漪 */}
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full border border-yellow-300"
              style={{
                width: `${20 + i * 15}px`,
                height: `${20 + i * 15}px`,
                marginLeft: `${-(10 + i * 7.5)}px`,
                marginTop: `${-(10 + i * 7.5)}px`,
                borderColor: `rgba(255, 215, 0, ${0.6 - i * 0.1})`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0.2, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}; 