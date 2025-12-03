import { Howl } from 'howler';

/**
 * 一个无状态的、一次性的音频播放服务，完全听从外部指令。
 * 它不维护任何播放列表或流式状态。
 */
export class AudioService {
  private currentSound: Howl | null = null;
  private currentAudioBase64: string | null = null;

  /**
   * 获取当前播放音频的base64信息
   */
  public getCurrentAudioBase64(): string | null {
    return this.currentAudioBase64;
  }

  /**
   * 设置当前播放音频的base64信息
   */
  public setCurrentAudioBase64(base64: string): void {
    this.currentAudioBase64 = base64;
  }

  /**
   * 检查是否为远程音频URL
   */
  private isRemoteUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  /**
   * 将远程音频URL转换为Blob URL
   */
  private async fetchAndConvertToBlob(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorMsg = `获取远程音频失败: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    } catch (error) {
      const errorMsg = `获取远程音频出错: ${error instanceof Error ? error.message : '未知错误'}`;
      throw error;
    }
  }

  /**
   * 播放单个音频片段。
   * @param url - 要播放的音频URL (支持本地URL、data:audio格式的Base64、远程http/https URL)。
   * @param onEnd - 播放结束时的回调。
   * @param onProgress - 播放进度更新时的回调。
   */
  public async play(
    url: string,
    onEnd: () => void,
    onProgress: (seek: number, duration: number) => void
  ): Promise<void> {
    // 停止并清理任何可能存在的旧音频实例
    this.stop();

    try {
      // 对于远程音频，先转换为Blob URL
      let audioUrl = url;
      if (this.isRemoteUrl(url)) {
        audioUrl = await this.fetchAndConvertToBlob(url);
      }

      this.currentSound = new Howl({
        src: [audioUrl],
        html5: false,
        format: ['mp3', 'wav', 'ogg'], // 支持多种格式
        onend: () => {
          // 如果是Blob URL，清理内存
          if (this.isRemoteUrl(url) && audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
          }
          onEnd();
          // this.currentSound = null; // 播放结束，实例使命完成
        },
        onload: () => {
          // 加载完成后立即触发一次进度，以获得总时长
          onProgress(0, this.currentSound?.duration() || 0);
        },
        onplayerror: (id, error) => {
          // 如果是Blob URL，清理内存
          if (this.isRemoteUrl(url) && audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
          }
        },
        onloaderror: (id, error) => {
          // 如果是Blob URL，清理内存
          if (this.isRemoteUrl(url) && audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
          }
        }
      });

      // 使用 requestAnimationFrame 来平滑地报告播放进度
      const progressLoop = () => {
        if (this.currentSound?.playing()) {
          const seek = this.currentSound.seek() || 0;
          const duration = this.currentSound.duration() || 0;
          onProgress(seek, duration);
          requestAnimationFrame(progressLoop);
        }
      };
      
      this.currentSound.on('play', () => {
          requestAnimationFrame(progressLoop);
      });

      this.currentSound.play();
    } catch (error) {
      const errorMsg = `音频播放失败: ${error instanceof Error ? error.message : '未知错误'}`;
      throw error;
    }
  }

  /**
   * 检查当前是否有任何音频正在播放。
   */
  public isPlaying(): boolean {
    return this.currentSound?.playing() || false;
  }

  /**
   * 停止并卸载当前所有音频，释放内存。
   */
  public stop(): void {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.unload();
      this.currentSound = null;
    }
    // 清理base64信息
    this.currentAudioBase64 = null;
  }
} 