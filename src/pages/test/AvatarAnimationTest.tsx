import React from 'react';
import { motion } from 'framer-motion';

// 模拟头像组件，只关注动画容器
const AvatarPlaceholder = ({ children, title }: { children: React.ReactNode, title: string }) => (
  <div className="flex flex-col items-center gap-4 p-8 border rounded-xl shadow-sm overflow-hidden relative bg-white border-gray-200">
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* 动画层 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {children}
      </div>
      
      {/* 头像本体 */}
      <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md">
        <img 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
          alt="Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
    <h3 className="font-medium z-10 text-gray-700">{title}</h3>
  </div>
);

// --- 简约风格动画 ---

// 7. 简约波纹 (Simple Ripple)
// 单线条灰色波纹，极简风格
const SimpleRipple = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div
      className="absolute inset-0 rounded-full border border-gray-300"
      initial={{ scale: 1, opacity: 0.8 }}
      animate={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
  </div>
);

// 8. 呼吸圆环 (Breathing Ring)
// 紧贴头像的圆环，透明度呼吸
const BreathingRing = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div
      className="absolute w-22 h-22 rounded-full border-2 border-blue-400/50"
      animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.98, 1.02, 0.98] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

// 9. 轨道小点 (Orbiting Dot)
// 一个小灰点绕着头像转
const OrbitingDot = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div
      className="absolute w-28 h-28 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full" />
    </motion.div>
  </div>
);

// 10. 简约声波 (Minimalist Sound Wave)
// 左右两边各两根短线条跳动
const MinimalistSoundWave = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* 左侧 */}
    <motion.div
      className="absolute left-2 h-4 w-1 bg-gray-400 rounded-full"
      animate={{ height: [10, 20, 10] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
    />
    <motion.div
      className="absolute left-5 h-6 w-1 bg-gray-400 rounded-full"
      animate={{ height: [15, 30, 15] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
    />
    
    {/* 右侧 */}
    <motion.div
      className="absolute right-5 h-6 w-1 bg-gray-400 rounded-full"
      animate={{ height: [15, 30, 15] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
    />
    <motion.div
      className="absolute right-2 h-4 w-1 bg-gray-400 rounded-full"
      animate={{ height: [10, 20, 10] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
    />
  </div>
);

// 1. Siri 风格 - 智能混沌 (Siri Chaos)
// 使用多层模糊光晕叠加，模拟流体般的色彩融合
const SiriChaos = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* 核心光晕 */}
    <motion.div
      className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 blur-xl opacity-60 mix-blend-screen"
      animate={{
        scale: [1, 1.2, 0.9, 1.1, 1],
        rotate: [0, 90, 180, 270, 360],
        borderRadius: ["50%", "40% 60% 70% 30% / 40% 50% 60% 50%", "50%", "60% 40% 30% 70% / 60% 30% 70% 40%", "50%"]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    {/* 辅助光晕 1 */}
    <motion.div
      className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-pink-500 via-red-400 to-yellow-400 blur-2xl opacity-40 mix-blend-screen"
      animate={{
        scale: [1.1, 0.9, 1.2, 1],
        x: [-10, 10, -5, 0],
        y: [5, -10, 5, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    {/* 辅助光晕 2 */}
    <motion.div
      className="absolute w-32 h-32 rounded-full bg-gradient-to-bl from-blue-400 via-teal-300 to-green-400 blur-2xl opacity-40 mix-blend-screen"
      animate={{
        scale: [0.9, 1.1, 0.95, 1],
        x: [10, -5, 8, 0],
        y: [-5, 8, -10, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    {/* 粒子闪烁 */}
    <motion.div
      className="absolute inset-0 rounded-full border border-white/20"
      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </div>
);

// 2. 量子纠缠 (Quantum Entanglement)
// 快速旋转的原子轨道风格，带有拖尾效果
const QuantumEntanglement = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {[0, 60, 120].map((deg, i) => (
      <motion.div
        key={i}
        className="absolute w-40 h-10 rounded-[100%] border-[1px] border-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
        style={{ rotate: deg }}
        animate={{
          rotate: [deg, deg + 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 3 + i, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <motion.div 
          className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#fff]"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>
    ))}
    <motion.div
      className="absolute w-24 h-24 rounded-full bg-cyan-500/10 blur-md"
      animate={{ scale: [0.8, 1.2, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </div>
);

// 3. 神经突触 (Neural Synapse)
// 模拟神经网络连接，点线连接与脉冲
const NeuralSynapse = () => {
  const nodes = 8;
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 中心脉冲 */}
      <motion.div
        className="absolute w-20 h-20 rounded-full bg-indigo-500/20 blur-sm"
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* 环绕节点 */}
      {Array.from({ length: nodes }).map((_, i) => {
        const angle = (i * 360) / nodes;
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-16 origin-bottom"
            style={{ 
              rotate: angle,
              bottom: '50%',
              left: '50%',
              transformOrigin: 'bottom center'
            }}
          >
            <motion.div
              className="absolute top-0 -left-1 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_5px_rgba(129,140,248,0.8)]"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                repeat: Infinity
              }}
            />
            <motion.div
              className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-indigo-400/80 to-transparent"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
            />
          </motion.div>
        );
      })}
      
      {/* 外圈连接线 */}
      <svg className="absolute w-40 h-40 animate-spin-slow" style={{ animationDuration: '10s' }}>
        <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    </div>
  );
};

// 4. 赛博故障 (Cyber Glitch)
// 带有故障艺术风格的抖动和色彩分离
const CyberGlitch = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* 红色偏移层 */}
    <motion.div
      className="absolute w-22 h-22 rounded-full border-2 border-red-500/60 opacity-70"
      animate={{
        x: [-2, 2, -1, 3, 0],
        y: [1, -2, 0, 2, -1],
        scale: [1, 1.05, 0.98, 1.02, 1],
        opacity: [0.5, 0.8, 0.4, 0.7, 0.5]
      }}
      transition={{
        duration: 0.2,
        repeat: Infinity,
        repeatType: "mirror",
        repeatDelay: 0.5
      }}
    />
    {/* 蓝色偏移层 */}
    <motion.div
      className="absolute w-22 h-22 rounded-full border-2 border-blue-500/60 opacity-70"
      animate={{
        x: [2, -2, 1, -3, 0],
        y: [-1, 2, 0, -2, 1],
        scale: [1, 0.95, 1.02, 0.98, 1],
        opacity: [0.5, 0.8, 0.4, 0.7, 0.5]
      }}
      transition={{
        duration: 0.25,
        repeat: Infinity,
        repeatType: "mirror",
        repeatDelay: 0.3
      }}
    />
    {/* 扫描线 */}
    <motion.div
      className="absolute w-32 h-32 rounded-full overflow-hidden opacity-30"
      style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 3px)' }}
    />
    {/* 随机出现的方块 */}
    <motion.div
      className="absolute top-0 right-0 w-4 h-4 bg-yellow-400/80"
      animate={{ opacity: [0, 1, 0], x: [0, 10, -5], y: [0, 5, -10] }}
      transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 2 }}
    />
  </div>
);

// 5. 魔法符文 (Magic Rune)
// 旋转的魔法阵列，带有神秘感
const MagicRune = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* 内圈符文 */}
    <motion.div
      className="absolute w-28 h-28 rounded-full border border-amber-300/40 flex items-center justify-center"
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-20 h-20 border border-amber-300/60 rotate-45" />
    </motion.div>
    
    {/* 外圈光辉 */}
    <motion.div
      className="absolute w-32 h-32 rounded-full border-2 border-dashed border-amber-200/30"
      animate={{ rotate: -360 }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    />
    
    {/* 能量聚集 */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-radial from-amber-200/20 to-transparent blur-md"
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* 粒子上升 */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-amber-100 rounded-full shadow-[0_0_4px_#fbbf24]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: -40, opacity: [0, 1, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.5,
          ease: "easeOut"
        }}
        style={{ left: `${50 + (Math.random() * 40 - 20)}%` }}
      />
    ))}
  </div>
);

// 6. 液态金属 (Liquid Metal)
// 模拟液态金属流动的质感
const LiquidMetal = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg className="absolute w-40 h-40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#e0e7ff', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
        </filter>
      </defs>
      <g filter="url(#goo)">
        <motion.circle 
          cx="100" cy="100" r="45" fill="url(#grad1)" opacity="0.6"
          animate={{ r: [45, 50, 45] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {[0, 90, 180, 270].map((deg, i) => (
          <motion.circle
            key={i}
            cx="100" cy="100" r="20" fill="#818cf8"
            animate={{
              cx: [100, 100 + Math.cos(deg * Math.PI / 180) * 30, 100],
              cy: [100, 100 + Math.sin(deg * Math.PI / 180) * 30, 100],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </g>
    </svg>
  </div>
);

export default function AvatarAnimationTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Advanced Avatar Animations</h1>
      <p className="text-gray-500 text-center mb-12">High-fidelity, complex animation styles for AI interaction</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
        <AvatarPlaceholder title="1. Siri Chaos (智能混沌)">
          <SiriChaos />
        </AvatarPlaceholder>

        <AvatarPlaceholder title="2. Quantum Entanglement (量子纠缠)">
          <QuantumEntanglement />
        </AvatarPlaceholder>

        <AvatarPlaceholder title="3. Neural Synapse (神经突触)">
          <NeuralSynapse />
        </AvatarPlaceholder>

        <AvatarPlaceholder title="4. Cyber Glitch (赛博故障)">
          <CyberGlitch />
        </AvatarPlaceholder>

        <AvatarPlaceholder title="5. Magic Rune (魔法符文)">
          <MagicRune />
        </AvatarPlaceholder>

        <AvatarPlaceholder title="6. Liquid Metal (液态金属)">
          <LiquidMetal />
        </AvatarPlaceholder>

        <div className="col-span-full mt-8 mb-4 border-t pt-8">
          <h2 className="text-xl font-bold text-gray-800 text-center">Minimalist Styles (简约风格)</h2>
        </div>

        <AvatarPlaceholder title="7. Simple Ripple (简约波纹)">
          <SimpleRipple />
        </AvatarPlaceholder>

        <AvatarPlaceholder title="8. Breathing Ring (呼吸圆环)">
          <BreathingRing />
        </AvatarPlaceholder>

        <AvatarPlaceholder title="9. Orbiting Dot (轨道小点)">
          <OrbitingDot />
        </AvatarPlaceholder>

        <AvatarPlaceholder title="10. Minimalist Sound Wave (简约声波)">
          <MinimalistSoundWave />
        </AvatarPlaceholder>
      </div>
    </div>
  );
}

