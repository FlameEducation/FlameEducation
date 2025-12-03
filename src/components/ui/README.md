# DevLocked 组件使用说明

## 概述
`DevLocked` 是一个通用的开发中锁定包装组件，可以为任何组件添加"开发中"状态，显示锁头图标、灰色蒙层和提示文字。

## 功能特点
- 🔒 自动添加锁头图标和灰色蒙层
- 💬 可自定义提示文字
- 🎨 优雅的毛玻璃效果和动画
- 🚫 自动禁用所有用户交互
- 📱 完全响应式设计
- 🔧 智能自适应尺寸 - 根据目标组件大小自动调整图标和文字

## 基本用法

### 1. 导入组件
```tsx
import DevLocked from '@/components/ui/dev-locked';
```

### 2. 包装需要锁定的组件
```tsx
// 基本用法 - 使用默认提示文字
<DevLocked>
  <YourComponent />
</DevLocked>

// 自定义提示文字
<DevLocked message="该功能即将上线">
  <YourComponent />
</DevLocked>

// 禁用动画
<DevLocked message="维护中" showAnimation={false}>
  <YourComponent />
</DevLocked>

// 添加自定义样式类
<DevLocked className="my-custom-class" message="开发中">
  <YourComponent />
</DevLocked>
```

## Props 参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `children` | `React.ReactNode` | - | 要包装的子组件（必需） |
| `message` | `string` | `"当前功能开发中，敬请期待"` | 显示的提示文字 |
| `className` | `string` | `""` | 额外的CSS类名 |
| `showAnimation` | `boolean` | `true` | 是否显示脉冲动画效果 |

## 使用示例

### 示例1：锁定整个页面区块
```tsx
<DevLocked message="用户中心开发中">
  <UserProfile />
</DevLocked>
```

### 示例2：锁定卡片组件
```tsx
<DevLocked message="高级功能即将推出">
  <PremiumFeatureCard />
</DevLocked>
```

### 示例3：条件锁定
```tsx
{isFeatureReady ? (
  <AdvancedComponent />
) : (
  <DevLocked message="功能升级中，请稍候">
    <AdvancedComponent />
  </DevLocked>
)}
```

### 示例4：批量锁定（在主页中）
```tsx
const HomePage = () => {
  return (
    <div>
      <ActiveComponent />
      
      <DevLocked message="每日任务功能开发中">
        <DailyTasks />
      </DevLocked>
      
      <DevLocked message="学习社区即将上线">
        <LearningCommunity />
      </DevLocked>
    </div>
  );
};
```

## 视觉效果
- ✅ 被锁定的组件会变成灰色（grayscale）
- ✅ 添加半透明的灰色遮罩层
- ✅ 中央显示白色圆形背景的锁头图标
- ✅ 锁头下方显示带毛玻璃效果的提示文字
- ✅ 可选的脉冲动画效果
- ✅ 完全禁用用户交互（点击、悬停等）
- ✅ 智能尺寸适配：
  - 超小组件（< 80px）：只显示小图标
  - 小组件（80px - 120px）：小图标 + 紧凑文字
  - 中等组件（120px - 200px）：标准图标 + 文字
  - 大组件（> 200px）：完整尺寸显示

## 注意事项
1. 被锁定的组件会完全禁用用户交互
2. 组件会自动添加 `position: relative` 样式
3. 请确保父容器有足够空间显示锁定状态
4. 建议在开发阶段使用，生产环境中建议隐藏未完成的功能

## CSS 类名
如果你只需要CSS类而不想使用React组件，可以直接使用：
```html
<div class="dev-locked">
  <!-- 你的内容 -->
</div>
``` 