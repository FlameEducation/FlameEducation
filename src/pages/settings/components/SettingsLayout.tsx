import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeft, Settings, Cloud, MessageSquare, BookOpen, ChevronRight, Mic, Image, AudioLines, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SettingsLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    label: '文本生成配置',
    path: '/settings/providers',
    icon: Cloud,
    description: '管理文本生成服务商'
  },
  {
    label: '语音合成配置',
    path: '/settings/voice-config',
    icon: Mic,
    description: '配置语音合成参数'
  },
  {
    label: '语音识别配置',
    path: '/settings/asr-config',
    icon: AudioLines,
    description: '配置语音识别参数'
  },
  {
    label: '图片生成配置',
    path: '/settings/image-config',
    icon: Image,
    description: '配置绘图参数'
  },
  {
    label: '提示词配置',
    path: '/settings/scene-config',
    icon: MessageSquare,
    description: '维护 Prompt 模板'
  },
  {
    label: '课程管理',
    path: '/settings/courses',
    icon: BookOpen,
    description: '课程资源管理'
  },
  {
    label: '课程创建',
    path: '/settings/courses/create',
    icon: BookOpen,
    description: '创建新课程'
  },
];

const SettingsSidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 侧边栏头部 */}
      <div className="border-b border-slate-200 p-6">
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">返回</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-lg shadow-blue-500/30">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">系统设置</h2>
            <p className="text-xs text-slate-500">System Settings</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
                className={cn(
                  'group w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all',
                  active
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                <div className={cn(
                  'rounded-lg p-2 transition-colors',
                  active ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'
                )}>
                  <Icon className={cn('h-4 w-4', active ? 'text-white' : 'text-slate-600')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'text-sm font-medium truncate',
                    active ? 'text-white' : 'text-slate-900'
                  )}>
                    {item.label}
                  </div>
                  <div className={cn(
                    'text-xs truncate',
                    active ? 'text-blue-100' : 'text-slate-500'
                  )}>
                    {item.description}
                  </div>
                </div>
                <ChevronRight className={cn(
                  'h-4 w-4 transition-transform',
                  active ? 'text-white translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'
                )} />
              </button>
            );
          })}
        </div>
      </nav>

      {/* 侧边栏底部 */}
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-500 p-1.5">
              <Settings className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-900">配置提示</div>
              <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                修改配置后记得保存，部分设置需要重启生效
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ title, description, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen-stable overflow-hidden bg-slate-50">
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex w-72 border-r border-slate-200 bg-white flex-col">
        <SettingsSidebarContent />
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 内容头部 */}
        <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-8 md:py-6">
          <div className="flex items-center gap-4">
            {/* 移动端菜单按钮 */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                  <Menu className="h-6 w-6 text-slate-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SettingsSidebarContent onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-slate-600 hidden sm:block">{description}</p>
              ) : null}
            </div>
          </div>
        </header>

        {/* 内容主体 */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <div className="h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsLayout;
