import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MyCourseCardProps {
  course: Course;
  isHighlighted?: boolean;
}

export const MyCourseCard: React.FC<MyCourseCardProps> = ({ course, isHighlighted }) => {
  const navigate = useNavigate();

  // 计算总课时和已完成课时
  const totalLessons = course?.chapters?.reduce((sum, chapter) => sum + (chapter.lessons?.length || 0), 0) || 0;
  const completedLessons = course?.chapters?.reduce((sum, chapter) => sum + (chapter.lessons?.filter(l => l.isCompleted).length || 0), 0) || 0;

  let currentLessonInfo: { chapterUuid: string, lessonUuid: string } | null = null;
  for(let chapter of course?.chapters || []) {
    for(let lesson of chapter.lessons) {
      if(!lesson.isCompleted && !currentLessonInfo) {
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

  // 计算里程碑位置
  const milestones = course?.chapters?.map((chapter, index) => {
    const chapterTotalLessons = chapter.lessons?.length || 0;
    const previousLessons = course.chapters
      .slice(0, index + 1)
      .reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
    
    return {
      id: chapter.uuid,
      title: chapter.title,
      position: totalLessons > 0 ? (previousLessons / totalLessons) * 100 : 0
    };
  });

  return (
    <Card 
      className={cn(
        "w-[300px] group cursor-pointer overflow-hidden transition-all hover:shadow-lg relative",
        isHighlighted && "border-2 border-primary ring-2 ring-primary/20"
      )}
      onClick={() => navigate(`/courses/${course.uuid}`)}
    >
      {isHighlighted && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-primary text-white shadow-sm">正在学习</Badge>
        </div>
      )}
      <div className="flex flex-col">
        {/* 封面区域 */}
        <div className="relative aspect-[2/1]">
          {course.coverImageUrl && (
            <img
              src={course.coverImageUrl}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/10">
            {/* 装饰性圆形 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          </div>

          {/* 播放按钮悬浮层 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform" onClick={handleLearnClick}>
                <PlayCircle className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-medium text-gray-800 mb-4 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          <div className="mt-auto space-y-3">
            {/* 课时进度文字 */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">课程进度</span>
              <span className="text-gray-500">{completedLessons}/{totalLessons} 课时</span>
            </div>

            {/* 进度条 */}
            <div className="relative">
              <Progress 
                value={(completedLessons / totalLessons) * 100} 
                className={cn(
                  "h-2",
                  completedLessons === totalLessons 
                    ? "[&>div]:!bg-primary-200"
                    : "[&>div]:!bg-primary-500"
                )}
              />
              {milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded-full",
                    completedLessons === totalLessons ? "bg-green-400" : "bg-white"
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
          </div>
        </div>
      </div>
    </Card>
  );
}; 