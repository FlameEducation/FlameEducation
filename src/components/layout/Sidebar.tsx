import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

interface SidebarProps {
  navItems: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AI Learn</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div 
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">个人中心</p>
            <p className="text-xs text-gray-500 truncate">查看详情</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
