import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {X} from 'lucide-react';
import {LessonInfoPanel} from '../Layout/Header/LessonInfoPanel.tsx';
import {useClassStatusContext} from "@/pages/chat/context/ClassStatusContext.tsx";

interface LessonInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LessonInfoDialog: React.FC<LessonInfoDialogProps> = ({
                                                                    open,
                                                                    onOpenChange,
                                                                  }) => {

  const {
    lessonInfo,
    isLoading
  } = useClassStatusContext()


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 h-[85vh] max-h-[600px] flex flex-col overflow-hidden">
        <DialogHeader
          className="px-4 py-2 border-b border-gray-100 flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-base">
            课程详情
          </DialogTitle>
          <DialogClose
            className="rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4"/>
            <span className="sr-only">关闭</span>
          </DialogClose>
        </DialogHeader>

        {/* 直接使用 LessonInfoPanel 组件 */}
        <div className="flex-1 overflow-hidden">
          <LessonInfoPanel lessonInfo={lessonInfo} isLoading={isLoading}/>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 