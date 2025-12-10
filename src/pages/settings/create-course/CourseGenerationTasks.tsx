import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as autoCourseApi from '@/api/autoCourse';
import { CourseGenerationStatusVo } from '@/types/course-generation';
import { toast } from "sonner";

interface CourseGenerationTasksProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseGenerationTasks({ open, onOpenChange }: CourseGenerationTasksProps) {
  const [tasks, setTasks] = useState<CourseGenerationStatusVo[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      // Don't set loading to true on every poll to avoid flickering
      if (tasks.length === 0) setLoading(true);
      const data = await autoCourseApi.getGeneratingCourses();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTasks();
      const interval = setInterval(fetchTasks, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [open]);

  const handleRetry = async (courseUuid: string) => {
    try {
      setRetrying(courseUuid);
      await autoCourseApi.retryFailedLessons(courseUuid);
      toast.success("重试任务已启动");
      fetchTasks();
    } catch (error) {
      toast.error("重试失败");
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500 hover:bg-green-600">已完成</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">失败</Badge>;
      case 'PARTIAL_SUCCESS':
        return <Badge className="bg-orange-500 hover:bg-orange-600">部分成功</Badge>;
      case 'GENERATING':
        return <Badge variant="secondary" className="text-violet-600 bg-violet-50"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 生成中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>课程生成任务中心</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {loading && tasks.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              暂无正在进行的生成任务
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.sessionUuid} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-slate-800">{task.generatedCourseTitle || "未命名课程"}</h3>
                    <p className="text-xs text-slate-500 mt-1">{task.stepDescription}</p>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
                
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>进度</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                </div>

                {task.status === 'PARTIAL_SUCCESS' && (
                  <div className="mt-3 flex justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => handleRetry(task.generatedCourseUuid!)}
                      disabled={retrying === task.generatedCourseUuid}
                    >
                      {retrying === task.generatedCourseUuid ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      重试失败课时
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
