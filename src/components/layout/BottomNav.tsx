import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

interface BottomNavProps {
  className?: string;
  navItems: NavItem[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ className, navItems }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={cn("md:hidden border-t border-gray-200 bg-white", className)}>
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex-col h-auto py-2 gap-1",
                isActive ? "text-gray-900" : "text-gray-400"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}; 