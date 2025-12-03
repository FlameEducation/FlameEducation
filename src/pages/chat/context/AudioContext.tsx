import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AudioService } from './AudioService';

export const AudioPlayStatusContext = createContext<{
  playingAudioId: string | null;
  isPlaying: boolean;
  audioType: "url" | "stream" | null;
  currentSeconds: number;
  totalSeconds: number;
  currentBlockNum: number;
  totalBlockNum: number;
  playAudio: (audioUrl: string, audioId: string) => void;
  playChunkAudio: (chunkNum: number, audioChunk: string, audioId: string, totalBlocks?: number) => void;
  playChannelAudio: (channelId: string, audioBase64: string, callbacks?: {
    onComplete?: () => void;
    onInterrupt?: () => void;
    onError?: (error: string) => void;
  }) => void;
  setTotalBlocks: (audioId: string, totalBlocks: number) => void;
  stop: () => void;
}>({
  playingAudioId: null,
  isPlaying: false,
  audioType: null,
  currentSeconds: 0,
  totalSeconds: 0,
  currentBlockNum: 0,
  totalBlockNum: 0,
  playAudio: () => { },
  playChunkAudio: () => { },
  setTotalBlocks: () => { },
  playChannelAudio: () => { },
  stop: () => { },
});

export const useAudioPlayStatus = () => useContext(AudioPlayStatusContext);

interface AudioPlayStatusProviderProps {
  children: React.ReactNode;
}

