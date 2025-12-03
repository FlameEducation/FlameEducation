import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PromptBindingPopover } from './PromptBindingPopover';
import { ToolBindingPopover } from './ToolBindingPopover';

interface Course {
  uuid: string;
  title: string;
  description: string;
  status: number;
  totalChapters?: number;
  totalLessons?: number;
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

interface CourseCardProps {
  course: Course;
  promptTemplates: PromptTemplate[];
  coursePromptBinding: CoursePromptBinding;
  toolBindings: ToolBinding[];
  onEdit: (courseUuid: string) => void;
  onDelete: (courseUuid: string) => void;
  onToggleStatus: (courseUuid: string, currentStatus: number) => void;
  onUpdatePromptBinding: (
    courseUuid: string,
    sceneType: 'chat' | 'blackboard' | 'image',
    promptUuid?: string
  ) => void;
  onToggleTool: (courseUuid: string, toolUuid: string, enabled: boolean) => void;
}

/**
 * 课程卡片组件
 * 显示单个课程的信息和操作按钮
 */
export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  promptTemplates,
  coursePromptBinding,
  toolBindings,
  onEdit,
  onDelete,
  onToggleStatus,
  onUpdatePromptBinding,
  onToggleTool,
}) => {
  const totalTools = toolBindings.length;
  const enabledTools = toolBindings.filter((tool) => tool.isEnabled).length;

  return (
    <div className="border rounded-lg hover:bg-slate-50 transition-colors p-3 md:p-4">
      {/* 标题行 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm md:text-base truncate">
            {course.title}
          </h3>
          <p className="text-xs md:text-sm text-slate-500 line-clamp-1 mt-0.5">
            {course.description}
          </p>
        </div>
        <Badge
          variant={course.status === 1 ? 'default' : 'secondary'}
          className="cursor-pointer hover:opacity-75 transition-opacity text-xs flex-shrink-0"
          onClick={() => onToggleStatus(course.uuid, course.status)}
          title="点击切换课程状态"
        >
          {course.status === 1 ? '发布' : '草稿'}
        </Badge>
      </div>

      {/* 课程信息行 */}
      <div className="flex items-center gap-2 md:gap-4 text-xs text-slate-600 mb-3 flex-wrap">
        <span>📚 {course.totalChapters || 0} 章</span>
        <span>⏱️ {course.totalLessons || 0} 课</span>
      </div>

      {/* Prompt 状态行 */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <span className="text-xs font-medium text-slate-600 mr-1">Prompt:</span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
            coursePromptBinding.chatPromptUuid
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          💬{coursePromptBinding.chatPromptUuid ? '✓' : '✗'}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
            coursePromptBinding.blackboardPromptUuid
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          📝{coursePromptBinding.blackboardPromptUuid ? '✓' : '✗'}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
            coursePromptBinding.imagePromptUuid
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          🎨{coursePromptBinding.imagePromptUuid ? '✓' : '✗'}
        </span>
      </div>

      {/* 工具状态行 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
        <span className="font-medium text-slate-600">工具:</span>
        {totalTools > 0 ? (
          <Badge
            variant="outline"
            className={
              enabledTools === totalTools
                ? 'border-green-400 text-green-600'
                : 'border-amber-400 text-amber-600'
            }
          >
            {enabledTools}/{totalTools}
          </Badge>
        ) : (
          <span className="text-slate-400">加载中...</span>
        )}
      </div>

      {/* 操作按钮行 */}
      <div className="flex items-center justify-between md:justify-start gap-1 md:gap-2 flex-wrap">
        {/* 工具开关 Popover */}
        <ToolBindingPopover
          toolBindings={toolBindings}
          onToggleTool={(toolUuid, enabled) => onToggleTool(course.uuid, toolUuid, enabled)}
        />

        {/* Prompt 设置 Popover */}
        <PromptBindingPopover
          promptTemplates={promptTemplates}
          coursePromptBinding={coursePromptBinding}
          onUpdatePromptBinding={(sceneType, promptUuid) =>
            onUpdatePromptBinding(course.uuid, sceneType, promptUuid)
          }
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(course.uuid)}
          className="h-8 px-2"
          title="编辑课程"
        >
          ✏️
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(course.uuid)}
          className="h-8 px-2"
          title="删除课程"
        >
          🗑️
        </Button>

        {/* 状态开关 */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-600 hidden md:inline">发布状态</span>
          <Switch
            checked={course.status === 1}
            onCheckedChange={() => onToggleStatus(course.uuid, course.status)}
            className="scale-75 md:scale-100 origin-right"
          />
        </div>
      </div>
    </div>
  );
};
