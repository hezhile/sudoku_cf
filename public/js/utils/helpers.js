/**
 * 工具函数集合
 * @module utils/helpers
 */

/**
 * 格式化时间（毫秒 -> MM:SS.CC）
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化的时间字符串
 * @example
 * formatTime(123456) // "02:03.45"
 */
export function formatTime(ms) {
  const totalCentis = Math.floor(ms / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 * @example
 * validateEmail('test@example.com') // true
 * validateEmail('invalid') // false
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 * @example
 * const debouncedSearch = debounce(search, 300);
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 重试函数
 * @param {Function} fn - 要重试的异步函数
 * @param {number} maxAttempts - 最大尝试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise<*>} 函数执行结果
 * @example
 * const result = await retry(fetchData, 3, 1000);
 */
export async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delay);
    }
  }
}

/**
 * 延迟函数
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise<void>}
 * @example
 * await sleep(1000); // 等待 1 秒
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查是否在线
 * @returns {boolean} 是否在线
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * 获取用户友好的错误信息
 * @param {Error|Object} error - 错误对象
 * @returns {string} 错误信息
 * @example
 * const msg = getErrorMessage(error);
 */
export function getErrorMessage(error) {
  if (!error) return '未知错误';

  // Supabase 错误
  if (error.message) return error.message;

  // 网络错误
  if (error.name === 'NetworkError') return '网络连接失败';

  // 其他错误
  if (typeof error === 'string') return error;

  return '操作失败，请重试';
}

/**
 * 深拷贝对象（简单实现，适用于可序列化对象）
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 * @example
 * const copy = deepClone(original);
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('Deep clone failed:', error);
    return obj;
  }
}

/**
 * 生成唯一 ID
 * @returns {string} 唯一 ID
 * @example
 * const id = generateId(); // "abc123def456"
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * 安全的 JSON 解析
 * @param {string} str - JSON 字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*} 解析结果或默认值
 * @example
 * const data = safeJSONParse(jsonStr, {});
 */
export function safeJSONParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.warn('JSON parse failed:', error);
    return defaultValue;
  }
}

/**
 * 安全的 JSON 字符串化
 * @param {*} obj - 要序列化的对象
 * @param {string} defaultValue - 序列化失败时的默认值
 * @returns {string} JSON 字符串或默认值
 * @example
 * const jsonStr = safeJSONStringify(obj, '{}');
 */
export function safeJSONStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('JSON stringify failed:', error);
    return defaultValue;
  }
}

/**
 * 将数字限制在指定范围内
 * @param {number} num - 数字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的数字
 * @example
 * clamp(15, 0, 10) // 10
 * clamp(-5, 0, 10) // 0
 * clamp(5, 0, 10) // 5
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}
