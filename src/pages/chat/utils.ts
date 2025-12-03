export const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}天前`;
  }

  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 添加 UUID 生成函数
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 格式化日期时间为"上午/下午 HH:MM"格式
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的时间字符串
 */
export const formatTime = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const hours = date.getHours();
  
  // 上午/下午
  const ampm = hours < 12 ? '上午' : '下午';
  // 12小时制的小时
  const displayHours = hours % 12 || 12;
  // 格式化分钟，确保是两位数
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${ampm} ${displayHours}:${minutes}`;
};

/**
 * 格式化音频播放时间(秒)为"M:SS"格式
 * @param timeInSeconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatAudioTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}; 