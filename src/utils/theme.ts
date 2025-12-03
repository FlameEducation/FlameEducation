import { theme } from '@/styles/theme';
import { cn } from '@/lib/utils';

export const getThemeStyles = {
  // 获取卡片样式
  card: (variant: keyof typeof theme.components.card = 'default', className?: string) => {
    return cn(theme.components.card[variant], className);
  },

  // 获取按钮样式
  button: (variant: keyof typeof theme.components.button = 'primary', className?: string) => {
    return cn(theme.components.button[variant], className);
  },

  // 获取渐变背景
  gradient: (variant: keyof typeof theme.gradients = 'page', className?: string) => {
    return cn(theme.gradients[variant], className);
  },

  // 获取徽章样式
  badge: (variant: keyof typeof theme.components.badge = 'default', className?: string) => {
    return cn(theme.components.badge[variant], className);
  },

  // 获取进度条样式
  progress: (variant: keyof typeof theme.components.progress = 'default', className?: string) => {
    return cn(theme.components.progress[variant], className);
  },

  // 获取文字样式
  text: (variant: keyof typeof theme.typography.body = 'primary', className?: string) => {
    return cn(theme.typography.body[variant], className);
  },

  // 获取标题样式
  title: (variant: keyof typeof theme.typography.title = 'primary', className?: string) => {
    return cn(theme.typography.title[variant], className);
  },
}; 