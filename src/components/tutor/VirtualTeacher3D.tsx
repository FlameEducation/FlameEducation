import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, useAnimations } from '@react-three/drei';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VirtualTeacher3DProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'happy' | 'thinking' | 'teaching' | 'listening';
  speaking?: boolean;
  modelUrl?: string;
  className?: string;
}

// 3D模型组件
const TeacherModel: React.FC<{
  modelUrl: string;
  speaking: boolean;
  mood: string;
}> = ({ modelUrl, speaking, mood }) => {
  const group = useRef();
  const { scene, animations } = useGLTF(modelUrl);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // 根据状态播放不同动画
    if (speaking && actions.talking) {
      actions.talking.play();
    } else if (actions.idle) {
      actions.idle.play();
    }

    return () => {
      Object.values(actions).forEach(action => action?.stop());
    };
  }, [actions, speaking]);

  // 添加简单的动画效果
  useFrame((state) => {
    if (group.current) {
      // 轻微的上下浮动
      group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
      
      // 说话时的头部微动
      if (speaking) {
        group.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      }
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={1} />
    </group>
  );
};

// 加载状态组件
const LoadingFallback: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm text-gray-500">加载中...</p>
    </div>
  </div>
);

const VirtualTeacher3D: React.FC<VirtualTeacher3DProps> = ({
  size = 'md',
  mood = 'happy',
  speaking = false,
  modelUrl = '/assets/models/teacher.glb', // 需要添加3D模型文件
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 尺寸映射
  const sizeMap = {
    sm: { width: 128, height: 128, className: 'w-32 h-32' },
    md: { width: 256, height: 256, className: 'w-64 h-64' },
    lg: { width: 512, height: 512, className: 'w-[512px] h-[512px]' }
  };

  const currentSize = sizeMap[size];

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-b from-blue-50 to-blue-100",
        currentSize.className,
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
      {/* 3D场景 */}
      <Canvas
        camera={{ 
          position: [0, 0, 5], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* 环境光照 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* 3D模型 */}
        <Suspense fallback={null}>
          <TeacherModel 
            modelUrl={modelUrl}
            speaking={speaking}
            mood={mood}
          />
        </Suspense>

        {/* 相机控制 - 仅在非移动端启用 */}
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>

      {/* 状态指示器 */}
      <div className="absolute bottom-2 right-2">
        <motion.div
          className={cn(
            "w-3 h-3 rounded-full",
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

      {/* 语音波纹效果 */}
      {speaking && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.3, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: index * 0.3,
              }}
            >
              <div className="w-full h-full bg-gradient-to-t from-white/30 to-transparent rounded-lg" />
            </motion.div>
          ))}
        </div>
      )}

      {/* 加载失败的备用内容 */}
      {!modelUrl && <LoadingFallback />}
    </motion.div>
  );
};

export default VirtualTeacher3D;