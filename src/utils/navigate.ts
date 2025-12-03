import { NavigateFunction } from 'react-router-dom';

let navigateInstance: NavigateFunction | null = null;

// 初始化导航实例
export const initNavigate = (navigate: NavigateFunction) => {
  navigateInstance = navigate;
};

// 页面路由定义
export const RoutePath = {
  HOME: '/',
  LOGIN: '/auth/login',
  CHAT: '/chat',
  MANAGE: '/manage',
  NOT_FOUND: '/error/not-found-page'
} as const;

type RoutePathType = typeof RoutePath[keyof typeof RoutePath];

interface NavigateOptions {
  replace?: boolean;
  params?: Record<string, string>;
}

// 导航工具函数
export const navigateTo = (
  path: RoutePathType,
  options: NavigateOptions = {}
) => {
  if (!navigateInstance) {
    console.error('Navigate instance not initialized');
    return;
  }

  const { replace = false, params = {} } = options;

  // 构建URL查询参数
  const queryParams = new URLSearchParams(params).toString();
  const fullPath = queryParams ? `${path}?${queryParams}` : path;

  navigateInstance(fullPath, { replace });
};

// 返回上一页
export const goBack = () => {
  if (!navigateInstance) {
    console.error('Navigate instance not initialized');
    return;
  }
  navigateInstance(-1);
};

// 刷新当前页面
export const refreshPage = () => {
  window.location.reload();
};

// 组合导航和刷新
export const navigateAndRefresh = (
  path: RoutePathType,
  options: NavigateOptions = {}
) => {
  navigateTo(path, options);
  setTimeout(refreshPage, 100);
};
