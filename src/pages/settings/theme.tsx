import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { ThemeType } from '@/styles/theme';

const themes: { id: ThemeType; name: string; description: string }[] = [
  {
    id: 'default',
    name: '默认主题',
    description: '清新蓝色调',
  },
  {
    id: 'warm',
    name: '温暖橙色',
    description: '活力温暖',
  },
  {
    id: 'cool',
    name: '清凉绿色',
    description: '自然清新',
  },
  {
    id: 'forest',
    name: '森林绿',
    description: '生机盎然',
  },
];

// 主题预览组件
const ThemePreview: React.FC<{ themeId: ThemeType }> = ({ themeId }) => {
  const gradients = {
    default: "from-blue-400 via-sky-400 to-indigo-400",
    warm: "from-orange-400 via-amber-400 to-yellow-400",
    cool: "from-cyan-400 via-teal-400 to-emerald-400",
    forest: "from-green-400 via-emerald-400 to-teal-400",
  };

  return (
    <div className={cn(
      "w-16 h-16 rounded-lg overflow-hidden",
      "bg-gradient-to-br",
      gradients[themeId]
    )} />
  );
};

const ThemeSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme, changeTheme, theme } = useTheme();

  return (
    <div className={cn("min-h-full", theme.gradients.page)}>
      {/* 顶部导航 */}
      <div className={theme.gradients.header}>
        <div className="px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={theme.typography.title.primary}>主题设置</h1>
        </div>
      </div>

      {/* 主题选择 */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4">
          {themes.map((themeOption) => (
            <Card
              key={themeOption.id}
              className={cn(
                "relative p-4 cursor-pointer transition-all",
                currentTheme === themeOption.id
                  ? "ring-2 ring-blue-500"
                  : "hover:bg-gray-50"
              )}
              onClick={() => changeTheme(themeOption.id)}
            >
              <div className="flex items-center gap-4">
                <ThemePreview themeId={themeOption.id} />
                
                <div className="flex-1">
                  <h3 className="font-medium">{themeOption.name}</h3>
                  <p className="text-sm text-gray-500">{themeOption.description}</p>
                </div>

                {currentTheme === themeOption.id && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettingsPage; 