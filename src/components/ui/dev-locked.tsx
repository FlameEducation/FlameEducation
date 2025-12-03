import React, { useRef, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

interface DevLockedProps {
  children: React.ReactNode;
  message?: string;
  className?: string;
  showAnimation?: boolean;
}

interface SizeConfig {
  iconSize: number;
  iconContainerSize: number;
  textSize: string;
  spacing: number;
  showText: boolean;
}

const DevLocked: React.FC<DevLockedProps> = ({ 
  children, 
  message = "当前功能开发中，敬请期待", 
  className = "",
  showAnimation = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizeConfig, setSizeConfig] = useState<SizeConfig>({
    iconSize: 24,
    iconContainerSize: 48,
    textSize: 'text-sm',
    spacing: 8,
    showText: true
  });

  useEffect(() => {
    const updateSizeConfig = () => {
      if (!containerRef.current) return;

      const { width, height } = containerRef.current.getBoundingClientRect();
      const minDimension = Math.min(width, height);

      let config: SizeConfig;

      if (minDimension < 80) {
        // 非常小的组件 - 只显示小图标
        config = {
          iconSize: 12,
          iconContainerSize: 24,
          textSize: 'text-xs',
          spacing: 2,
          showText: false
        };
      } else if (minDimension < 120) {
        // 小组件 - 小图标 + 紧凑文字
        config = {
          iconSize: 16,
          iconContainerSize: 32,
          textSize: 'text-xs',
          spacing: 4,
          showText: true
        };
      } else if (minDimension < 200) {
        // 中等组件 - 标准尺寸
        config = {
          iconSize: 20,
          iconContainerSize: 40,
          textSize: 'text-sm',
          spacing: 6,
          showText: true
        };
      } else {
        // 大组件 - 完整尺寸
        config = {
          iconSize: 24,
          iconContainerSize: 48,
          textSize: 'text-sm',
          spacing: 8,
          showText: true
        };
      }

      setSizeConfig(config);
    };

    // 初始测量
    const timer = setTimeout(updateSizeConfig, 0);

    // 监听窗口大小变化
    const resizeObserver = new ResizeObserver(updateSizeConfig);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 原始内容 */}
      <div className="filter grayscale opacity-60">
        {children}
      </div>
      
      {/* 锁定遮罩层 */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px] rounded-lg z-10"></div>
      
      {/* 锁定状态指示器 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none p-2">
        <div 
          className={`flex flex-col items-center justify-center ${showAnimation ? 'dev-locked-animate' : ''}`}
          style={{ gap: `${sizeConfig.spacing}px` }}
        >
          {/* 锁头图标 */}
          <div 
            className="bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              width: `${sizeConfig.iconContainerSize}px`, 
              height: `${sizeConfig.iconContainerSize}px` 
            }}
          >
            <Lock size={sizeConfig.iconSize} className="text-gray-600" />
          </div>
          
          {/* 提示文字 */}
          {sizeConfig.showText && (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg max-w-full">
              <p className={`${sizeConfig.textSize} font-medium text-gray-700 text-center whitespace-nowrap overflow-hidden text-ellipsis`}>
                {message}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* 禁用所有交互 */}
      <div className="absolute inset-0 z-30 cursor-not-allowed"></div>
    </div>
  );
};

export default DevLocked; 