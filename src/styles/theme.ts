// 定义主题类型
export type ThemeType = 'default' | 'warm' | 'cool' | 'forest';

// 创建多套颜色方案
const themeColors = {
  default: {
    primary: {
      light: 'blue-500',
      main: 'indigo-500',
      dark: 'purple-500',
    },
    secondary: {
      light: 'blue-50',
      main: 'white',
      dark: 'purple-50',
    },
  },
  warm: {
    primary: {
      light: 'orange-400',
      main: 'amber-400',
      dark: 'yellow-400',
    },
    secondary: {
      light: 'orange-50',
      main: 'white',
      dark: 'yellow-100',
    },
  },
  cool: {
    primary: {
      light: 'cyan-400',
      main: 'teal-400',
      dark: 'emerald-400',
    },
    secondary: {
      light: 'cyan-50',
      main: 'white',
      dark: 'teal-100',
    },
  },
  forest: {
    primary: {
      light: 'green-400',
      main: 'emerald-400',
      dark: 'teal-400',
    },
    secondary: {
      light: 'green-50',
      main: 'white',
      dark: 'emerald-100',
    },
  },
} as const;

// 创建主题生成函数
export const createTheme = (themeType: ThemeType) => {

  const colors = {
    ...themeColors[themeType],
    accent: {
      yellow: 'yellow-300',
      green: 'green-500',
      red: 'red-500',
    },
    text: {
      primary: 'gray-900',
      secondary: 'gray-500',
      white: 'white',
    },
    background: {
      white: 'white',
      light: 'gray-50',
      dark: 'gray-900',
    },
    status: {
      success: {
        light: 'green-100',
        main: 'green-500',
        text: 'green-600',
      },
      warning: {
        light: 'yellow-100',
        main: 'yellow-500',
        text: 'yellow-600',
      },
      error: {
        light: 'red-100',
        main: 'red-500',
        text: 'red-600',
      }
    }
  } as const;

  return {
    // 背景渐变
    gradients: {
      // 全局背景
      page: `bg-gradient-to-br from-${colors.secondary.light} via-${colors.secondary.main} to-${colors.secondary.dark}`,
      // 头部背景
      header: `bg-gradient-to-br from-${colors.primary.light} via-${colors.primary.main} to-${colors.primary.dark}`,
      // 卡片渐变
      card: {
        primary: `bg-gradient-to-r from-${colors.primary.light} to-${colors.primary.dark}`,
        secondary: `bg-gradient-to-br from-purple-500 to-blue-500`,
      }
    },

    // 组件样式
    components: {
      // 卡片样式
      card: {
        default: "bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all",
        glass: "bg-white/10 backdrop-blur-sm rounded-xl",
        interactive: "hover:scale-[1.02] transition-all",
      },

      // 按钮样式
      button: {
        primary: `bg-${colors.primary.main} hover:bg-${colors.primary.dark} text-white`,
        secondary: "bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700",
        ghost: "hover:bg-white/10 text-white",
        danger: `text-${colors.accent.red} hover:bg-red-50`,
        icon: {
          ghost: "rounded-full bg-white/10 hover:bg-white/20 text-white",
        }
      },

      // 进度条
      progress: {
        default: "h-2",
        thin: "h-1",
        background: "bg-white/20",
        indicator: {
          primary: `bg-${colors.primary.main}`,
          success: `bg-${colors.accent.green}`,
        }
      },

      // 标签
      badge: {
        default: "rounded-full text-xs px-2 py-1",
        primary: `bg-white/20 text-white`,
        success: `bg-${colors.status.success.light} text-${colors.status.success.text}`,
        warning: `bg-${colors.status.warning.light} text-${colors.status.warning.text}`,
        error: `bg-${colors.status.error.light} text-${colors.status.error.text}`,
        glass: "bg-white/10 backdrop-blur-sm text-white",
      },
    },

    // 布局相关
    layout: {
      container: "container mx-auto px-4",
      spacing: {
        sm: "space-y-2",
        md: "space-y-4",
        lg: "space-y-6",
      },
      padding: {
        sm: "p-2",
        md: "p-4",
        lg: "p-6",
      },
    },

    // 文字样式
    typography: {
      title: {
        primary: `text-lg font-medium text-${colors.text.white}/90`,
        section: `text-lg font-medium text-${colors.text.primary}`,
      },
      body: {
        primary: `text-${colors.text.primary}`,
        secondary: `text-${colors.text.secondary}`,
        light: `text-${colors.text.white}/90`,
      },
    },

    // 动画效果
    animation: {
      hover: "transition-all duration-200",
      scale: "hover:scale-105 transition-transform",
      fade: "transition-opacity duration-200",
    },

    // 辅助函数
    utils: {
      card: (variant: 'default' | 'glass' | 'interactive') => {
        return theme.components.card[variant];
      },
      button: (variant: string) => {
        return theme.components.button[variant];
      },
      badge: (variant: string) => {
        return theme.components.badge[variant];
      },
    }
  };
};

// 导出默认主题
export const theme = createTheme('default'); 