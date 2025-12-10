import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// Removed unused UI component imports
import { Button } from '@/components/ui/button';
import { useChatHistoryContext } from '@/pages/chat/context/ChatHistoryContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useClassStatusContext } from '@/pages/chat/context/ClassStatusContext';
import { triggerGlobalConfetti, triggerGlobalTitleAnimation } from './ChatHeader';
// Removed unused toast import
import {
  Volume2,
  Home,
  Trash2,
  Bug,
  Settings2,
  Palette,
  Loader2,
  BookOpen,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  // Removed unused Clock icon
} from 'lucide-react';
import { useEnergyOrb } from '@/pages/chat/context/EnergyOrbContext';
// Removed unused Context and API imports

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {

  const { clearHistory, isLoading: isChatHistoryLoading } = useChatHistoryContext();
  const [activeTab, setActiveTab] = useState("general");
  const { courseUuid } = useClassStatusContext();
  const { setLiquidPercentage } = useEnergyOrb();
  
  // 简化后不再需要复杂的状态管理

  const handleClearEnergy = async () => {
    setLiquidPercentage(0);
  };

  const handleRestartLesson = async () => {
    await clearHistory();
    onOpenChange(false); // 关闭对话框
  };

  const handleTriggerCelebration = () => {
    triggerGlobalTitleAnimation();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[85vw] sm:max-w-[600px] h-[80vh] bg-white/95 backdrop-blur-sm border-0 shadow-2xl flex flex-col">
        <DialogHeader className="text-center pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r 
                                from-indigo-600 via-purple-600 to-blue-500 
                                bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-600" />
            学习设置
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            个性化你的学习体验和偏好设置
          </DialogDescription>
        </DialogHeader>

        <div className="w-full flex flex-col h-full overflow-hidden">
          <div className="space-y-4 overflow-y-auto flex-1 pr-2 px-6">

            {/* 快速操作区域 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-indigo-500" />
                <h3 className="font-semibold text-gray-800">快速操作</h3>
              </div>

              {/* 移动端缩放控制 */}
              <div className="md:hidden space-y-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">页面缩放</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9" 
                    onClick={onZoomOut}
                  >
                    <ZoomOut className="h-4 w-4 mr-1" />
                    缩小
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9" 
                    onClick={onZoomIn}
                  >
                    <ZoomIn className="h-4 w-4 mr-1" />
                    放大
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={onResetZoom}
                    title="重置"
                  >
                    <RotateCcw className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>

              {/* 导航按钮组 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 
                           hover:from-blue-100 hover:to-indigo-100 hover:border-blue-200 transition-all duration-200 group"
                >
                  <div className="bg-white p-2 rounded-full shadow-sm mr-3 group-hover:scale-110 transition-transform">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-700">返回首页</span>
                    <span className="text-xs text-gray-500">回到系统主页</span>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    window.location.href = `/courses/${courseUuid}`;
                  }}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 
                           hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-200 transition-all duration-200 group"
                >
                  <div className="bg-white p-2 rounded-full shadow-sm mr-3 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-700">返回课程</span>
                    <span className="text-xs text-gray-500">查看课程详情</span>
                  </div>
                </Button>
              </div>

              {/* 重启本节课 */}
              <div className="pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-red-50 border-red-100 
                               hover:bg-red-100 hover:border-red-200 text-red-600 transition-all duration-200 group h-auto py-3"
                    >
                      <div className="bg-white p-2 rounded-full shadow-sm mr-3 group-hover:scale-110 transition-transform">
                        <RotateCcw className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold">重启本节课</span>
                        <span className="text-xs text-red-400/80">清除所有进度重新开始</span>
                      </div>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认重启本节课？</AlertDialogTitle>
                      <AlertDialogDescription className="text-red-600 font-medium">
                        重启后本节课的进度、宝石、聊天记录等数据全部丢失，是否确认？
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleRestartLesson}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        确认重启
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 