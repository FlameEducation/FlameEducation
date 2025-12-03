import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface VideoTeacherProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'thinking' | 'teaching' | 'listening';
  speaking?: boolean;
  teacherUuid?: string;
  className?: string;
}

// 教师视频配置
const teacherVideos = {
  'teacher-1': {
    name: '李老师',
    idleVideo: '/assets/videos/teacher-1-idle.mp4', // 待机循环视频
    speakingVideo: '/assets/videos/teacher-1-speaking.mp4', // 说话循环视频
    thinkingVideo: '/assets/videos/teacher-1-thinking.mp4', // 思考循环视频
    avatar: '/assets/teachers/teacher-1.jpg', // 静态头像备用
  },
  'teacher-2': {
    name: '张老师',
    idleVideo: '/assets/videos/teacher-2-idle.mp4',
    speakingVideo: '/assets/videos/teacher-2-speaking.mp4',
    thinkingVideo: '/assets/videos/teacher-2-thinking.mp4',
    avatar: '/assets/teachers/teacher-2.jpg',
  },
};

const VideoTeacher: React.FC<VideoTeacherProps> = ({
  size = 'md',
  mood = 'happy',
  speaking = false,
  teacherUuid = 'teacher-1',
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentVideo, setCurrentVideo] = useState('');

  const teacher = teacherVideos[teacherUuid] || teacherVideos['teacher-1'];

  // 尺寸映射
  const sizeMap = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96'
  };

  // 根据状态选择视频
  useEffect(() => {
    let targetVideo = teacher.idleVideo;
    
    if (speaking) {
      targetVideo = teacher.speakingVideo;
    } else if (mood === 'thinking') {
      targetVideo = teacher.thinkingVideo;
    }

    if (targetVideo !== currentVideo) {
      setCurrentVideo(targetVideo);
      setIsLoading(true);
    }
  }, [speaking, mood, teacher, currentVideo]);

  // 视频加载和播放控制
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      video.play().catch(err => {
        console.error('视频播放失败:', err);
        setHasError(true);
      });
    };

    const handleError = () => {
      console.error('视频加载失败');
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [currentVideo]);

  // 切换静音状态
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gray-100 shadow-xl",
        sizeMap[size],
        className
      )}
      animate={{
        scale: speaking ? [1, 1.02, 1] : 1,
      }}
      transition={{
        repeat: speaking ? Infinity : 0,
        duration: 2,
        ease: "easeInOut"
      }}
    >
      {/* 背景光晕 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: speaking ? [0.3, 0.6, 0.3] : 0.3,
        }}
        transition={{
          repeat: speaking ? Infinity : 0,
          duration: 2,
          ease: "easeInOut"
        }}
      >
        <div className={cn(
          "w-full h-full blur-2xl",
          mood === 'happy' && "bg-gradient-to-r from-green-200 to-blue-200",
          mood === 'thinking' && "bg-gradient-to-r from-yellow-200 to-orange-200",
          mood === 'teaching' && "bg-gradient-to-r from-blue-200 to-purple-200",
          mood === 'listening' && "bg-gradient-to-r from-purple-200 to-pink-200"
        )} />
      </motion.div>

      {/* 视频容器 */}
      <div className="relative w-full h-full">
        {/* 加载状态 */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 视频元素 */}
        {!hasError ? (
          <video
            ref={videoRef}
            src={currentVideo}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            autoPlay
          />
        ) : (
          // 错误时显示静态图片
          <img
            src={teacher.avatar}
            alt={teacher.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* 音量控制按钮 - 仅在视频加载成功时显示 */}
        {!hasError && !isLoading && size !== 'sm' && (
          <button
            onClick={toggleMute}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 backdrop-blur-sm
                     hover:bg-black/30 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>
        )}

        {/* 状态指示器 */}
        <div className="absolute bottom-2 right-2">
          <motion.div
            className={cn(
              "w-3 h-3 rounded-full shadow-md",
              mood === 'happy' && "bg-green-400",
              mood === 'thinking' && "bg-yellow-400",
              mood === 'teaching' && "bg-blue-400",
              mood === 'listening' && "bg-purple-400"
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* 教师信息 - 大尺寸时显示 */}
        {size === 'lg' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm
                     rounded-lg px-3 py-2 shadow-md"
          >
            <p className="text-sm font-medium">{teacher.name}</p>
            <p className="text-xs text-gray-500">专业Python教师</p>
          </motion.div>
        )}
      </div>

      {/* 语音波纹效果 */}
      <AnimatePresence>
        {speaking && (
          <>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="absolute inset-0 rounded-2xl border-2 border-primary/30 pointer-events-none"
                initial={{ scale: 1, opacity: 0 }}
                animate={{
                  scale: [1, 1.1, 1.2],
                  opacity: [0.5, 0.3, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: index * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoTeacher;