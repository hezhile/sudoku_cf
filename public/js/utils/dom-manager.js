/**
 * DOM 操作管理模块
 * 提供统一的 DOM 操作接口，便于维护和性能优化
 * @module utils/dom-manager
 */

import { DOM_SELECTORS, getElement, getElements, clearElementCache } from '../config/dom-selectors.js';

/**
 * 显示元素
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @param {string} display - CSS display 值（默认 'block'）
 * @example
 * showElement('#myDiv');
 * showElement(element, 'flex');
 */
export function showElement(selector, display = 'block') {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.style.display = display;
}

/**
 * 隐藏元素
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @example
 * hideElement('#myDiv');
 */
export function hideElement(selector) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.style.display = 'none';
}

/**
 * 切换元素显隐
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @example
 * toggleElementVisibility('#myDiv');
 */
export function toggleElementVisibility(selector) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * 添加 CSS 类
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @param {string} className - 类名
 * @example
 * addClass('#myDiv', 'active');
 */
export function addClass(selector, className) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.classList.add(className);
}

/**
 * 移除 CSS 类
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @param {string} className - 类名
 * @example
 * removeClass('#myDiv', 'active');
 */
export function removeClass(selector, className) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.classList.remove(className);
}

/**
 * 切换 CSS 类
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @param {string} className - 类名
 * @example
 * toggleClass('#myDiv', 'active');
 */
export function toggleClass(selector, className) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.classList.toggle(className);
}

/**
 * 设置元素文本内容
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @param {string} text - 文本内容
 * @example
 * setText('#myDiv', 'Hello World');
 */
export function setText(selector, text) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.textContent = text;
}

/**
 * 获取元素文本内容
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @returns {string} 文本内容
 * @example
 * const text = getText('#myDiv');
 */
export function getText(selector) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  return el ? el.textContent : '';
}

/**
 * 设置元素 HTML 内容
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @param {string} html - HTML 内容
 * @example
 * setHTML('#myDiv', '<p>Hello</p>');
 */
export function setHTML(selector, html) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.innerHTML = html;
}

/**
 * 清空元素内容
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @example
 * clearElement('#myDiv');
 */
export function clearElement(selector) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.innerHTML = '';
}

/**
 * 使用 DocumentFragment 批量插入 DOM 节点
 * 提高性能，减少 reflow
 * @param {HTMLElement} container - 容器元素
 * @param {HTMLElement[]} elements - 要插入的元素数组
 * @example
 * const cells = [];
 * for (let i = 0; i < 81; i++) {
 *   const cell = document.createElement('div');
 *   cells.push(cell);
 * }
 * batchAppendChildren(board, cells);
 */
export function batchAppendChildren(container, elements) {
  if (!container || !Array.isArray(elements)) return;
  
  const fragment = document.createDocumentFragment();
  elements.forEach(el => fragment.appendChild(el));
  container.appendChild(fragment);
}

/**
 * 事件委托：为容器内匹配选择器的元素添加事件监听
 * @param {string|HTMLElement} containerSelector - 容器选择器或元素
 * @param {string} eventType - 事件类型（如 'click', 'input'）
 * @param {string} targetSelector - 目标元素选择器
 * @param {Function} handler - 事件处理函数
 * @returns {Function} 移除监听的函数
 * @example
 * const removeListener = delegateEvent(
 *   '#board',
 *   'input',
 *   '.cell-input',
 *   (e) => console.log('Input changed:', e.target.value)
 * );
 */
export function delegateEvent(containerSelector, eventType, targetSelector, handler) {
  const container = typeof containerSelector === 'string' 
    ? getElement(containerSelector) 
    : containerSelector;
    
  if (!container) return () => {};
  
  const delegateHandler = (e) => {
    const target = e.target.closest(targetSelector);
    if (target) {
      handler.call(target, e);
    }
  };
  
  container.addEventListener(eventType, delegateHandler, false);
  
  // 返回移除监听的函数
  return () => {
    container.removeEventListener(eventType, delegateHandler, false);
  };
}

/**
 * 禁用元素
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @example
 * disableElement('#submitBtn');
 */
export function disableElement(selector) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.disabled = true;
}

/**
 * 启用元素
 * @param {string|HTMLElement} selector - DOM 选择器或 HTML 元素
 * @example
 * enableElement('#submitBtn');
 */
export function enableElement(selector) {
  const el = typeof selector === 'string' ? getElement(selector) : selector;
  if (el) el.disabled = false;
}

/**
 * 检查元素是否存在
 * @param {string} selector - DOM 选择器
 * @returns {boolean} 元素是否存在
 * @example
 * if (elementExists('#board')) { ... }
 */
export function elementExists(selector) {
  return getElement(selector) !== null;
}

/**
 * 清除所有缓存的 DOM 元素
 * 在页面重新渲染或重构时调用
 * @example
 * clearAllElementCache();
 */
export function clearAllElementCache() {
  clearElementCache();
}
