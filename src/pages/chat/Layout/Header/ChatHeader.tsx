import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Settings, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useClassStatusContext } from "@/pages/chat/context/ClassStatusContext.tsx";
import { GameSoundService } from '@/services/soundService.ts'; // 直接导入音效服务
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EnhancedTreasureBag } from '@/pages/chat/components/EnhancedTreasureBag.tsx';
import { LessonInfoPanel } from './LessonInfoPanel.tsx';
import { useEnergyOrb } from '@/pages/chat/context/EnergyOrbContext.tsx';
import { api } from '@/api';
import confetti from 'canvas-confetti';

interface ChatHeaderProps {
  onOpenSettings: () => void;
  onOpenLessonInfo: () => void;
}

// 使用 canvas-confetti 的烟花效果（从上到下）
const triggerConfettiEffect = () => {
  confetti({
    particleCount: 150,
    spread: 180,
    angle: 270, // 270度角，即正下方
    origin: { x: 0.5, y: -0.1 }, // 从屏幕顶部中心偏上的位置开始
    gravity: 0.6, // 轻微的重力效果
    ticks: 300,   // 粒子持续时间
    disableForReducedMotion: true
  });
};

// 简化的滚动标题组件（只负责文本和跑马灯）
const ScrollingTitle: React.FC<{ text: string }> = ({ text }) => {
  const [shouldScroll, setShouldScroll] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      const isOverflowing = titleRef.current.scrollWidth > titleRef.current.clientWidth;
      setShouldScroll(isOverflowing);
    }
  }, [text]);

  return (
    <div
      ref={titleRef}
      className={cn(
        "text-sm sm:text-base font-semibold bg-gradient-to-r from-indigo-600 to-blue-400 bg-clip-text text-transparent",
        shouldScroll ? "animate-marquee whitespace-nowrap" : "truncate"
      )}
    >
      {text}
    </div>
  );
};

// 带有动画的课程标题组件
const AnimatedLessonTitle: React.FC<{
  title: string;
  isLoading: boolean;
  onClick: () => void;
  animationControls: any;
  onCelebration: () => void;
}> = ({ title, isLoading, onClick, animationControls, onCelebration }) => {
  
  const [isFirstAnimation, setIsFirstAnimation] = useState(true);

  const handleAnimationComplete = useCallback(() => {
    if (isFirstAnimation) {
      // 首次加载，只做一个小的果冻动画，不放烟花
      animationControls.start({
        scale: [1, 1.1, 1],
        transition: { type: 'spring', stiffness: 400, damping: 10 }
      });
      setIsFirstAnimation(false);
    } else {
      // 后续的标题变化（进度提升），执行完整的庆祝动画
      onCelebration();
    }
  }, [isFirstAnimation, animationControls, onCelebration, setIsFirstAnimation]);

  if (isLoading) {
    return <div className="animate-pulse h-5 bg-gradient-to-r from-amber-200 to-amber-300 rounded w-32"></div>;
  }

  return (
    <div className="relative h-6 flex items-center overflow-hidden w-full" onClick={onClick}>
      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'circOut' }}
          onAnimationComplete={handleAnimationComplete}
          className="w-full cursor-pointer group"
        >
          <motion.div animate={animationControls} className="group-hover:opacity-80 transition-opacity">
            <ScrollingTitle text={title} />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// 纵向椭圆进度指示器组件
