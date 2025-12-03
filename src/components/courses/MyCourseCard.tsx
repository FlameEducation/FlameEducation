import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Unit {
  id: number;
  title: string;
  totalLessons: number;
  completedLessons: number;
}

interface Course {
  uuid: string;
  title: string;
  coverImageUrl: string;
  units: Unit[];
  nextAchievement?: {
    title: string;
    remainingUnits: number;
  };
}

interface MyCourseCardProps {
  course: Course;
}

export const MyCourseCard: React.FC<MyCourseCardProps> = ({ course }) => {
  const navigate = useNavigate();

  // 计算总课时和已完成课时
  const totalLessons = course?.units?.reduce((sum: number, unit: Unit) => sum + unit.totalLessons, 0);
  const completedLessons = course?.units?.reduce((sum: number, unit: Unit) => sum + unit.completedLessons, 0);

  // 计算里程碑位置
  const milestones = course?.units?.map((unit: Unit, index: number) => ({
    id: unit.id,
    title: unit.title,
    position: (course?.units
      .slice(0, index + 1)
      .reduce((sum: number, u: Unit) => sum + u.totalLessons, 0) / totalLessons) * 100
  }));

  return (
    <Card 
      className="w-[300px] group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={() => navigate(`/courses/${course.uuid}`)}
    >
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
        </div>

        {/* 内容区域 */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-medium text-gray-800 mb-4 line-clamp-2">
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

            {/* 成就提示 */}
            {course.nextAchievement && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500">
                <Trophy className="w-3.5 h-3.5" />
                <span>再完成{course.nextAchievement.remainingUnits}个单元，获得"{course.nextAchievement.title}"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}; 