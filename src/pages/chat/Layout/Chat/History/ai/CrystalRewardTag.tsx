import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnergyOrb } from '@/pages/chat/context/EnergyOrbContext.tsx';
import { GameSoundService } from '@/services/soundService'; // 直接导入音效服务
import { cn } from '@/lib/utils.ts';
import { Diamond, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRewardDetails, claimReward } from '@/api/reward';
import { RewardDetails } from '@/types/reward';
import { Skeleton } from '@/components/ui/skeleton';

interface CrystalRewardTagProps {
  rewardUuid: string;
  lessonUuid: string;
}

const RewardSkeleton = () => (
    <div className="px-4 py-3 border-t border-gray-100/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded-full"/>
            <Skeleton className="w-32 h-4"/>
        </div>
        <Skeleton className="w-28 h-9 rounded-lg"/>
    </div>
);

export const CrystalRewardTag: React.FC<CrystalRewardTagProps> = ({ rewardUuid, lessonUuid }) => {
  const { fireOrbsFromSource, registerEnergySource, unregisterEnergySource, setSelectedContainer } = useEnergyOrb();
  
  const [rewardData, setRewardData] = useState<RewardDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [diamondCount, setDiamondCount] = useState(0);

  const sourceId = `crystal-reward-${rewardUuid}`;

  const buttonRefCallback = useCallback((node: HTMLButtonElement) => {
    if (node !== null) {
      const getPosition = () => {
        if (!node) return { x: 0, y: 0 };
        const rect = node.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      };
      registerEnergySource(sourceId, getPosition);
    }
  }, [sourceId, registerEnergySource]);

  useEffect(() => {
    return () => {
      unregisterEnergySource(sourceId);
    };
  }, [sourceId, unregisterEnergySource]);

  useEffect(() => {
    const fetchRewardData = async () => {
      setIsLoading(true);
      try {
        const data = await getRewardDetails(lessonUuid, rewardUuid);
        setRewardData(data);
        setDiamondCount(data.rewardNumber);
      } catch (error) {
        console.error("Failed to fetch reward details:", error);
        setRewardData(null); // Set to null on error to hide component
      } finally {
        setIsLoading(false);
      }
    };
    fetchRewardData();
  }, [rewardUuid, lessonUuid]);
  
  useEffect(() => {
    setSelectedContainer('header-progress');
  }, [setSelectedContainer]);

  useEffect(() => {
    if (!isClaiming || !rewardData) return;
    
    if (diamondCount > 0) {
      const timer = setTimeout(() => {
        console.log(`🔹 [钻石生成] 剩余钻石: ${diamondCount} → 直接调用GameSoundService播放 diamond-appear`);
        setDiamondCount(prev => prev - 1);
        fireOrbsFromSource(sourceId, 1);
        GameSoundService.play('diamond-appear'); // 直接调用服务
      }, 150);
      return () => clearTimeout(timer);
    } else {
      const finalTimer = setTimeout(() => {
        console.log('🔹 [领取完成] 钻石领取流程结束');
        setRewardData(prev => prev ? { ...prev, received: true } : null);
        setIsClaiming(false);
      }, 800);
      return () => clearTimeout(finalTimer);
    }
  }, [isClaiming, diamondCount, fireOrbsFromSource, sourceId, rewardData]);

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rewardData || rewardData.received || isClaiming) return;
    
    console.log('🔸 [点击领取] 用户点击领取按钮 → 直接调用GameSoundService播放 reward-click');
    GameSoundService.play('reward-click'); // 直接调用服务
    
    setIsClaiming(true);
    try {
      await claimReward(lessonUuid, rewardUuid);
    } catch (error) {
      console.error("Failed to claim reward:", error);
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return <RewardSkeleton />;
  }

  // 没有数据，不显示
  if (!rewardData) {
    return null; // Don't show if no data, but DO show if claimed
  }
  
  const isDisabled = isClaiming || rewardData.received;
  const theme = { icon: 'text-orange-500', buttonIdle: 'text-orange-600 border-orange-400 hover:bg-orange-50' };

  return (
    <div className="px-4 py-3 border-t border-gray-100/80 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <motion.div
          animate={!isDisabled ? { rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } } : { rotate: 0 }}
        >
          <Gift className={cn("w-6 h-6", theme.icon)} />
        </motion.div>
        <p className="text-sm text-gray-600 font-medium">{rewardData.rewardName}</p>
      </div>
      <motion.div
        className="rounded-lg"
        animate={!isDisabled 
          ? { 
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 0px rgba(249, 115, 22, 0)",
                "0 0 8px rgba(249, 115, 22, 0.6)",
                "0 0 0px rgba(249, 115, 22, 0)"
              ]
            } 
          : { scale: 1, boxShadow: 'none' }}
        transition={!isDisabled 
          ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.4, ease: "easeOut" }
        }
      >
        <Button
          ref={buttonRefCallback}
          onClick={handleClaim}
          disabled={isDisabled}
          variant="outline"
          size="sm"
          className={cn(
            "w-28 md:w-32 transition-all duration-300 rounded-lg",
            rewardData.received ? "bg-gray-200 text-gray-500 border-gray-200" : isClaiming ? "bg-gray-100" : theme.buttonIdle
          )}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
           <AnimatePresence mode="wait">
            {rewardData.received ? (
              <motion.span key="claimed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>已领取</motion.span>
            ) : isClaiming ? (
              diamondCount > 0 ? (
                <motion.span
                  key="claiming"
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <Diamond className={cn("w-4 h-4 animate-spin", theme.icon)} style={{animationDuration: '1s'}} /> {diamondCount}
                </motion.span>
              ) : (
                <motion.div
                  key="checkmark"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </motion.svg>
                </motion.div>
              )
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{`领取 ${rewardData.rewardNumber} 颗`}</motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </div>
  );
}; 