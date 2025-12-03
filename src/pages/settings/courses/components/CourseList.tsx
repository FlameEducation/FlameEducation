import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { CourseCard } from './CourseCard';

interface Course {
  uuid: string;
  title: string;
  description: string;
  status: number;
  totalChapters?: number;
  totalLessons?: number;
  createdAt?: string;
}

interface PromptTemplate {
  uuid?: string;
  sceneUuid?: string;
  promptName?: string;
  name?: string;
  aiModelName?: string;
  templateType?: string;
  sceneType?: string;
}

interface CoursePromptBinding {
  courseUuid: string;
  chatPromptUuid?: string;
  blackboardPromptUuid?: string;
  imagePromptUuid?: string;
}

interface ToolBinding {
  toolUuid: string;
  toolName: string;
  toolDescription: string;
  isEnabled: boolean;
}

interface CourseListProps {
  courses: Course[];
  loading: boolean;
  sortBy: string;
  onSortChange: (value: string) => void;
  promptTemplates: PromptTemplate[];
  coursePromptBindings: Record<string, CoursePromptBinding>;
  courseToolBindings: Record<string, ToolBinding[]>;
  onEdit: (courseUuid: string) => void;
  onDelete: (courseUuid: string) => void;
  onToggleStatus: (courseUuid: string, currentStatus: number) => void;
  onUpdatePromptBinding: (
    courseUuid: string,
    sceneType: 'chat' | 'blackboard' | 'image',
    promptUuid?: string
  ) => void;
  onToggleTool: (courseUuid: string, toolUuid: string, enabled: boolean) => void;
  onCreate: () => void;
}

/**
 * 课程列表组件
 * 显示所有课程卡片并提供排序功能
 */
export const CourseList: React.FC<CourseListProps> = ({
  courses,
  loading,
  sortBy,
  onSortChange,
  promptTemplates,
  coursePromptBindings,
  courseToolBindings,
  onEdit,
  onDelete,
  onToggleStatus,
  onUpdatePromptBinding,
  onToggleTool,
  onCreate,
}) => {
  // 获取排序后的课程列表
  const getSortedCourses = () => {
    const sortedList = [...courses];

    switch (sortBy) {
      case 'createTime':
        // 按创建时间倒序（最新的在前）
        return sortedList.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
      case 'progress':
        // 按课程课时倒序（课时最多的在前）
        return sortedList.sort((a, b) => {
          const lessonsA = a.totalLessons || 0;
          const lessonsB = b.totalLessons || 0;
          return lessonsB - lessonsA;
        });
      case 'title':
        // 按课程名称字母顺序排序
        return sortedList.sort((a, b) => {
          return (a.title || '').localeCompare(b.title || '', 'zh-CN');
        });
      default:
        return sortedList;
    }
  };

  return (
    <Card className="p-4 md:p-6">
      {/* 标题和排序控件 */}
      <div className="mb-4 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
        <h2 className="text-lg font-bold text-slate-800">课程列表</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 whitespace-nowrap">排序：</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-8 text-xs md:text-sm md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createTime">创建时间</SelectItem>
              <SelectItem value="progress">课程进度</SelectItem>
              <SelectItem value="title">课程名称</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-600">加载中...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">暂无课程</p>
          <Button onClick={onCreate} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            创建第一个课程
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {getSortedCourses().map((course) => (
            <CourseCard
              key={course.uuid}
              course={course}
              promptTemplates={promptTemplates}
              coursePromptBinding={coursePromptBindings[course.uuid] || {}}
              toolBindings={courseToolBindings[course.uuid] || []}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onUpdatePromptBinding={onUpdatePromptBinding}
              onToggleTool={onToggleTool}
            />
          ))}
        </div>
      )}
    </Card>
  );
};
