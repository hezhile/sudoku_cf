/**
 * 暂停遮罩模块
 * 创建和管理暂停遮罩，覆盖棋盘
 * @module ui/pause-overlay
 */

import { emit } from '../utils/event-bus.js';
import { EVENTS } from '../config/events.js';

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

  if (!overlayElement) {
    overlayElement = document.getElementById('pauseOverlay') || document.createElement('div');
    overlayElement.id = 'pauseOverlay';
    overlayElement.className = 'pause-overlay';
    overlayElement.innerHTML = `
      <div class="pause-content pause-overlay-content">
        <div class="pause-icon">⏸️</div>
        <h2 class="pause-title" data-i18n="pause.title">游戏已暂停</h2>
        <button id="resumeBtn" class="btn btn-primary btn-lg" data-i18n="pause.resume">
          ▶️ 继续游戏
        </button>
      </div>
    `;
    overlayElement.style.display = 'none';
  }

  if (overlayElement.parentElement !== boardWrapper) {
    boardWrapper.appendChild(overlayElement);
  }

  resumeButton = overlayElement.querySelector('#resumeBtn');
  if (resumeButton) {
    resumeButton.onclick = handleResume;
  }
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
  return !!overlayElement && overlayElement.style.display === 'flex';
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
  emit(EVENTS.GAME_RESUME_REQUEST);
}
