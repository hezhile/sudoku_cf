/**
 * i18n 辅助模块 - 统一访问全局 i18n 实例
 * 避免在各模块中重复定义 getI18n() 函数
 * @module utils/i18n-helper
 */

/**
 * 获取全局 i18n 实例
 * 在 index.html 的脚本中，i18n.js 将 window.i18n 设置为全局 I18n 实例
 * @returns {Object} i18n 实例，包含 t(), setLanguage() 等方法
 * @throws {Error} 如果 i18n 未正确初始化
 * @example
 * import { getI18n } from '../utils/i18n-helper.js';
 * 
 * const i18n = getI18n();
 * const greeting = i18n.t('greeting');
 */
export function getI18n() {
  if (!window.i18n) {
    throw new Error('i18n 系统未初始化。请确保在 init() 之前已加载 i18n.js');
  }
  return window.i18n;
}

/**
 * 检查 i18n 是否已初始化
 * @returns {boolean} i18n 是否可用
 * @example
 * if (isI18nReady()) {
 *   const text = getI18n().t('key');
 * }
 */
export function isI18nReady() {
  return typeof window.i18n !== 'undefined' && window.i18n !== null;
}

/**
 * 翻译键值（快捷方法）
 * @param {string} key - 翻译键
 * @param {Object} vars - 变量替换（如有）
 * @returns {string} 翻译后的文本
 * @example
 * const msg = t('welcome', { name: 'John' });
 */
export function t(key, vars = {}) {
  return getI18n().t(key, vars);
}

/**
 * 获取当前语言代码
 * @returns {string} 当前语言代码（如 'en-US', 'zh-CN'）
 * @example
 * const lang = getCurrentLanguage(); // 'zh-CN'
 */
export function getCurrentLanguage() {
  return getI18n().currentLang;
}

/**
 * 设置语言
 * @param {string} lang - 语言代码
 * @returns {Promise<void>} 设置完成
 * @example
 * await setLanguage('en-US');
 */
export function setLanguage(lang) {
  return getI18n().setLanguage(lang);
}
