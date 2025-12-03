import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
  defaultSize?: number; // 左侧面板默认宽度百分比 (0-100)
  minSize?: number; // 最小宽度百分比
  maxSize?: number; // 最大宽度百分比
  storageKey?: string; // localStorage存储键名
  disabled?: boolean; // 是否禁用拖拽
  orientation?: 'horizontal' | 'vertical'; // 分割方向
  resizerClassName?: string;
  leftPanelClassName?: string;
  rightPanelClassName?: string;
}

export const ResizablePanels: React.FC<ResizablePanelsProps> = ({
  children,
  className,
  defaultSize = 30, // 默认左侧占30%
  minSize = 10,
  maxSize = 90,
  storageKey = 'resizable-panels-size',
  disabled = false,
  orientation = 'horizontal',
  resizerClassName,
  leftPanelClassName,
  rightPanelClassName,
}) => {
  const [leftPanel, rightPanel] = children;
  
  // 从localStorage获取保存的尺寸，如果没有则使用默认值
  const [leftSize, setLeftSize] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedSize = Number(saved);
        return Math.max(minSize, Math.min(maxSize, parsedSize));
      }
    }
    return defaultSize;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  // 保存尺寸到localStorage
  const saveSize = useCallback((size: number) => {
    if (storageKey) {
      localStorage.setItem(storageKey, size.toString());
    }
  }, [storageKey]);

  // 处理鼠标按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    if (orientation === 'horizontal') {
      startPosRef.current = e.clientX;
    } else {
      startPosRef.current = e.clientY;
    }
    startSizeRef.current = leftSize;
  }, [disabled, orientation, leftSize]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    let currentPos: number;
    let containerSize: number;
    
    if (orientation === 'horizontal') {
      currentPos = e.clientX;
      containerSize = containerRect.width;
    } else {
      currentPos = e.clientY;
      containerSize = containerRect.height;
    }

    const deltaPos = currentPos - startPosRef.current;
    const deltaPercent = (deltaPos / containerSize) * 100;
    const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + deltaPercent));
    
    setLeftSize(newSize);
  }, [isDragging, orientation, minSize, maxSize]);

  // 处理鼠标松开事件
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      saveSize(leftSize);
    }
  }, [isDragging, leftSize, saveSize]);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, orientation]);

  const rightSize = 100 - leftSize;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {/* 左侧/上侧面板 */}
      <div
        className={cn(
          'flex-shrink-0 overflow-hidden',
          leftPanelClassName
        )}
        style={{
          [orientation === 'horizontal' ? 'width' : 'height']: `${leftSize}%`
        }}
      >
        {leftPanel}
      </div>

      {/* 分割线 */}
      {!disabled && (
        <div
          className={cn(
            'flex-shrink-0 bg-gray-200 hover:bg-gray-300 transition-colors',
            orientation === 'horizontal' 
              ? 'w-1 cursor-col-resize hover:w-2' 
              : 'h-1 cursor-row-resize hover:h-2',
            isDragging && (orientation === 'horizontal' ? 'w-2 bg-blue-400' : 'h-2 bg-blue-400'),
            resizerClassName
          )}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* 右侧/下侧面板 */}
      <div
        className={cn(
          'flex-1 overflow-hidden',
          rightPanelClassName
        )}
        style={{
          [orientation === 'horizontal' ? 'width' : 'height']: `${rightSize}%`
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

// 快捷创建水平分割面板的hook
export const useHorizontalPanels = (storageKey?: string) => {
  return {
    ResizablePanels: (props: Omit<ResizablePanelsProps, 'orientation' | 'storageKey'>) => (
      <ResizablePanels 
        {...props} 
        orientation="horizontal" 
        storageKey={storageKey || 'horizontal-panels-size'} 
      />
    )
  };
};

// 快捷创建垂直分割面板的hook
export const useVerticalPanels = (storageKey?: string) => {
  return {
    ResizablePanels: (props: Omit<ResizablePanelsProps, 'orientation' | 'storageKey'>) => (
      <ResizablePanels 
        {...props} 
        orientation="vertical" 
        storageKey={storageKey || 'vertical-panels-size'} 
      />
    )
  };
}; 