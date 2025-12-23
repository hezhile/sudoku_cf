/**
 * 暂停遮罩模块
 * 创建和管理暂停遮罩，覆盖棋盘
 * @module ui/pause-overlay
 */

import { emit } from '../utils/event-bus.js';

let overlayElement = null;
let boardWrapper = null;
let resumeButton = null;

/**
 * 初始化暂停遮罩
 * @param {string} boardWrapperSelector - 棋盘容器选择器
 */
export function initPauseOverlay(boardWrapperSelector = '.board-wrapper') {
  boardWrapper = document.querySelector(boardWrapperSelector);

  if (!boardWrapper) {
    console.warn('Board wrapper not found for pause overlay');
    return;
  }

  // 创建遮罩元素
  overlayElement = document.createElement('div');
  overlayElement.className = 'pause-overlay';
  overlayElement.innerHTML = `
    <div class="pause-content">
      <div class="pause-icon">⏸️</div>
      <h2 class="pause-title" data-i18n="pause.title">游戏已暂停</h2>
      <button id="resumeBtn" class="btn btn-primary btn-lg" data-i18n="pause.resume">
        ↩️ 继续游戏
      </button>
    </div>
  `;

  // 初始隐藏
  overlayElement.style.display = 'none';

  // 绑定恢复按钮事件
  resumeButton = overlayElement.querySelector('#resumeBtn');
  if (resumeButton) {
    resumeButton.addEventListener('click', handleResume);
  }

  // 插入到棋盘容器中
  boardWrapper.appendChild(overlayElement);
}

/**
 * 显示暂停遮罩
 */
export function showPauseOverlay() {
  if (!overlayElement) {
    initPauseOverlay();
  }
  if (overlayElement) {
    overlayElement.style.display = 'flex';
  }
}

/**
 * 隐藏暂停遮罩
 */
export function hidePauseOverlay() {
  if (!overlayElement) return;
  overlayElement.style.display = 'none';
}

/**
 * 检查遮罩是否可见
 * @returns {boolean} 遮罩是否可见
 */
export function isOverlayVisible() {
  return overlayElement && overlayElement.style.display === 'flex';
}

/**
 * 更新遮罩的翻译文本
 * @param {Function} t - i18n 翻译函数
 */
export function updateOverlayTranslations(t) {
  if (!overlayElement) return;

  const titleElement = overlayElement.querySelector('.pause-title');
  const buttonElement = overlayElement.querySelector('#resumeBtn');

  if (titleElement) {
    titleElement.textContent = t('pause.title');
  }
  if (buttonElement) {
    buttonElement.textContent = t('pause.resume');
  }
}

/**
 * 处理恢复按钮点击
 */
function handleResume() {
  emit('game:resume');
}
