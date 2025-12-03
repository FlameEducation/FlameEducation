import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles, Gift, CheckCircle, Loader2 } from 'lucide-react';
import { getLessonRewardList, receiveAllLessonRewards, getRewardStatus } from '@/api/reward';
import { LessonRewardItem, RewardStatus } from '@/types/reward';

interface LessonSettlementProps {
  isOpen: boolean;
  onClose: () => void;
  lessonUuid: string;
  lessonTitle: string;
}

// 宝石颜色映射
const gemColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];

// 获取宝石图片
const getCrystalImage = (color: string) => {
  const colorMap: { [key: string]: string } = {
    '#ff6b6b': '/assets/crystal-red.png',
    '#4ecdc4': '/assets/crystal-cyan.png', 
    '#45b7d1': '/assets/crystal-blue.png',
    '#96ceb4': '/assets/crystal-green.png',
    '#feca57': '/assets/crystal-yellow.png',
    '#ff9ff3': '/assets/crystal-pink.png'
  };
  return colorMap[color] || '/assets/crystal-blue.png';
};

export const LessonSettlement: React.FC<LessonSettlementProps> = ({
  isOpen,
  onClose,
  lessonUuid,
  lessonTitle
}) => {
  const [rewards, setRewards] = useState<LessonRewardItem[]>([]);
  const [rewardStatus, setRewardStatus] = useState<RewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'intro' | 'rewards' | 'celebration'>('intro');
  const [showRewards, setShowRewards] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // 加载奖励数据
  useEffect(() => {
    if (isOpen && lessonUuid) {
      loadRewards();
    }
  }, [isOpen, lessonUuid]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      
      // 并行获取奖励列表和奖励状态
      const [rewardData, statusData] = await Promise.all([
        getLessonRewardList(lessonUuid),
        getRewardStatus(lessonUuid)
      ]);
      
      setRewards(rewardData || []);
      setRewardStatus(statusData);
      setClaimed(statusData.lessonIsReceived);
      
      // 启动动画序列
      setTimeout(() => {
        setAnimationPhase('rewards');
        setShowRewards(true);
      }, 1000);
    } catch (error) {
      console.error('获取奖励信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 领取所有奖励
  const handleClaimRewards = async () => {
    try {
      setClaiming(true);
      await receiveAllLessonRewards(lessonUuid);
      
      // 更新状态
      setClaimed(true);
      if (rewardStatus) {
        setRewardStatus({
          ...rewardStatus,
          lessonIsReceived: true,
          receivedCount: rewards.length
        });
      }
      
      setAnimationPhase('celebration');
      
      // 播放庆祝音效
      const audio = new Audio('/audio/celebration.mp3');
      audio.play().catch(() => {});
      
      // 延迟关闭
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('领取奖励失败:', error);
    } finally {
      setClaiming(false);
    }
  };

  // 计算总宝石数
  const totalGems = rewards.reduce((sum, reward) => sum + reward.rewardNumber, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm md:max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 border-none shadow-2xl">
        <DialogTitle className="sr-only">课程结算</DialogTitle>
        
        <div className="text-center space-y-4 py-2 md:py-4">
          {/* 标题部分 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">课程完成！</h2>
            <p className="text-gray-600">{lessonTitle}</p>
          </motion.div>

          {/* 加载状态 */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-8"
            >
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-600">正在统计收获...</span>
            </motion.div>
          )}

          {/* 奖励展示 */}
          <AnimatePresence>
            {showRewards && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {/* 总结信息 */}
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-gray-800">本次收获</span>
                  </div>
                  
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <div className="text-2xl md:text-3xl font-bold text-blue-600">{totalGems}</div>
                    <div className="text-base md:text-lg text-gray-600">个宝石</div>
                  </div>

                  {/* 奖励状态信息 */}
                  {/* {rewardStatus && (
                    <div className="flex justify-center items-center gap-4 mb-4 text-sm">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                        rewardStatus.lessonIsReceived 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>{rewardStatus.lessonIsReceived ? '已全部领取' : '待领取'}</span>
                      </div>
                      <div className="text-gray-500">
                        已领取: {rewardStatus.receivedCount}/{rewards.length}
                      </div>
                    </div>
                  )} */}

                  {/* 宝石动画展示 */}
                  <div className="flex justify-center gap-2 mb-4">
                    {Array.from({ length: Math.min(totalGems, 6) }, (_, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0, rotate: 0 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          rotate: 360 
                        }}
                        transition={{ 
                          delay: index * 0.1,
                          duration: 0.6,
                          type: "spring",
                          stiffness: 200
                        }}
                        className="relative"
                      >
                        <img 
                          src={getCrystalImage(gemColors[index % gemColors.length])}
                          alt="宝石"
                          className="w-6 h-6 md:w-8 md:h-8"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          💎
                        </div>
                      </motion.div>
                    ))}
                    {totalGems > 6 && (
                      <div className="flex items-center text-gray-500 text-sm">
                        +{totalGems - 6}
                      </div>
                    )}
                  </div>
                </div>

                {/* 奖励明细 */}
                {rewards.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Gift className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-gray-800">奖励明细</span>
                    </div>
                    
                    <div className="space-y-2 max-h-24 md:max-h-32 overflow-y-auto">
                      {rewards.map((reward, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className={`flex justify-between items-center p-2 rounded-lg text-sm md:text-base ${
                            reward.received 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {reward.received && (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            )}
                            <span className={`text-sm ${
                              reward.received ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              {reward.rewardName}
                            </span>
                          </div>
                          <Badge 
                            variant={reward.received ? "default" : "secondary"} 
                            className={`text-xs ${
                              reward.received 
                                ? 'bg-green-600 text-white' 
                                : ''
                            }`}
                          >
                            +{reward.rewardNumber} 宝石
                            {reward.received && ' ✓'}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 按钮区域 */}
          <AnimatePresence>
            {showRewards && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3"
              >
                {!claimed ? (
                  <Button
                    onClick={handleClaimRewards}
                    disabled={claiming || (rewardStatus?.lessonIsReceived && rewardStatus.receivedCount === rewards.length)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-xl shadow-lg disabled:opacity-50 text-sm md:text-base"
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        领取中...
                      </>
                    ) : rewardStatus?.lessonIsReceived ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        奖励已全部领取
                      </>
                    ) : rewardStatus && rewardStatus.receivedCount > 0 ? (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        领取 {rewardStatus.receivedCount}个宝石奖励
                      </>
                    ) : rewardStatus?.receivedCount > 0 ? (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        领取所有奖励
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        奖励已经领完了~
                      </>
                    )}
                  </Button>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center gap-2 text-green-600 font-semibold"
                  >
                    <CheckCircle className="w-5 h-5" />
                    奖励已领取！
                  </motion.div>
                )}
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full py-2 md:py-3 px-4 md:px-6 text-sm md:text-base"
                  disabled={claiming}
                >
                  {claimed ? '完成' : '稍后领取'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 庆祝动画 */}
          <AnimatePresence>
            {animationPhase === 'celebration' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 0,
                      scale: 0,
                      x: '50%',
                      y: '50%'
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: `${50 + (Math.random() - 0.5) * 200}%`,
                      y: `${50 + (Math.random() - 0.5) * 200}%`,
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                    className="absolute text-2xl"
                  >
                    ✨
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 