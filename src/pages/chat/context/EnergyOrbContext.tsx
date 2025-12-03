import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnergyCrystal } from '@/pages/chat/components/EnergyCrystal.tsx';
import { GameSoundService } from '@/services/soundService'; // 直接导入音效服务

// 能量球接口
interface EnergyOrb {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  delay: number;
  hasHit: boolean;
}


// Context接口
interface EnergyOrbContextType {
  // 能量球状态
  energyOrbs: EnergyOrb[];
  hitCount: number; // 宝石数量
  setHitCount: (value: number) => void;
  selectedContainerId: string | null;

  // 液体控制
  liquidPercentage: number;
  setLiquidPercentage: (value: number | ((prev: number) => number)) => void;

  // 百分比显示控制
  showPercentage: boolean;
  setShowPercentage: (show: boolean) => void;

  // 容器管理
  registerContainer: (id: string, getPosition: () => { x: number; y: number }) => void;
  unregisterContainer: (id: string) => void;
  setSelectedContainer: (id: string) => void;

  // 能量源元素管理
  registerEnergySource: (id: string, getPosition: () => { x: number; y: number }) => void;
  unregisterEnergySource: (id: string) => void;
  fireOrbsFromSource: (sourceId: string, orbCount: number) => void;

  // 碰撞反馈状态
  containerHitStates: Map<string, boolean>;
  triggerContainerHit: (containerId: string) => void;

  // 能量球操作
  fireOrbs: (clickX: number, clickY: number, orbCount: number) => void;
  resetStats: () => void;

  // 事件处理
  onOrbHit: (orbId: string) => void;
}

const EnergyOrbContext = createContext<EnergyOrbContextType | undefined>(undefined);

export const useEnergyOrb = () => {
  const context = useContext(EnergyOrbContext);
  if (!context) {
    throw new Error('useEnergyOrb must be used within an EnergyOrbProvider');
  }
  return context;
};