const VerticalProgressIndicator: React.FC<{ 
  isLoading: boolean; 
  progress: number;
  onClick: () => void;
}> = ({ isLoading, progress, onClick }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isLoading ? "updating" : "stable"}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="flex items-center cursor-pointer"
        onClick={onClick}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 animate-spin" />
        ) : (
          <div className="relative">
            <div className="w-3 sm:w-4 h-8 sm:h-10 rounded-full bg-gray-200 relative overflow-hidden">
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 via-blue-500 to-indigo-400 rounded-full"
                initial={{ height: 0 }}
                animate={{ height: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// 放大钱袋子模态框 Props 类型定义
interface TreasureDetailModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  hitCount: number;
  particleCount: number;
  glowIntensity: number;
  brightness: number;
}

const TreasureDetailModal: React.FC<TreasureDetailModalProps> = ({ isOpen, onClose, hitCount, particleCount, glowIntensity, brightness }) => {
  const controls = useAnimation();

  const handleShake = async () => {
    await controls.start({
      rotate: [0, -5, 5, -5, 5, 0],
      scale: [1, 1.05, 0.95, 1.05, 1],
      transition: { duration: 0.4, ease: "easeInOut" },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[85vw] sm:max-w-[425px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-purple-400/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white">💎 钻石宝库</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            你的努力正在闪闪发光！
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 flex flex-col items-center gap-6">
          <motion.div
            animate={controls}
            onClick={handleShake}
            className="cursor-pointer"
          >
            <EnhancedTreasureBag
              size={200}
              isBlackHole={true}
              particleCount={particleCount}
              glowIntensity={glowIntensity}
              particleSize={3}
              particleOpacity={1}
              containerId="modal-treasure-bag"
              brightness={brightness}
            />
          </motion.div>
          <p className="text-lg text-center font-medium text-slate-200">
            当前已经积攒 <span className="text-yellow-400 font-bold text-2xl">{hitCount}</span> 钻石，
            <br />
            完成课程后即可提取～
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 课程信息模态框
const LessonInfoModal: React.FC<{
  isOpen: boolean;
  onClose: (open: boolean) => void;
  lessonInfo: any;
  isLoading: boolean;
}> = ({ isOpen, onClose, lessonInfo, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-gray-800">课程详情</DialogTitle>
          <DialogDescription className="text-gray-600">
            查看课程进度和学习大纲
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(85vh-120px)] overflow-hidden">
          <LessonInfoPanel lessonInfo={lessonInfo} isLoading={isLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 全局触发器
let globalConfettiTrigger = () => {};
let globalTitleAnimationTrigger = () => {};

export const triggerGlobalConfetti = () => {
  globalConfettiTrigger();
};

export const triggerGlobalTitleAnimation = () => {
  globalTitleAnimationTrigger();
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onOpenSettings,
  onOpenLessonInfo,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLessonInfoOpen, setIsLessonInfoOpen] = useState(false);
  const titleAnimationControls = useAnimation();

  const {
    lessonUuid,
    lessonInfo,
    isLoading: isLessonLoading
  } = useClassStatusContext();

  const { energyOrbs, hitCount, setSelectedContainer, setHitCount } = useEnergyOrb();

  const runCelebrationAnimation = useCallback(() => {
    // 播放庆祝音效
    GameSoundService.play('celebration');
    
    // 果冻动画
    titleAnimationControls.start({
      scale: [1, 1.25, 0.9, 1.15, 1],
      rotate: [0, -3, 3, -3, 0],
      transition: { type: 'spring', damping: 8, stiffness: 400, duration: 0.6 }
    });
    // 同步触发烟花
    triggerConfettiEffect();
  }, [titleAnimationControls]);

  useEffect(() => {
    globalConfettiTrigger = () => {
      GameSoundService.play('celebration');
      triggerConfettiEffect();
    };
    globalTitleAnimationTrigger = runCelebrationAnimation;
  }, [runCelebrationAnimation]);

  useEffect(() => {
    setSelectedContainer('header-progress');
  }, [setSelectedContainer]);

  useEffect(() => {
    if (!lessonUuid) return;
    const loadDiamondCount = async () => {
      const diamondCount = await api.getLessonRewardTotal(lessonUuid);
      setHitCount(diamondCount);
    };
    loadDiamondCount();
  }, [lessonUuid, setHitCount]);

  const getLearningProgress = React.useMemo(() => {
    if (!lessonInfo) return 0;
    const { currentChapter, currentPart } = lessonInfo.lessonProgress;
    const totalChapters = lessonInfo.learningStructure.length;
    if (totalChapters === 0) return 0;
    const currentChapterIndex = currentChapter - 1;
    if (currentChapterIndex < 0) return 0;
    const currentChapterData = lessonInfo.learningStructure[currentChapterIndex];
    if (!currentChapterData) return 0;
    const totalPartsInChapter = currentChapterData.child.length;
    const completedParts = Math.max(0, currentPart - 1);
    const completedChapters = currentChapterIndex;
    const currentChapterProgress = totalPartsInChapter > 0 ? completedParts / totalPartsInChapter : 0;
    const totalProgress = (completedChapters + currentChapterProgress) / totalChapters;
    return Math.round(totalProgress * 100);
  }, [lessonInfo]);
  
  const displayTitle = React.useMemo(() => {
    if (!lessonInfo) return '篝火学单机版';
    const { currentChapter, currentPart } = lessonInfo.lessonProgress;
    if (currentChapter <= 0 || currentPart <= 0) return lessonInfo.lessonTitle || '篝火学单机版';
    const chapter = lessonInfo.learningStructure[currentChapter - 1];
    if (!chapter) return lessonInfo.lessonTitle;
    const part = chapter.child[currentPart - 1];
    return part?.name || lessonInfo.lessonTitle;
  }, [lessonInfo]);

  const [hasActiveOrbs, setHasActiveOrbs] = useState(false);
  useEffect(() => {
    setHasActiveOrbs(energyOrbs.length > 0);
  }, [energyOrbs]);

  const getEffectSettings = (count: number) => {
    if (count <= 10) return { particleCount: 0, glowIntensity: 0, brightness: 1.0, stage: 1 };
    if (count <= 20) return { particleCount: 10, glowIntensity: 0.8, brightness: 1.1, stage: 2 };
    if (count <= 30) return { particleCount: 20, glowIntensity: 1.6, brightness: 1.2, stage: 3 };
    return { particleCount: 40, glowIntensity: 2.4, brightness: 1.3, stage: 4 };
  };

  const { particleCount, glowIntensity, brightness } = getEffectSettings(hitCount);
  const size = 28 + 3 * getEffectSettings(hitCount).stage;

  const handleLessonInfoClick = () => {
    setIsLessonInfoOpen(true);
  };

  // 页面缩放控制
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('page-zoom-level');
    return saved ? parseFloat(saved) : 1;
  });

  useEffect(() => {
    // 移除旧的 zoom 实现，防止样式冲突
    // @ts-ignore
    document.body.style.zoom = '';
    
    // 使用 rem 缩放方案代替 zoom
    // 通过调整 html 根元素的 font-size 百分比来缩放所有基于 rem 的元素 (Tailwind 默认使用 rem)
    // 默认浏览器字体大小通常是 16px (100%)
    document.documentElement.style.fontSize = `${zoomLevel * 100}%`;
    
    localStorage.setItem('page-zoom-level', zoomLevel.toString());
  }, [zoomLevel]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm z-50">
        <div className="h-14 flex items-center">
          <div className="w-full h-full flex items-center px-3 sm:px-4 gap-3">

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <VerticalProgressIndicator 
                isLoading={isLessonLoading && !lessonInfo} 
                progress={getLearningProgress}
                onClick={handleLessonInfoClick}
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 min-w-0">
                       <AnimatedLessonTitle
                          title={displayTitle}
                          isLoading={isLessonLoading && !lessonInfo}
                          onClick={handleLessonInfoClick}
                          animationControls={titleAnimationControls}
                          onCelebration={runCelebrationAnimation}
                        />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[300px]">
                    <p>{displayTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">点击查看课程详情</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {lessonInfo && !isLessonLoading && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="flex items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 rounded-full p-1"
                >
                  <EnhancedTreasureBag
                    size={hasActiveOrbs ? size + 2 : size}
                    containerId="header-progress"
                    className=""
                    isBlackHole={false}
                    particleCount={0}
                    glowIntensity={0}
                    particleSize={0}
                    particleOpacity={0}
                    brightness={brightness}
                  />
                  
                  <motion.div 
                    className="flex items-center gap-0.5 bg-purple-50 border border-purple-200 rounded-lg px-1.5 py-0.5 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-purple-300"
                    animate={{
                      scale: hitCount > 0 ? [1, 1.05, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-purple-600 text-xs">💎</div>
                    <span className="font-medium text-purple-700 text-xs">{hitCount}</span>
                  </motion.div>
                </button>
              </div>
            )}

            {/* 缩放控制 - 仅在PC端显示 */}
            <div className="hidden md:flex items-center gap-0.5 mr-2 bg-gray-50/80 rounded-lg p-0.5 border border-gray-200/60">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200/80" onClick={handleZoomOut} title="缩小">
                <ZoomOut className="h-3.5 w-3.5 text-gray-600" />
              </Button>
              <span className="text-[10px] font-medium text-gray-500 w-8 text-center select-none">{Math.round(zoomLevel * 100)}%</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200/80" onClick={handleZoomIn} title="放大">
                <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200/80" onClick={handleResetZoom} title="重置">
                <RotateCcw className="h-3 w-3 text-gray-400" />
              </Button>
            </div>

            <div className="flex items-center flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenSettings}
                className="hover:bg-gray-100/80 transition-all rounded-full w-8 h-8 p-0"
              >
                <Settings className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <TreasureDetailModal
        isOpen={isModalOpen}
        onClose={setIsModalOpen}
        hitCount={hitCount}
        particleCount={particleCount}
        glowIntensity={glowIntensity}
        brightness={brightness}
      />

      <LessonInfoModal
        isOpen={isLessonInfoOpen}
        onClose={setIsLessonInfoOpen}
        lessonInfo={lessonInfo}
        isLoading={isLessonLoading}
      />
    </>
  );
};