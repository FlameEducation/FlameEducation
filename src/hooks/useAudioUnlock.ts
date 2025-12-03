// src/hooks/useAudioUnlock.ts
import { useEffect, useRef } from 'react';
import { Howler } from 'howler';

/**
 * 一个全局的、一次性的React Hook，用于解锁Web Audio API在移动端浏览器（特别是Safari）上的限制。
 * 按照W3C标准，AudioContext必须在用户手势（如点击）后才能从'suspended'状态激活。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume
 * @see https://github.com/goldfire/howler.js#mobile-playback
 */
export const useAudioUnlock = () => {
  const unlocked = useRef(false);

  useEffect(() => {
    const unlock = () => {
      // 检查音频上下文是否需要解锁，并且只执行一次
      if (!unlocked.current && Howler.ctx && Howler.ctx.state === 'suspended') {
        
        Howler.ctx.resume().then(() => {
          unlocked.current = true;
          
          // 成功解锁后，立即移除所有监听器，确保这个操作只执行一次
          document.removeEventListener('click', unlock, true);
          document.removeEventListener('touchend', unlock, true);
          document.removeEventListener('keydown', unlock, true);

        }).catch((e) => {
          console.error('Failed to unlock Web Audio Context:', e);
        });

      } else {
        // 如果已解锁或无需解锁，也移除监听器
        document.removeEventListener('click', unlock, true);
        document.removeEventListener('touchend', unlock, true);
        document.removeEventListener('keydown', unlock, true);
      }
    };

    // 使用捕获阶段(true)来确保我们的监听器在其他可能阻止冒泡的监听器之前运行
    document.addEventListener('click', unlock, true);
    document.addEventListener('touchend', unlock, true);
    document.addEventListener('keydown', unlock, true);

    return () => {
      // 清理函数，以防组件在解锁前卸载
      document.removeEventListener('click', unlock, true);
      document.removeEventListener('touchend', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
  }, []); // 空依赖数组确保这个effect只在组件挂载时运行一次
}; 