export const EnergyOrbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [energyOrbs, setEnergyOrbs] = useState<EnergyOrb[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [liquidPercentage, setLiquidPercentage] = useState(0);

  // 百分比显示控制
  const [showPercentage, setShowPercentage] = useState(false);

  // 容器碰撞状态
  const [containerHitStates, setContainerHitStates] = useState<Map<string, boolean>>(new Map());

  // 容器注册表
  const containersRef = useRef<Map<string, () => { x: number; y: number }>>(new Map());

  // 能量源元素注册表
  const energySourcesRef = useRef<Map<string, () => { x: number; y: number }>>(new Map());

  // 触发容器碰撞效果
  const triggerContainerHit = useCallback((containerId: string) => {
    setContainerHitStates(prev => new Map(prev.set(containerId, true)));

    // 50ms后快速重置碰撞状态
    setTimeout(() => {
      setContainerHitStates(prev => {
        const newMap = new Map(prev);
        newMap.set(containerId, false);
        return newMap;
      });
    }, 50);
  }, []);
  
  // 注册容器
  const registerContainer = useCallback((id: string, getPosition: () => { x: number; y: number }) => {
    containersRef.current.set(id, getPosition);

    // 如果是第一个注册的容器，设为默认选中
    if (!selectedContainerId && containersRef.current.size === 1) {
      setSelectedContainerId(id);
    }
  }, [selectedContainerId]);

  // 注销容器
  const unregisterContainer = useCallback((id: string) => {
    containersRef.current.delete(id);

    // 如果删除的是选中的容器，选择其他容器或设为null
    if (selectedContainerId === id) {
      const remainingContainers = Array.from(containersRef.current.keys());
      setSelectedContainerId(remainingContainers.length > 0 ? remainingContainers[0] : null);
    }
  }, [selectedContainerId]);

  // 设置选中容器
  const setSelectedContainer = useCallback((id: string) => {
    setSelectedContainerId(id);
  }, []);

  // 注册能量源
  const registerEnergySource = useCallback((id: string, getPosition: () => { x: number; y: number }) => {
    energySourcesRef.current.set(id, getPosition);
  }, []);

  // 注销能量源
  const unregisterEnergySource = useCallback((id: string) => {
    energySourcesRef.current.delete(id);
  }, []);

  // 从指定源发射能量球
  const fireOrbsFromSource = useCallback((sourceId: string, orbCount: number) => {
    if (!selectedContainerId) return;

    const getSourcePosition = energySourcesRef.current.get(sourceId);
    const getTargetPosition = containersRef.current.get(selectedContainerId);
    
    if (!getSourcePosition || !getTargetPosition) return;

    // 在发射时获取并锁定源和目标位置
    const sourcePosition = getSourcePosition();
    const targetPosition = getTargetPosition();
    
    const fixedStartX = sourcePosition.x - window.pageXOffset;
    const fixedStartY = sourcePosition.y - window.pageYOffset;
    const fixedTargetX = targetPosition.x - window.pageXOffset;
    const fixedTargetY = targetPosition.y - window.pageYOffset;

    // 钻石颜色
    const colors = ['#FFD700', '#FFA500', '#FFE55C', '#FFEB3B', '#FFC107'];

    const newOrbs: EnergyOrb[] = [];

    for (let i = 0; i < orbCount; i++) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;

      const newOrb: EnergyOrb = {
        id: `${Date.now()}-${sourceId}-${i}-${Math.random()}`,
        startX: fixedStartX + offsetX,
        startY: fixedStartY + offsetY,
        targetX: fixedTargetX,
        targetY: fixedTargetY,
        color: randomColor,
        delay: i * 0.1,
        hasHit: false
      };

      newOrbs.push(newOrb);
    }

    setEnergyOrbs(prev => [...prev, ...newOrbs]);
  }, [selectedContainerId]);

  // 发射能量球
  const fireOrbs = useCallback((clickX: number, clickY: number, orbCount: number) => {
    if (!selectedContainerId) return;

    const getPosition = containersRef.current.get(selectedContainerId);
    if (!getPosition) return;

    // 在发射时获取并锁定目标位置，避免动画过程中位置变化
    const targetPosition = getPosition();
    const fixedTargetX = targetPosition.x - window.pageXOffset;
    const fixedTargetY = targetPosition.y - window.pageYOffset;

    // 随机颜色
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];

    const newOrbs: EnergyOrb[] = [];

    for (let i = 0; i < orbCount; i++) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;

      const newOrb: EnergyOrb = {
        id: `${Date.now()}-${i}-${Math.random()}`,
        // 存储发射时的滚动位置，相对于视口的位置
        startX: clickX - window.pageXOffset + offsetX,
        startY: clickY - window.pageYOffset + offsetY,
        // 使用固定的目标位置，确保动画过程中不会改变
        targetX: fixedTargetX,
        targetY: fixedTargetY,
        color: randomColor,
        delay: i * 0.25,
        hasHit: false
      };

      newOrbs.push(newOrb);
    }

    setEnergyOrbs(prev => [...prev, ...newOrbs]);
  }, [selectedContainerId]);

  // 处理能量球碰撞
  const onOrbHit = useCallback((orbId: string) => {
    const orb = energyOrbs.find(o => o.id === orbId);
    if (!orb || orb.hasHit) {
      setEnergyOrbs(prev => prev.filter(o => o.id !== orbId));
      return;
    }

    console.log(`🔺 [钻石命中] 钻石 ${orbId} 命中钱袋子 → 直接调用GameSoundService播放 diamond-collect`);
    GameSoundService.play('diamond-collect'); // 直接调用服务

    // 触发选中容器的碰撞反馈效果
    if (selectedContainerId) {
      triggerContainerHit(selectedContainerId);
    }

    // 标记为已碰撞
    setEnergyOrbs(prev => prev.map(o =>
      o.id === orbId ? { ...o, hasHit: true } : o
    ));

    // 增加碰撞计数
    setHitCount(prev => prev + 1);

    // 增加1%液体量（最大100%）
    setLiquidPercentage(prev => Math.min(100, prev + 1));

    // 延迟移除能量球
    setTimeout(() => {
      setEnergyOrbs(prev => prev.filter(o => o.id !== orbId));
    }, 100);
  }, [energyOrbs, selectedContainerId, triggerContainerHit]);

  // 重置统计
  const resetStats = useCallback(() => {
    setHitCount(0);
    setEnergyOrbs([]);
    setLiquidPercentage(45);
  }, []);

  // 能量球动画变体
  const orbVariants = {
    initial: (orb: EnergyOrb) => ({
      // 使用能量球创建时的起始位置
      x: orb.startX - 10,
      y: orb.startY - 10,
      scale: 0,
      opacity: 0
    }),
    animate: (orb: EnergyOrb) => {
      // 【关键修复】使用能量球创建时已经计算并锁定的目标位置
      // 避免在动画过程中重新计算目标位置，防止以下问题：
      // 1. 目标组件尺寸变化时圆球突然消失
      // 2. 目标组件位置移动时动画路径突变
      // 3. Framer Motion 因目标值改变而重置动画状态
      return {
        x: orb.targetX - 10,
        y: orb.targetY - 10,
        scale: [0, 1.2, 1, 1.5, 0],
        opacity: [0, 1, 1, 1, 0],
        transition: {
          duration: 1.5,
          ease: "easeInOut",
          times: [0, 0.2, 0.7, 0.9, 1],
          delay: orb.delay
        }
      };
    }
  };

  const contextValue: EnergyOrbContextType = {
    energyOrbs,
    hitCount,
    setHitCount,
    selectedContainerId,
    liquidPercentage,
    setLiquidPercentage,
    showPercentage,
    setShowPercentage,
    registerContainer,
    unregisterContainer,
    setSelectedContainer,
    registerEnergySource,
    unregisterEnergySource,
    fireOrbsFromSource,
    containerHitStates,
    triggerContainerHit,
    fireOrbs,
    resetStats,
    onOrbHit,
  };

  return (
    <EnergyOrbContext.Provider value={contextValue}>
      {children}

      {/* 全局能量球渲染 */}
      <AnimatePresence>
        {energyOrbs.map((orb) => (
          <EnergyCrystal
            key={orb.id}
            orb={orb}
            onAnimationComplete={onOrbHit}
          />
        ))}
      </AnimatePresence>
    </EnergyOrbContext.Provider>
  );
}; 