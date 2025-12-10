import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, Bell, Settings } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  path: string;
}

interface HeaderProps {
  navItems: NavItem[];
}

export const Header: React.FC<HeaderProps> = ({ navItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentItem = navItems.find(item => item.path === location.pathname);
  const title = currentItem ? currentItem.label : '篝火学';

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        {/* 移动端 Logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">篝火学</span>
        </div>

        {/* 桌面端标题/面包屑 */}
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-gray-900">
            {title}
          </h1>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-4">
          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