export const AudioPlayStatusProvider: React.FC<AudioPlayStatusProviderProps> = ({ children }) => {
  // 状态管理
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioType, setAudioType] = useState<"url" | "stream" | null>(null);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentBlockNum, setCurrentBlockNum] = useState(1);
  const [totalBlockNum, setTotalBlockNum] = useState(0);

  // 核心状态
  const audioServiceRef = useRef(new AudioService());
  const audioBlocks = useRef<Map<number, string>>(new Map());
  const audioDuration = useRef<Map<number, number>>(new Map());
  const currentAudioIdRef = useRef<string | null>(null);
  const totalAudioBlocksRef = useRef<number>(0);
  const currentPlayingBlockRef = useRef<number>(1);

  // 工具函数
  const convertToAudioURL = (base64Audio: string): string => {
    try {
      const byteString = atob(base64Audio.replace(/\s/g, ''));
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
    } catch (e) {
      console.error("Base64 to URL conversion failed:", e);
      return "";
    }
  };

  const estimateAudioDuration = (audioBase64: string): number => {
    try {
      const byteLength = atob(audioBase64.replace(/\s/g, '')).length;
      return Math.max(0.5, byteLength / 8000) * 2;
    } catch {
      return 2;
    }
  };

  // 🔑 简化的播放逻辑
  const playNextAvailableChunk = useCallback(() => {
    const nextBlock = currentPlayingBlockRef.current;
    const totalBlocks = totalAudioBlocksRef.current;
    const queueSize = audioBlocks.current.size;
    const isServicePlaying = audioServiceRef.current.isPlaying();


    // 检查是否已完成所有播放
    if (totalBlocks > 0 && nextBlock > totalBlocks) {
      stop();
      return;
    }

    // 检查是否有下一个块可播放
    if (!audioBlocks.current.has(nextBlock)) {
      return;
    }

    if (isServicePlaying) {
      return;
    }

    // 播放下一个块
    const audioBase64 = audioBlocks.current.get(nextBlock)!;
    audioBlocks.current.delete(nextBlock);
    const audioUrl = convertToAudioURL(audioBase64);

    if (!audioUrl) {
      console.error('❌ [错误] 音频URL转换失败');
      return;
    }

    audioServiceRef.current.play(
      audioUrl,
      () => {
        // 播放完成，准备下一个块
        currentPlayingBlockRef.current = nextBlock + 1;
        setCurrentBlockNum(currentPlayingBlockRef.current);

        // 🔑 关键检查：如果这是最后一个块，立即停止
        const newNextBlock = currentPlayingBlockRef.current;
        const totalBlocks = totalAudioBlocksRef.current;
        if (totalBlocks > 0 && newNextBlock > totalBlocks) {
          console.log('✅ [立即停止] 刚播放完最后一个块:', { newNextBlock, totalBlocks });
          stop();
          return;
        }

        // 重要：使用setTimeout确保状态更新后再递归
        setTimeout(() => {
          playNextAvailableChunk();
        }, 0);
      },
      (seek, duration) => {
        // 更新播放进度
        const previousDuration = Array.from(audioDuration.current.entries())
          .filter(([num]) => num < nextBlock)
          .reduce((acc, [, dur]) => acc + dur, 0);
        setCurrentSeconds(previousDuration + seek);
      }
    ).catch(error => {
      console.error('❌ [错误] 播放失败:', error);
      stop();
    });
  }, []);

  // API: 停止播放
  const stop = useCallback(() => {
    console.log('🛑 [停止] AudioContext停止播放');
    audioServiceRef.current.stop();
    setIsPlaying(false);
    setPlayingAudioId(null);
    setAudioType(null);
    setCurrentSeconds(0);
    setTotalSeconds(0);
    setCurrentBlockNum(1);
    setTotalBlockNum(0);

    // 重置所有引用状态
    currentAudioIdRef.current = null;
    currentPlayingBlockRef.current = 1;
    totalAudioBlocksRef.current = 0;
    audioBlocks.current.clear();
    audioDuration.current.clear();
  }, []);

  // API: 播放单个URL
  const playAudio = useCallback((audioUrl: string, audioId: string) => {
    console.log('🎵 [URL播放] 开始播放URL音频');
    stop();
    currentAudioIdRef.current = audioId;
    setPlayingAudioId(audioId);
    setAudioType("url");
    setIsPlaying(true);

    audioServiceRef.current.play(
      audioUrl,
      () => stop(),
      (seek, duration) => {
        setCurrentSeconds(seek);
        if (duration > 0) setTotalSeconds(duration);
      }
    ).catch(error => {
      console.error('AudioContext: URL播放失败:', error);
      stop();
    });
  }, [stop]);

  // API: 添加音频块并触发播放
  const playChunkAudio = useCallback((chunkNum: number, audioChunk: string, audioId: string, totalBlocks?: number) => {
    console.log(`🎵 [添加块] 块 ${chunkNum}`, {
      audioId: audioId.slice(-8),
      totalBlocks,
      currentTotal: totalAudioBlocksRef.current,
      isNewStream: currentAudioIdRef.current !== audioId
    });

    // 新音频流开始
    if (currentAudioIdRef.current !== audioId) {
      console.log('🔄 [新流] 开始新的音频流');
      stop();
      setPlayingAudioId(audioId);
      currentAudioIdRef.current = audioId;
      setAudioType("stream");
      setIsPlaying(true);
    }

    // 设置总块数（优先级最高，只设置一次）
    if (totalBlocks && totalBlocks > 0 && totalAudioBlocksRef.current === 0) {
      console.log(`📊 [设置总数] 设置总块数为 ${totalBlocks}`);
      totalAudioBlocksRef.current = totalBlocks;
      setTotalBlockNum(totalBlocks);
    }

    // 添加音频块到队列
    audioBlocks.current.set(chunkNum, audioChunk);
    audioDuration.current.set(chunkNum, estimateAudioDuration(audioChunk));

    // 更新总时长
    setTotalSeconds(Array.from(audioDuration.current.values()).reduce((acc, dur) => acc + dur, 0));

    console.log(`📦 [队列状态] 添加后队列大小: ${audioBlocks.current.size}，可用块: [${Array.from(audioBlocks.current.keys()).sort((a, b) => a - b).join(', ')}]`);

    // 尝试播放
    playNextAvailableChunk();
  }, [stop, playNextAvailableChunk]);

  // API: 播放频道音频
  const playChannelAudio = useCallback((channelId: string, audioBase64: string, callbacks?: {
    onComplete?: () => void;
    onInterrupt?: () => void;
    onError?: (error: string) => void;
  }) => {
    console.log(`🎵 [频道播放] 频道 ${channelId} 收到新音频`, {
      audioId: channelId.slice(-8),
      newBase64Length: audioBase64.length,
      currentAudioId: currentAudioIdRef.current,
      isPlaying: audioServiceRef.current.isPlaying()
    });

    // 如果是同一个频道ID，检查base64是否一致
    if (currentAudioIdRef.current === channelId) {
      // 获取当前正在播放的音频base64信息
      const currentBase64 = audioServiceRef.current.getCurrentAudioBase64();
      
      if (currentBase64 && currentBase64 !== audioBase64) {
        console.log(`🔄 [频道切换] 检测到同一频道的新音频，停止当前播放`, {
          currentBase64Length: currentBase64.length,
          newBase64Length: audioBase64.length,
          channelId: channelId.slice(-8)
        });
        
        // 触发中断回调
        callbacks?.onInterrupt?.();
        
        // 立即停止当前播放
        stop();
        
        // 短暂延迟后播放新音频，确保状态清理完成
        setTimeout(() => {
          const audioUrl = convertToAudioURL(audioBase64);
          if (audioUrl) {
            currentAudioIdRef.current = channelId;
            setPlayingAudioId(channelId);
            setAudioType("url");
            setIsPlaying(true);
            
            // 设置新的base64信息
            audioServiceRef.current.setCurrentAudioBase64(audioBase64);
            
            audioServiceRef.current.play(
              audioUrl,
              () => {
                stop();
                callbacks?.onComplete?.();
              },
              (seek, duration) => {
                setCurrentSeconds(seek);
                if (duration > 0) setTotalSeconds(duration);
              }
            ).catch(error => {
              console.error('AudioContext: 频道音频播放失败:', error);
              stop();
              callbacks?.onError?.(error instanceof Error ? error.message : '未知错误');
            });
          }
        }, 100);
        return;
      } else if (currentBase64 === audioBase64) {
        console.log(`✅ [频道检查] 同一频道的音频内容一致，继续播放`);
        return;
      }
    }

    // 新频道或首次播放，直接播放
    console.log(`🎬 [新频道] 开始播放频道音频: ${channelId.slice(-8)}`);
    stop();
    
    const audioUrl = convertToAudioURL(audioBase64);
    if (audioUrl) {
      currentAudioIdRef.current = channelId;
      setPlayingAudioId(channelId);
      setAudioType("url");
      setIsPlaying(true);
      
      // 设置新的base64信息
      audioServiceRef.current.setCurrentAudioBase64(audioBase64);
      
      audioServiceRef.current.play(
        audioUrl,
        () => {
          stop();
          callbacks?.onComplete?.();
        },
        (seek, duration) => {
          setCurrentSeconds(seek);
          if (duration > 0) setTotalSeconds(duration);
        }
      ).catch(error => {
        console.error('AudioContext: 频道音频播放失败:', error);
        stop();
        callbacks?.onError?.(error instanceof Error ? error.message : '未知错误');
      });
    } else {
      console.error('❌ [错误] 频道音频URL转换失败');
      callbacks?.onError?.('音频URL转换失败');
    }
  }, [stop, convertToAudioURL]);

  // API: 直接设置总块数
  const setTotalBlocks = useCallback((audioId: string, totalBlocks: number) => {
    if (currentAudioIdRef.current === audioId && totalBlocks > 0) {
      totalAudioBlocksRef.current = totalBlocks;
      setTotalBlockNum(totalBlocks);

      // 设置总块数后，检查是否应该停止
      setTimeout(() => {
        playNextAvailableChunk();
      }, 0);
    }
  }, [playNextAvailableChunk]);

  return (
    <AudioPlayStatusContext.Provider value={{
      playingAudioId,
      isPlaying,
      audioType,
      currentSeconds,
      totalSeconds,
      currentBlockNum,
      totalBlockNum,
      playAudio,
      playChunkAudio,
      setTotalBlocks,
      playChannelAudio,
      stop,
    }}>
      {children}
    </AudioPlayStatusContext.Provider>
  );
};