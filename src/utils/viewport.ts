/**
 * 智能视口高度工具 - 优化Safari地址栏处理
 * 
 * 针对移动端Safari地址栏问题的优化方案：
 * 1. 减少监听事件，避免频繁重排
 * 2. 智能区分键盘弹出和地址栏变化
 * 3. 提供多种视口高度策略
 */

let isInitialized = false;
let lastKnownHeight = 0;
let isKeyboardOpen = false;

/**
 * 检测是否为移动设备
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 检测键盘是否打开
 * 通过视口高度变化幅度判断
 */
function detectKeyboardState(): boolean {
  const heightDiff = lastKnownHeight - window.innerHeight;
  // 如果高度减少超过150px，认为是键盘打开
  return heightDiff > 150;
}

/**
 * 设置视口高度变量
 * 只在必要时更新，减少重排
 */
function setViewportHeight() {
  const currentHeight = window.innerHeight;
  const vh = currentHeight * 0.01;
  
  // 检测键盘状态
  const keyboardOpen = detectKeyboardState();
  
  // 如果键盘状态发生变化，更新标记
  if (keyboardOpen !== isKeyboardOpen) {
    isKeyboardOpen = keyboardOpen;
    document.documentElement.dataset.keyboardOpen = keyboardOpen.toString();
  }
  
  // 设置当前视口高度
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // 设置稳定视口高度（不受键盘影响）
  if (!isKeyboardOpen || lastKnownHeight === 0) {
    document.documentElement.style.setProperty('--vh-stable', `${vh}px`);
    lastKnownHeight = currentHeight;
  }
}

/**
 * 防抖函数
 */
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

/**
 * 初始化智能视口高度
 */
export function initDynamicVH() {
  if (isInitialized) {
    return;
  }

  // 初始设置
  setViewportHeight();

  // 防抖处理的resize监听器
  const debouncedResize = debounce(setViewportHeight, 100);

  // 仅在移动设备上监听resize事件
  if (isMobileDevice()) {
    window.addEventListener('resize', debouncedResize);
    
    // 监听设备方向变化
    window.addEventListener('orientationchange', () => {
      // 方向变化后延迟更新，等待浏览器完成重排
      setTimeout(() => {
        lastKnownHeight = 0; // 重置高度记录
        setViewportHeight();
      }, 300);
    });
  } else {
    // 桌面端只监听resize
    window.addEventListener('resize', debouncedResize);
  }

  isInitialized = true;
}

/**
 * 清理视口高度监听器
 */
export function cleanupDynamicVH() {
  if (!isInitialized) {
    return;
  }

  // 移除所有事件监听器
  const debouncedResize = debounce(setViewportHeight, 100);
  window.removeEventListener('resize', debouncedResize);
  window.removeEventListener('orientationchange', setViewportHeight);

  isInitialized = false;
}

/**
 * 手动更新视口高度
 * 在某些特殊情况下可能需要手动触发更新
 */
export function updateDynamicVH() {
  setViewportHeight();
}

/**
 * 获取当前键盘状态
 */
export function isKeyboardVisible(): boolean {
  return isKeyboardOpen;
}

/**
 * 获取稳定视口高度（px）
 */
export function getStableViewportHeight(): number {
  return lastKnownHeight || window.innerHeight;
} 