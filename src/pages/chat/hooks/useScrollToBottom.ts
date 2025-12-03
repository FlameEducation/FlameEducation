import { useEffect, useRef, useCallback } from 'react';

export const useScrollToBottom = (deps: any[] = []) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      
      // 使用 setTimeout 确保在 DOM 完全更新后执行滚动
      setTimeout(() => {
        // Safari 的兼容性处理
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isSafari) {
          // Safari 上使用 scrollTop 直接设置
          container.scrollTop = container.scrollHeight;
        } else {
          // 其他浏览器使用 scrollTo
          container.scrollTo({
            top: container.scrollHeight,
            behavior: smooth ? 'smooth' : 'instant'
          });
        }
      }, 0);
    }
  }, []);

  // 监听内容变化
  useEffect(() => {
    if (scrollRef.current) {
      const observer = new ResizeObserver(() => {
        scrollToBottom(false);
      });
      
      observer.observe(scrollRef.current);
      
      return () => observer.disconnect();
    }
  }, deps);

  return { scrollRef, scrollToBottom };
}; 