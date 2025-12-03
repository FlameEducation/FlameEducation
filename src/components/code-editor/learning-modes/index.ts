// 导出类型定义
export * from './types.tsx';

// 导出基类
export * from './BaseModeManager';

// 导出具体实现类
export * from './FillModeManager';
export * from './FollowModeManager';
export * from './FixModeManager';
export * from './FreeModeManager';

// 模式管理器工厂函数
import { FillModeManager } from './FillModeManager';
import { FollowModeManager } from './FollowModeManager';
import { FixModeManager } from './FixModeManager';
import { FreeModeManager } from './FreeModeManager';
import { LearningMode, ModeManager, ModeManagerOptions } from './types.tsx';

/**
 * 创建模式管理器实例
 * @param mode 学习模式
 * @param options 管理器选项
 * @returns 模式管理器实例
 */
export function createModeManager(mode: LearningMode, options: ModeManagerOptions): ModeManager {
  switch (mode) {
    case 'fill':
      return new FillModeManager(options);
    case 'follow':
      return new FollowModeManager(options);
    case 'fix':
      return new FixModeManager(options);
    case 'free':
      return new FreeModeManager(options);
    default:
      console.warn(`未知模式 "${mode}"，使用填空模式作为默认`);
      return new FillModeManager(options);
  }
} 