import colors from 'tailwindcss/colors';
import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  safelist: [
    // 布局和定位
    {
      pattern: /(m|p|gap|space)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },
    {
      pattern: /(top|right|bottom|left|inset)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },

    // 宽度和高度
    {
      pattern: /(w|h|min-w|min-h|max-w|max-h)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|screen-dynamic|fit|min|max)/,
    },
    {
      pattern: /(w|h)-(1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12)/,
    },

    // from 渐变系列
    {
      pattern: /from-(.*)/,
    },
    {
      pattern: /to-(.*)/,
    },

    // Flexbox 和 Grid
    {
      pattern: /flex-(row|row-reverse|col|col-reverse|wrap|wrap-reverse|nowrap|1|auto|initial|none)/,
    },
    {
      pattern: /(justify|items|self|content)-(start|end|center|between|around|evenly|stretch|baseline|auto)/,
    },
    {
      pattern: /grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12|none)/,
    },
    {
      pattern: /col-span-(1|2|3|4|5|6|7|8|9|10|11|12|full)/,
    },

    // 颜色 - 所有主题色和透明度
    {
      pattern: /(text|bg|border|ring)-(default|warm|cool|forest)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    {
      pattern: /(text|bg|border|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    {
      pattern: /(text|bg|border|ring)-(white|black|transparent|current)/,
    },
    {
      pattern: /(text|bg|border|ring)-(primary|secondary|accent|muted|destructive|background|foreground|card|popover|input)/,
    },
    {
      pattern: /(text|bg|border|ring)-(primary|secondary|accent|muted|destructive|card|popover)-(foreground)/,
    },

    // 透明度
    {
      pattern: /(opacity|bg-opacity|text-opacity|border-opacity)-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)/,
    },

    // 边框和圆角
    {
      pattern: /border-(0|2|4|8)$/,
    },
    {
      pattern: /border-(t|r|b|l|x|y)-(0|2|4|8)$/,
    },
    {
      pattern: /rounded(-t|-r|-b|-l|-tl|-tr|-br|-bl)?-(none|sm|md|lg|xl|2xl|3xl|full)/,
    },

    // 阴影
    {
      pattern: /shadow-(sm|md|lg|xl|2xl|inner|none)/,
    },
    {
      pattern: /drop-shadow-(sm|md|lg|xl|2xl|none)/,
    },

    // 字体
    {
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
    },
    {
      pattern: /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/,
    },
    {
      pattern: /leading-(none|tight|snug|normal|relaxed|loose|3|4|5|6|7|8|9|10)/,
    },
    {
      pattern: /tracking-(tighter|tight|normal|wide|wider|widest)/,
    },
    {
      pattern: /text-(left|center|right|justify)/,
    },

    // 显示和定位
    'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'table', 'inline-table', 'table-row', 'table-cell', 'grid', 'inline-grid', 'contents', 'list-item', 'hidden',
    'static', 'fixed', 'absolute', 'relative', 'sticky',
    'visible', 'invisible', 'collapse',

    // Z-index
    {
      pattern: /z-(0|10|20|30|40|50|auto)/,
    },

    // 溢出
    'overflow-auto', 'overflow-hidden', 'overflow-visible', 'overflow-scroll', 'overflow-x-auto', 'overflow-x-hidden', 'overflow-x-visible', 'overflow-x-scroll', 'overflow-y-auto', 'overflow-y-hidden', 'overflow-y-visible', 'overflow-y-scroll',

    // 转换和动画
    {
      pattern: /transform|transition|duration-(75|100|150|200|300|500|700|1000)|ease-(linear|in|out|in-out)/,
    },
    {
      pattern: /scale-(0|50|75|90|95|100|105|110|125|150)/,
    },
    {
      pattern: /rotate-(0|1|2|3|6|12|45|90|180)/,
    },
    {
      pattern: /translate-(x|y)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },
    'animate-pulse', 'animate-spin', 'animate-ping', 'animate-bounce', 'animate-pulse-subtle', 'animate-marquee', 'animate-flow-light', 'animate-wave',

    // 自定义动画
    'animate-accordion-down', 'animate-accordion-up',

    // 鼠标状态
    'hover:opacity-80', 'hover:opacity-90', 'hover:opacity-100', 'hover:scale-105', 'hover:scale-110', 'hover:bg-opacity-80',
    'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2',
    'active:scale-95', 'active:scale-98',
    'disabled:opacity-50', 'disabled:cursor-not-allowed',

    // 响应式前缀
    {
      pattern: /(sm|md|lg|xl|2xl):(block|hidden|flex|grid|inline|text-left|text-center|text-right|w-full|w-auto|h-full|h-auto)/,
    },
    {
      pattern: /(sm|md|lg|xl|2xl):(m|p|gap)-(0|1|2|3|4|5|6|8|10|12|16|20|24)/,
    },

    // 光标
    'cursor-pointer', 'cursor-not-allowed', 'cursor-default', 'cursor-text', 'cursor-move', 'cursor-grab', 'cursor-grabbing',

    // 选择
    'select-none', 'select-text', 'select-all', 'select-auto',

    // 背景
    'bg-gradient-to-r', 'bg-gradient-to-l', 'bg-gradient-to-t', 'bg-gradient-to-b', 'bg-gradient-to-tr', 'bg-gradient-to-tl', 'bg-gradient-to-br', 'bg-gradient-to-bl',

    // 其他常用类
    'truncate', 'whitespace-nowrap', 'whitespace-pre', 'whitespace-pre-line', 'whitespace-pre-wrap',
    'break-words', 'break-all', 'break-normal',
    'resize-none', 'resize-y', 'resize-x', 'resize',
    'outline-none', 'outline-0', 'outline-2', 'outline-4', 'outline-8',

    // 表格
    'table-auto', 'table-fixed', 'border-collapse', 'border-separate',

    // 清除浮动
    'clear-left', 'clear-right', 'clear-both', 'clear-none',

    // 浮动
    'float-left', 'float-right', 'float-none',

    // 对象适合
    'object-contain', 'object-cover', 'object-fill', 'object-none', 'object-scale-down',
    'object-bottom', 'object-center', 'object-left', 'object-left-bottom', 'object-left-top', 'object-right', 'object-right-bottom', 'object-right-top', 'object-top',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // 确保所有主题用到的颜色都在这里定义
        default: colors.blue,
        warm: colors.orange,
        cool: colors.cyan,
        forest: colors.green,
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        flowLight: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-300% 0' },
          '50%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '300% 0' },
        },
        wave: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-subtle': {
          '0%, 100%': {
            opacity: 1,
          },
          '50%': {
            opacity: 0.8,
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: 'marquee 10s linear infinite',
        'flow-light': 'flowLight 2s linear infinite',
        'shimmer': 'shimmer 10s ease-in-out infinite',
        'wave': 'wave 3s linear infinite',
        'pulse-subtle': 'pulse-subtle 2s infinite',
      },
      // 智能视口高度工具类
      height: {
        'screen-dynamic': 'calc(var(--vh, 1vh) * 100)',
        'screen-stable': 'calc(var(--vh-stable, 1vh) * 100)',
      },
      minHeight: {
        'screen-dynamic': 'calc(var(--vh, 1vh) * 100)',
        'screen-stable': 'calc(var(--vh-stable, 1vh) * 100)',
      },
      maxHeight: {
        'screen-dynamic': 'calc(var(--vh, 1vh) * 100)',
        'screen-stable': 'calc(var(--vh-stable, 1vh) * 100)',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    typography,
  ],
} 