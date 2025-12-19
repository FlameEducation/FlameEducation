import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Download,
  Pencil,
  Trash2,
  Layers,
  Clock,
  MessageSquare,
  FileText,
  Wrench,
  Settings,
  Image as ImageIcon,
  Loader2,
  Sparkles
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  uuid: string;
  title: string;
  description: string;
  status: number;
  totalChapters?: number;
  totalLessons?: number;
  coverImageUrl?: string;
}

interface PromptTemplate {
  uuid?: string;
  sceneUuid?: string;
  promptName?: string;
  name?: string;
  aiModelName?: string;
  templateType?: string;
  sceneType?: string;
  isEnabled?: boolean;
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
  isGeneratingCover?: boolean;
  onEdit: (courseUuid: string) => void;
  onDelete: (courseUuid: string) => void;
  onToggleStatus: (courseUuid: string, currentStatus: number) => void;
  onUpdatePromptBinding: (
    courseUuid: string,
    sceneType: 'chat' | 'blackboard' | 'image',
    promptUuid?: string
  ) => void;
  onToggleTool: (courseUuid: string, toolUuid: string, enabled: boolean) => void;
  onGenerateCover: (courseUuid: string) => void;
  onExport?: (courseUuid: string, title: string) => void;
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
  isGeneratingCover,
  onEdit,
  onDelete,
  onToggleStatus,
  onUpdatePromptBinding,
  onToggleTool,
  onGenerateCover,
  onExport,
}) => {
  const totalTools = toolBindings.length;
  const enabledTools = toolBindings.filter((tool) => tool.isEnabled).length;

  return (
    <div
      className="bg-white border rounded-xl hover:shadow-md transition-all p-4 flex flex-col md:flex-row gap-4"
    >
      {/* 左侧：封面图 */}
      <div className="w-full h-48 md:w-40 md:h-28 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 relative group self-start">
          {course.coverImageUrl ? (
            <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 relative">
              {isGeneratingCover ? (
                 <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">生成中...</span>
                 </div>
              ) : (
                 <>
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute inset-0 w-full h-full bg-black/0 hover:bg-black/5 flex flex-col items-center justify-center gap-1 text-transparent hover:text-blue-600 transition-all"
                      onClick={() => onGenerateCover(course.uuid)}
                    >
                       <Sparkles className="w-6 h-6" />
                       <span className="text-xs font-bold">一键生成</span>
                    </Button>
                 </>
              )}
            </div>
          )}
      </div>

      {/* 右侧：所有内容 */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* 第一行：标题、状态、描述、操作按钮 */}
          <div className="flex justify-between items-start gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-base truncate max-w-full">
                          {course.title}
                      </h3>
                      <Badge 
                          variant={course.status === 1 ? 'default' : 'secondary'}
                          className="cursor-pointer hover:opacity-80 transition-opacity h-5 text-xs px-1.5 flex-shrink-0"
                          onClick={() => onToggleStatus(course.uuid, course.status || 0)}
                      >
                          {course.status === 1 ? '已发布' : '草稿'}
                      </Badge>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 md:line-clamp-1">
                      {course.description || '暂无描述'}
                  </p>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                  {onExport && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onExport(course.uuid, course.title)}
                      className="h-8 w-8 md:h-7 md:w-7 text-slate-500 hover:text-green-600"
                      title="导出课程"
                    >
                      <Download className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(course.uuid)}
                    className="h-8 w-8 md:h-7 md:w-7 text-slate-500 hover:text-blue-600"
                    title="编辑课程"
                  >
                    <Pencil className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(course.uuid)}
                    className="h-8 w-8 md:h-7 md:w-7 text-slate-500 hover:text-red-600"
                    title="删除课程"
                  >
                    <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                  </Button>
              </div>
          </div>

          {/* 第二行：统计信息 + Prompt/工具状态 */}
          <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">{course.totalChapters || 0} 章</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs">{course.totalLessons || 0} 课时</span>
                  </div>
              </div>
              
              <div className="w-px h-3 bg-slate-200 hidden md:block" />

              <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Prompt 状态 */}
                  <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">Prompt:</span>
                      <div className="flex items-center gap-1">
                          <MessageSquare className={`w-3.5 h-3.5 ${coursePromptBinding?.chatPromptUuid ? 'text-green-500' : 'text-slate-300'}`} />
                          <FileText className={`w-3.5 h-3.5 ${coursePromptBinding?.blackboardPromptUuid ? 'text-green-500' : 'text-slate-300'}`} />
                      </div>
                  </div>

                  {/* 工具状态 */}
                  <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">工具:</span>
                      {totalTools > 0 ? (
                          <span className={`text-xs font-medium ${enabledTools === totalTools ? 'text-green-600' : 'text-amber-600'}`}>
                          {enabledTools}/{totalTools}
                          </span>
                      ) : (
                          <span className="text-xs text-slate-400">-</span>
                      )}
                  </div>
              </div>
          </div>

          {/* 第三行：配置按钮 */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
               <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 md:h-7 text-xs gap-1.5 px-3 md:px-2 flex-1 md:flex-none">
                      <Wrench className="w-3 h-3" />
                      配置工具
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">工具配置</h3>
                          <span className="text-xs text-slate-500">已启用 {enabledTools}/{totalTools}</span>
                        </div>
                        {toolBindings.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {toolBindings.map(tool => (
                              <div
                                key={tool.toolUuid}
                                className="flex items-start justify-between gap-3 border rounded-md p-2 hover:bg-slate-50"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-slate-700 truncate">{tool.toolName}</p>
                                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{tool.toolDescription}</p>
                                </div>
                                <Switch
                                  checked={tool.isEnabled}
                                  onCheckedChange={(checked) => onToggleTool(course.uuid, tool.toolUuid, checked)}
                                  className="scale-75 data-[state=checked]:bg-green-600"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 py-2 text-center">暂无可用工具</p>
                        )}
                      </div>
                  </PopoverContent>
               </Popover>

               <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 md:h-7 text-xs gap-1.5 px-3 md:px-2 flex-1 md:flex-none">
                      <Settings className="w-3 h-3" />
                      配置 Prompt
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm border-b pb-2">Prompt 绑定设置</h3>
                      
                      {/* 聊天场景 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span>聊天场景</span>
                        </div>
                        <Select
                          defaultValue={coursePromptBinding?.chatPromptUuid || 'none'}
                          onValueChange={(value) => onUpdatePromptBinding(course.uuid, 'chat', value === 'none' ? undefined : value)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="选择 Prompt 模板" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">不绑定</SelectItem>
                            {promptTemplates
                              .filter(t => (t.templateType === 'CHAT' && t.isEnabled === true))
                              .map(template => (
                                <SelectItem key={template.uuid || template.sceneUuid} value={template.uuid || template.sceneUuid || ''}>
                                  {template.templateName || template.promptName || template.name || template.aiModelName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 小黑板场景 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <FileText className="w-4 h-4 text-amber-500" />
                          <span>小黑板场景</span>
                        </div>
                        <Select
                          defaultValue={coursePromptBinding?.blackboardPromptUuid || 'none'}
                          onValueChange={(value) => onUpdatePromptBinding(course.uuid, 'blackboard', value === 'none' ? undefined : value)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="选择 Prompt 模板" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">不绑定</SelectItem>
                            {promptTemplates
                              .filter(t => (t.templateType === 'BLACKBOARD' && t.isEnabled === true))
                              .map(template => (
                                <SelectItem key={template.uuid || template.sceneUuid} value={template.uuid || template.sceneUuid || ''}>
                                  {template.templateName || template.promptName || template.name || template.aiModelName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
               </Popover>
               
               <div className="flex-1 hidden md:block" />
               
               <div className="flex items-center justify-end gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <span className="text-xs text-slate-500">
                    {course.status === 1 ? '已发布' : '未发布'}
                  </span>
                  <Switch
                    checked={course.status === 1}
                    onCheckedChange={() => onToggleStatus(course.uuid, course.status)}
                    className="scale-75 data-[state=checked]:bg-green-600"
                  />
               </div>
          </div>
      </div>
    </div>
  );
};
