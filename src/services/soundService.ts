// src/services/soundService.ts
import { Howl } from 'howler';

/**
 * 音效类型定义
 * @public
 */
export type SoundEffect = 'reward-click' | 'diamond-appear' | 'diamond-collect' | 'celebration';

// 音效配置文件
const SOUND_EFFECTS: Record<SoundEffect, string> = {
  'reward-click': '/audio/reward-click.mp3',
  'diamond-appear': '/audio/diamond-appear.mp3', 
  'diamond-collect': '/audio/diamond-collect.mp3',
  'celebration': '/audio/celebration.mp3'
};

/**
 * 一个全局单例的音效服务，负责所有游戏音效的预加载和播放。
 * 采用高性能的预加载模式，确保所有音效零延迟播放。
 */
class SoundService {
  private preloadedSounds: Map<SoundEffect, Howl> = new Map();
  private isInitialized = false;

  /**
   * 初始化服务，预加载所有音效文件。
   * 这个方法应该在应用启动时（如 App.tsx）调用一次。
   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    const loadPromises: Promise<void>[] = [];
    
    for (const [effectName, effectPath] of Object.entries(SOUND_EFFECTS)) {
      const loadPromise = new Promise<void>((resolve, reject) => {
        const sound = new Howl({
          src: [effectPath],
          preload: true,
          html5: false, // 强制使用Web Audio API以获得更精确的控制和性能
          volume: 0.7,
          onload: () => {
            this.preloadedSounds.set(effectName as SoundEffect, sound);
            resolve();
          },
          onloaderror: (id, error) => {
            const errorMsg = `音效加载失败: ${effectName} - ${error}`;
            reject(new Error(errorMsg));
          }
        });
      });
      loadPromises.push(loadPromise);
    }
    
    try {
      await Promise.all(loadPromises);
      this.isInitialized = true;
    } catch (error) {
      // 静默处理初始化错误
    }
  }

  /**
   * 播放一个已预加载的音效。
   * @param {SoundEffect} effect - 要播放的音效名称。
   */
  public play(effect: SoundEffect): void {
    const sound = this.preloadedSounds.get(effect);
    if (!sound) {
      return;
    }

    try {
      sound.play();
    } catch (error) {
      // 静默处理播放错误
    }
  }

  /**
   * 清理所有音效资源，在应用退出时调用。
   */
  public destroy(): void {
    for (const sound of this.preloadedSounds.values()) {
      sound.unload();
    }
    this.preloadedSounds.clear();
    this.isInitialized = false;
  }
}

/**
 * GameSoundService 的全局单例实例。
 * 在你的组件中直接导入并使用它。
 *
 * @example
 * import { GameSoundService } from '@/services/soundService';
 *
 * GameSoundService.play('reward-click');
 */
export const GameSoundService = new SoundService(); 