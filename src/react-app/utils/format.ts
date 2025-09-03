/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式类型
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  date: string | Date,
  format: 'full' | 'date' | 'time' | 'relative' = 'full'
): string => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  switch (format) {
    case 'date':
      return dateObj.toLocaleDateString('zh-CN');
    case 'time':
      return dateObj.toLocaleTimeString('zh-CN');
    case 'relative':
      return formatRelativeTime(dateObj);
    case 'full':
    default:
      return dateObj.toLocaleString('zh-CN');
  }
};

/**
 * 格式化相对时间
 * @param date 日期对象
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
};

/**
 * 安全格式化数字（避免 null/undefined 报错）
 * @param value 数值
 * @param decimals 保留的小数位
 * @param fallback 默认值
 * @returns 格式化后的字符串
 */
export const safeToFixed = (
  value: any,
  decimals: number = 2,
  fallback: string = '0.00'
): string => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value.toFixed(decimals);
  }
  return fallback;
};

/**
 * 格式化货币
 * @param amount 金额
 * @param currency 货币符号
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (
  amount: number | undefined,
  currency: string = '¥'
): string => {
  return `${currency}${safeToFixed(amount, 2)}`;
};

/**
 * 格式化数字
 * @param num 数字
 * @param decimals 小数位数
 * @returns 格式化后的数字字符串
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化百分比
 * @param value 数值
 * @param total 总数
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export const formatPercentage = (
  value: number,
  total: number,
  decimals: number = 1
): string => {
  if (total === 0) return '0%';

  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};
