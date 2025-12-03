import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  PlayCircle, Clock,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Course } from '@/types/course';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'featured';
  className?: string;
  overlayContent?: React.ReactNode;
}

// 修改等级映射的样式
const LEVEL_MAP = {
  0: { text: '初级', color: 'bg-white/90 text-green-600' },
  1: { text: '中级', color: 'bg-white/90 text-blue-600' },
  2: { text: '高级', color: 'bg-white/90 text-purple-600' },
  3: { text: '进阶', color: 'bg-white/90 text-orange-600' }
} as const;

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  variant = 'default',
  className,
  overlayContent
}) => {
  const navigate = useNavigate();

  // 通用的装饰性圆形覆盖层
  const CircleOverlay = () => (
    <>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full 
        -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full 
        -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-300" />
      
      {/* 播放按钮 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 
        group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center 
          justify-center transform group-hover:scale-110 transition-transform">
          <PlayCircle className="w-7 h-7 text-white" />
        </div>
      </div>
    </>
  );

  // 修改 CoverBadges 组件中的等级标签样式
  const CoverBadges = () => (
    <>
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
        {/* 等级标签 */}
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium shadow-sm flex items-center gap-1",
          LEVEL_MAP[course.level as keyof typeof LEVEL_MAP]?.color || 'bg-white/90 text-gray-600'
        )}>
          <GraduationCap className="w-3 h-3" />
          {LEVEL_MAP[course.level as keyof typeof LEVEL_MAP]?.text || '未知'}
        </span>

        {/* 热门标签 */}
        {course.isHot && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            热门
          </span>
        )}
      </div>

      {/* 右上角推荐标签 */}
      {course.recommendReason && (
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-orange-500/90 text-white text-xs rounded-full z-10 backdrop-blur-sm">
          {course.recommendReason}
        </div>
      )}
    </>
  );

  // 优化的 CoverImage 组件，减少重新渲染
  const CoverImage = React.memo(({ src, alt }: { src: string; alt: string }) => {
    return (
      <div className="absolute inset-0">
        {/* 图片 */}
        <img 
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/10" />
      </div>
    );
  });

  if (variant === 'featured') {
    return (
      <Card 
        className={cn(
          "hover:shadow-md transition-all cursor-pointer flex-shrink-0 w-[280px] group overflow-hidden",
          className
        )}
        onClick={() => navigate(`/courses/${course.id}`)}
      >
        <div className="relative aspect-[2/1]">
          {course.thumbnail && (
            <CoverImage src={course.thumbnail} alt={course.title} />
          )}
          
          <CircleOverlay />
          <CoverBadges />  {/* 添加标签组 */}
          {overlayContent}
          
          {course.recommendReason && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500 text-white text-xs rounded-full z-10">
              {course.recommendReason}
            </div>
          )}
        </div>

        <div className="p-3">
          {/* 标题 */}
          <h3 className="font-medium text-base text-gray-800 mb-2 line-clamp-1 group-hover:text-primary-500 transition-colors">
            {course.title}
          </h3>

          {/* 课程标签 - 新设计 */}
          <div className="flex items-center flex-wrap gap-1.5 mb-3">
            <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full">
              {course.subject}
            </span>
            {course.tags?.slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{course.duration || course.totalDuration}分钟</span>
            </div>
            <span className="font-medium text-primary-600">{course.totalLessons} 课时</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "group cursor-pointer overflow-hidden hover:shadow-lg w-full",
        className
      )}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="flex flex-col md:flex-row md:h-[140px]">
        <div className={cn(
          "relative aspect-[2/1]",
          "md:w-[300px] md:aspect-auto md:h-full shrink-0"
        )}>
          {course.thumbnail && (
            <CoverImage src={course.thumbnail} alt={course.title} />
          )}
          
          <CircleOverlay />
          <CoverBadges />  {/* 添加标签组 */}
          {overlayContent}

          {course.recommendReason && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500 text-white text-xs rounded-full z-10">
              {course.recommendReason}
            </div>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col">
          {/* 标题和主要标签 */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-lg font-medium text-gray-800 line-clamp-1 group-hover:text-primary-500">
                {course.title}
              </h3>
              <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full shrink-0">
                {course.subject}
              </span>
            </div>
            
            {/* 课程标签 - 新设计 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {course.tags?.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 描述 */}
          <p className="text-sm text-gray-500 line-clamp-2 mb-auto">
            {course.description}
          </p>

          {/* 底部信息栏 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{course.duration || course.totalDuration}分钟</span>
              </div>
            </div>
            <div className="text-sm font-medium text-primary-600">
              {course.totalChapters} 章 · {course.totalLessons} 课时
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 