import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
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
  // Removed unused Clock icon
} from 'lucide-react';
import { useEnergyOrb } from '@/pages/chat/context/EnergyOrbContext';
// Removed unused Context and API imports

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {

  const { clearHistory, isLoading: isChatHistoryLoading } = useChatHistoryContext();
  const [activeTab, setActiveTab] = useState("general");
  const { courseUuid } = useClassStatusContext();
  const { setLiquidPercentage } = useEnergyOrb();
  
  // 简化后不再需要复杂的状态管理

  const handleClearEnergy = async () => {
    setLiquidPercentage(0);
  };

  const handleClearHistory = async () => {
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-100/50 flex-shrink-0">
            <TabsTrigger value="general" className="text-xs font-medium">
              常规设置
            </TabsTrigger>
            <TabsTrigger value="debug" className="text-xs font-medium">
              调试工具
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 overflow-y-auto flex-1 pr-2">

            {/* 快速操作区域 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-indigo-500" />
                <h3 className="font-semibold text-gray-800">快速操作</h3>
              </div>

              {/* 返回首页快捷导航 */}
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  variant="outline"
                  className="w-full justify-start bg-blue-50/50 border-blue-200 
                           hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                >
                  <Home className="h-4 w-4 mr-2 text-blue-600" />
                  返回首页
                </Button>
              </div>

              {/* 返回课程页面快捷导航 */}
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    window.location.href = `/courses/${courseUuid}`;
                  }}
                  variant="outline"
                  className="w-full justify-start bg-blue-50/50 border-blue-200 
                           hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                >
                  <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                  返回课程页面
                </Button>
              </div>

            </div>
          </TabsContent>

          <TabsContent value="debug" className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold text-gray-800">调试工具</h3>
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  开发者
                </Badge>
              </div>

              <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-200/50 space-y-3">
                
                {/* 存储操作 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                      <Trash2 className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-gray-600">存储操作</span>
                  </div>
                  <div className="flex flex-wrap gap-2">

                      <Button
                        onClick={handleClearHistory}
                        disabled={isChatHistoryLoading}
                        variant="outline"
                        size="sm"
                        className="bg-red-50 border-red-200 text-red-600 
                                 hover:bg-red-100 hover:border-red-300 
                                 disabled:opacity-50 transition-all duration-200"
                      >
                        {isChatHistoryLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            清除中...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-2" />
                            清除记录
                          </>
                        )}
                      </Button>
                  </div>
                </div>

              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 