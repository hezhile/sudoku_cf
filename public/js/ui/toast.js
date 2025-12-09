/**
 * Toast 通知系统
 * @module ui/toast
 */

import { TOAST_DURATION } from '../config/constants.js';

/**
 * Toast 类型图标映射
 * @type {Object.<string, string>}
 */
const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ⓘ'
};

/**
 * 获取或创建 Toast 容器
 * @returns {HTMLElement} Toast 容器元素
 */
function getOrCreateContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * 创建 Toast 元素
 * @param {string} message - 消息内容
 * @param {string} type - Toast 类型
 * @returns {HTMLElement} Toast 元素
 */
function createToastElement(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // 图标
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = TOAST_ICONS[type] || TOAST_ICONS.info;

  // 消息
  const messageEl = document.createElement('span');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;

  // 关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', '关闭通知');
  closeBtn.onclick = () => removeToast(toast);

  toast.appendChild(icon);
  toast.appendChild(messageEl);
  toast.appendChild(closeBtn);

  return toast;
}

/**
 * 移除 Toast（带动画）
 * @param {HTMLElement} toast - Toast 元素
 */
function removeToast(toast) {
  toast.style.animation = 'slideOut 0.3s ease';
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * 显示 Toast 通知
 * @param {string} message - 消息内容
 * @param {string} [type='info'] - Toast 类型：success、error、warning、info
 * @param {number} [duration=TOAST_DURATION] - 显示时长（毫秒），0 表示不自动关闭
 * @example
 * showToast('操作成功！', 'success');
 * showToast('发生错误', 'error', 5000);
 * showToast('提示信息', 'info', 0); // 不自动关闭
 */
export function showToast(message, type = 'info', duration = TOAST_DURATION) {
  const container = getOrCreateContainer();
  const toast = createToastElement(message, type);

  container.appendChild(toast);

  // 自动关闭
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  // 限制最大 Toast 数量（最多显示 5 个）
  const toasts = container.querySelectorAll('.toast');
  if (toasts.length > 5) {
    removeToast(toasts[0]);
  }
}

/**
 * 显示成功消息
 * @param {string} message - 消息内容
 * @param {number} [duration=TOAST_DURATION] - 显示时长
 * @example
 * showSuccess('保存成功！');
 */
export function showSuccess(message, duration) {
  showToast(message, 'success', duration);
}

/**
 * 显示错误消息
 * @param {string} message - 消息内容
 * @param {number} [duration=TOAST_DURATION] - 显示时长
 * @example
 * showError('操作失败，请重试');
 */
export function showError(message, duration) {
  showToast(message, 'error', duration);
}

/**
 * 显示警告消息
 * @param {string} message - 消息内容
 * @param {number} [duration=TOAST_DURATION] - 显示时长
 * @example
 * showWarning('存储空间不足');
 */
export function showWarning(message, duration) {
  showToast(message, 'warning', duration);
}

/**
 * 显示信息消息
 * @param {string} message - 消息内容
 * @param {number} [duration=TOAST_DURATION] - 显示时长
 * @example
 * showInfo('登录邮件已发送');
 */
export function showInfo(message, duration) {
  showToast(message, 'info', duration);
}

/**
 * 清除所有 Toast
 * @example
 * clearAllToasts();
 */
export function clearAllToasts() {
  const container = document.querySelector('.toast-container');
  if (container) {
    container.innerHTML = '';
  }
}
