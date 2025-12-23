import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, BookOpen, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StandardCourseCardProps {
  course: Course;
  className?: string;
  isHighlighted?: boolean;
}

export const StandardCourseCard: React.FC<StandardCourseCardProps> = ({ course, className, isHighlighted }) => {
  const navigate = useNavigate();

  // 计算总课时和已完成课时
  const totalLessons = course?.totalLessons || 0;
  let completedLessons = 0;
  let currentLessonInfo: { chapterUuid: string, lessonUuid: string } | null = null;

  for(let chapter of course?.chapters || []) {
    for(let lesson of chapter.lessons) {
      if(lesson.isCompleted) {
        completedLessons += 1;
      } else if (!currentLessonInfo) {
        currentLessonInfo = {
          chapterUuid: chapter.uuid,
          lessonUuid: lesson.uuid
        };
      }
    }
  }

  const handleLearnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentLessonInfo) {
      window.location.href = `/course/learn?courseUuid=${course.uuid}&chapterUuid=${currentLessonInfo.chapterUuid}&lessonUuid=${currentLessonInfo.lessonUuid}`;
    } else {
      navigate(`/courses/${course.uuid}`);
    }
  };

  // 计算里程碑位置（基于 chapters）
  const milestones = course?.chapters?.map((chapter, index: number) => ({
    id: chapter.uuid,
    title: chapter.title,
    position: totalLessons > 0
      ? (course?.chapters.slice(0, index + 1).reduce((sum, ch) => sum + ch.lessons.length, 0) / totalLessons) * 100
      : 0
  })) || [];

  // 计算下一个成就（基于 chapters）
  let nextAchievement = null;
  for (let chapter of course?.chapters || []) {
    if (!chapter.isCompleted) {
      const chapterCompletedLessons = chapter.lessons.filter(l => l.isCompleted).length;
      const remainingLessons = chapter.lessons.length - chapterCompletedLessons;
      nextAchievement = {
        remainingLessons,
        title: chapter.achievementName || chapter.title
      };
      break;
    }
  }

  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <Card 
      className={cn(
        "group cursor-pointer overflow-hidden transition-all hover:shadow-lg flex flex-col h-full relative",
        isHighlighted && "border-2 border-primary ring-2 ring-primary/20",
        className
      )}
      onClick={() => navigate(`/courses/${course.uuid}`)}
    >
      {isHighlighted && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-primary text-white shadow-sm">正在学习</Badge>
        </div>
      )}
      {/* 封面区域 - 调整为更窄更高的比例，这里使用 aspect-[4/3] */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {course.coverImageUrl ? (
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        
        {/* 播放按钮悬浮层 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
           <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform" onClick={handleLearnClick}>
              <PlayCircle className="w-8 h-8 text-primary" />
           </div>
        </div>

        {/* 装饰性元素 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none" />
      </div>

      {/* 内容区域 */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          {/* 课时进度文字 */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">课程进度</span>
            <span className="text-gray-500">{completedLessons}/{totalLessons} 课时</span>
          </div>

          {/* 进度条 */}
          <div className="relative">
            <Progress 
              value={progressPercentage} 
              className={cn(
                "h-2 bg-gray-100",
                completedLessons === totalLessons 
                  ? "[&>div]:!bg-green-500"
                  : "[&>div]:!bg-primary"
              )}
            />
            {milestones.map(milestone => (
              <div
                key={milestone.id}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-0.5 h-3",
                  completedLessons >= (milestone.position / 100 * totalLessons) ? "bg-white/50" : "bg-white"
                )}
                style={{ left: `${milestone.position}%` }}
                title={milestone.title}
              />
            ))}
          </div>

          <div className="pt-1">
            <Button 
              variant={isHighlighted ? "default" : "outline"} 
              size="sm" 
              className="w-full rounded-full text-xs h-8"
              onClick={handleLearnClick}
            >
              {completedLessons === totalLessons ? "重新学习" : "继续学习"}
            </Button>
          </div>

          {/*/!* 成就提示 *!/*/}
          {/*{nextAchievement ? (*/}
          {/*  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">*/}
          {/*    <Trophy className="w-3.5 h-3.5 shrink-0" />*/}
          {/*    <span className="line-clamp-1">*/}
          {/*      再完成{nextAchievement.remainingLessons}个课时，获得"{nextAchievement.title}"*/}
          {/*    </span>*/}
          {/*  </div>*/}
          {/*) : (*/}
          {/*   <div className="h-[34px]"></div> // 占位，保持卡片高度一致*/}
          {/*)}*/}
        </div>
      </div>
    </Card>
  );
};
