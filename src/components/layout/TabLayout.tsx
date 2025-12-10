import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { Home, MessageSquare, User, BookOpen } from 'lucide-react';

const navItems = [
  {
    id: 'home',
    label: '首页',
    icon: Home,
    path: '/'
  },
  {
    id: 'courses',
    label: '课程',
    icon: BookOpen,
    path: '/courses/all-courses'
  },
  {
    id: 'tutor',
    label: '效率',
    icon: MessageSquare,
    path: '/tutor'
  },
  {
    id: 'profile',
    label: '我的',
    icon: User,
    path: '/profile'
  }
];

const TabLayout: React.FC = () => {
  const location = useLocation();
  
  // AI小老师页面使用 overflow-hidden，其他页面允许滚动
  const isAITutorPage = location.pathname === '/tutor';

  return (
    <div className="flex bg-gray-50 overflow-hidden h-screen-stable">
      {/* 桌面端侧边栏 */}
      <Sidebar navItems={navItems} />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 顶部导航栏 */}
        <Header navItems={navItems} />

        {/* 滚动内容区域 */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-gray-50",
          isAITutorPage ? "overflow-hidden" : ""
        )}>
          <Outlet />
        </main>

        {/* 移动端底部导航栏 */}
        <BottomNav className="md:hidden" navItems={navItems} />
      </div>
    </div>
  );
};

export default TabLayout; 