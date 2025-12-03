import React, { useState } from 'react';
import { LessonInfo } from '@/api/lesson.ts';
import { Progress } from '@/components/ui/progress.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronRight, BookOpen, Award,
  Clock, CheckCircle, CircleEllipsis, Play
} from 'lucide-react';
import { cn } from '@/lib/utils.ts';

interface LessonInfoPanelProps {
  lessonInfo: LessonInfo | null;
  isLoading: boolean;
}

export const LessonInfoPanel: React.FC<LessonInfoPanelProps> = ({ lessonInfo, isLoading }) => {
  // 状态管理
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [expandedChapterIndex, setExpandedChapterIndex] = useState<number | null>(null);
  
  // 切换章节展开/折叠状态
  const toggleChapter = (chapterIndex: number) => {
    setExpandedChapterIndex(prev => prev === chapterIndex ? null : chapterIndex);
  };
  
  // 计算整体课程进度
  const calculateOverallProgress = () => {
    if (!lessonInfo) return 0;
    
    const { completedParts, totalParts } = lessonInfo.lessonProgress;
    return totalParts > 0 ? Math.round((completedParts / totalParts) * 100) : 0;
  };
  
  // 判断部分是否已完成
  const isPartCompleted = (chapterIndex: number, partIndex: number) => {
    if (!lessonInfo) return false;
    
    const { currentChapter, currentPart } = lessonInfo.lessonProgress;
    
    // 判断是否为之前章节
    if (chapterIndex + 1 < currentChapter) return true;
    
    // 判断是否为当前章节中已完成的部分
    if (currentChapter === chapterIndex + 1) {
      return partIndex + 1 < currentPart;
    }
    
    return false;
  };
  
  // 判断章节是否已完成
  const isChapterCompleted = (chapterIndex: number) => {
    if (!lessonInfo) return false;
    
    const { currentChapter, currentPart } = lessonInfo.lessonProgress;
    const chapter = lessonInfo.learningStructure[chapterIndex];
    
    // 如果是前面的章节，则已完成
    if (chapterIndex + 1 < currentChapter) return true;
    
    // 如果是当前章节，且当前部分是章节的最后一部分且已完成，则章节已完成
    if (currentChapter === chapterIndex + 1 && 
        currentPart > chapter.child.length) {
      return true;
    }
    
    return false;
  };
  
  // 检查是否为当前学习的部分
  const isCurrentPart = (chapterIndex: number, partIndex: number) => {
    if (!lessonInfo) return false;
    
    const { currentChapter, currentPart } = lessonInfo.lessonProgress;
    return currentChapter === chapterIndex + 1 && currentPart === partIndex + 1;
  };
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="pt-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!lessonInfo) {
    return (
      <div className="p-4 text-center text-gray-500">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>没有可用的课程信息</p>
      </div>
    );
  }
  
  const { lessonTitle, lessonDescription, learningStructure, lessonProgress } = lessonInfo;
  const overallProgress = calculateOverallProgress();
  
  // 截断描述文本，如果太长
  const shouldTruncateDescription = lessonDescription.length > 120;
  const truncatedDescription = shouldTruncateDescription && !isDescriptionExpanded 
    ? `${lessonDescription.substring(0, 120)}...` 
    : lessonDescription;
  
  // 找出当前章节索引
  const currentChapterIndex = lessonProgress.currentChapter - 1;
  
  // 自动展开当前章节
  if (currentChapterIndex >= 0 && expandedChapterIndex === null) {
    setExpandedChapterIndex(currentChapterIndex);
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* 课程标题和整体进度区域 */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100 shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-lg font-medium text-gray-800">{lessonTitle}</h2>
          <div className="flex items-baseline gap-1 bg-blue-50 px-2 py-1 rounded-full">
            <span className="text-blue-600 font-medium">{overallProgress}%</span>
            <span className="text-xs text-blue-500">完成</span>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="mb-3">
          <Progress value={overallProgress} className="h-1.5" />
          
          {/* 课程进度里程碑 */}
          <div className="flex justify-between items-center mt-1 px-0.5">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                overallProgress >= 0 ? "bg-blue-500" : "bg-gray-300"
              )} />
              <span className="text-[10px] text-gray-500 mt-0.5">开始</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                overallProgress >= 33 ? "bg-blue-500" : "bg-gray-300"
              )} />
              <span className="text-[10px] text-gray-500 mt-0.5">基础</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                overallProgress >= 66 ? "bg-blue-500" : "bg-gray-300"
              )} />
              <span className="text-[10px] text-gray-500 mt-0.5">进阶</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                overallProgress === 100 ? "bg-blue-500" : "bg-gray-300"
              )} />
              <span className="text-[10px] text-gray-500 mt-0.5">掌握</span>
            </div>
          </div>
        </div>
        
        {/* 课程描述 */}
        {lessonDescription && (
          <div className="text-sm text-gray-600 relative">
            <button 
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="absolute right-0 top-0 text-xs text-blue-500 hover:text-blue-600 bg-white px-1"
            >
              {isDescriptionExpanded ? "收起" : "展开"}
            </button>
            <p className={cn(
              "transition-all duration-200",
              !isDescriptionExpanded && shouldTruncateDescription && "line-clamp-2"
            )}>
              {lessonDescription}
            </p>
          </div>
        )}
      </div>
      
      {/* 章节和部分列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-gray-500" />
          课程大纲
        </h3>
        
        {/* 时间线风格的章节列表 */}
        <div className="space-y-4">
          {learningStructure.map((chapter, chapterIndex) => {
            const isCurrentChapter = lessonProgress.currentChapter === chapterIndex + 1;
            const isCompletedChapter = isChapterCompleted(chapterIndex);
            const isExpanded = expandedChapterIndex === chapterIndex;
            
            // 计算章节进度
            const totalPartsInChapter = chapter.child.length;
            let completedPartsInChapter = 0;
            
            if (isCompletedChapter) {
              completedPartsInChapter = totalPartsInChapter;
            } else if (isCurrentChapter) {
              completedPartsInChapter = Math.max(0, lessonProgress.currentPart - 1);
            }
            
            const chapterProgress = totalPartsInChapter > 0 ? 
              Math.round((completedPartsInChapter / totalPartsInChapter) * 100) : 0;
            
            return (
              <div 
                key={`chapter-${chapterIndex}`} 
                className="relative"
              >
                {/* 章节状态图标 */}
                <div className={cn(
                  "absolute left-1 top-1 w-5 h-5 rounded-full flex items-center justify-center z-10",
                  isCompletedChapter ? "bg-green-100" : 
                  isCurrentChapter ? "bg-blue-100" : "bg-gray-100"
                )}>
                  {isCompletedChapter ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : isCurrentChapter ? (
                    <Play className="h-3 w-3 text-blue-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-gray-400" />
                  )}
                </div>
                
                {/* 章节卡片 */}
                <div className={cn(
                  "ml-4 pl-4 border-l-2 pb-4",
                  isCompletedChapter ? "border-green-300" : 
                  isCurrentChapter ? "border-blue-300" : "border-gray-200"
                )}>
                  <div className={cn(
                    "rounded-lg overflow-hidden border shadow-sm",
                    isCurrentChapter ? "border-blue-200" : 
                    isCompletedChapter ? "border-green-200" : "border-gray-200"
                  )}>
                    {/* 章节标题栏 */}
                    <button 
                      onClick={() => toggleChapter(chapterIndex)}
                      className={cn(
                        "w-full p-3 flex items-center text-left",
                        isCurrentChapter ? "bg-blue-50" : 
                        isCompletedChapter ? "bg-green-50" : "hover:bg-gray-50",
                      )}
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-500">章节 {chapterIndex + 1}</span>
                          {isCurrentChapter && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded-full">
                              当前
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-800 truncate mt-0.5">
                          {chapter.chapterName}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">{completedPartsInChapter}/{totalPartsInChapter}</span>
                          </div>
                          <Progress 
                            value={chapterProgress} 
                            className={cn(
                              "h-1 w-16 mt-0.5",
                              isCompletedChapter ? "bg-green-100" : "bg-gray-100"
                            )}
                          />
                        </div>
                        <div className={cn(
                          "transition-transform duration-200",
                          isExpanded ? "rotate-180" : ""
                        )}>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </button>
                    
                    {/* 章节部分列表 - 可折叠 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-gray-100"
                        >
                          <div className="divide-y divide-gray-100">
                            {chapter.child.map((part, partIndex) => {
                              const isCompleted = isPartCompleted(chapterIndex, partIndex);
                              const isCurrent = isCurrentPart(chapterIndex, partIndex);
                              
                              return (
                                <div 
                                  key={`part-${chapterIndex}-${partIndex}`}
                                  className={cn(
                                    "p-3 flex items-center",
                                    isCurrent && "bg-blue-50/50",
                                    isCompleted && !isCurrent && "bg-green-50/30"
                                  )}
                                >
                                  <div className="w-5 flex-shrink-0 flex items-center justify-center">
                                    {isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : isCurrent ? (
                                      <CircleEllipsis className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    )}
                                  </div>
                                  
                                  <div className="ml-3 flex-1 min-w-0">
                                    <p className={cn(
                                      "text-sm",
                                      isCurrent ? "text-blue-700 font-medium" : 
                                      isCompleted ? "text-gray-800" : "text-gray-600"
                                    )}>
                                      {part.name}
                                    </p>
                                  </div>
                                  
                                  {isCurrent && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full">
                                      学习中
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 完成状态卡片 */}
        {overallProgress > 0 && (
          <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-medium text-blue-700">学习进度</h3>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {overallProgress >= 25 && (
                <div className="bg-white px-2 py-1 rounded-full text-xs text-blue-700 shadow-sm">
                  完成了 25%
                </div>
              )}
              {overallProgress >= 50 && (
                <div className="bg-white px-2 py-1 rounded-full text-xs text-blue-700 shadow-sm">
                  完成了一半课程
                </div>
              )}
              {overallProgress >= 75 && (
                <div className="bg-white px-2 py-1 rounded-full text-xs text-blue-700 shadow-sm">
                  即将学习完成
                </div>
              )}
              {overallProgress === 100 && (
                <div className="bg-white px-2 py-1 rounded-full text-xs text-blue-700 shadow-sm">
                  全部学习完成
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 