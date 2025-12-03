import React from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen, TrendingUp, Clock, Users } from 'lucide-react';

interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalLessons: number;
}

interface CourseStatsPanelProps {
  stats: CourseStats | null;
}

/**
 * 课程统计面板组件
 * 显示课程总数、已发布、草稿、总课时等统计信息
 */
export const CourseStatsPanel: React.FC<CourseStatsPanelProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <div className="flex items-start md:items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-slate-600 mb-1">总课程数</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-600">
              {stats.totalCourses}
            </p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-white border-green-100">
        <div className="flex items-start md:items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-slate-600 mb-1">已发布</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">
              {stats.publishedCourses}
            </p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-50 to-white border-amber-100">
        <div className="flex items-start md:items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-slate-600 mb-1">草稿</p>
            <p className="text-2xl md:text-3xl font-bold text-amber-600">
              {stats.draftCourses}
            </p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-50 to-white border-purple-100">
        <div className="flex items-start md:items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-slate-600 mb-1">总课时</p>
            <p className="text-2xl md:text-3xl font-bold text-purple-600">
              {stats.totalLessons}
            </p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
          </div>
        </div>
      </Card>
    </div>
  );
};
