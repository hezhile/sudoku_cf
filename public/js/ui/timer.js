/**
 * 计时器模块
 * @module ui/timer
 */

import { emit, getGlobalState } from '../utils/event-bus.js';
import { formatTime } from '../utils/helpers.js';
import { TIMER_UPDATE_INTERVAL } from '../config/constants.js';

/**
 * 计时器状态
 */
let startTime = null;
let timerInterval = null;
let running = false;
let pausedTime = 0;

/**
 * 计时器显示元素
 * @type {HTMLElement|null}
 */
let timerElement = null;

/**
 * 暂停按钮元素
 * @type {HTMLElement|null}
 */
let pauseButton = null;

/**
 * 初始化计时器
 * @param {string} selector - 计时器元素选择器
 */
export function initTimer(selector = '#timer') {
  timerElement = document.querySelector(selector);
  if (!timerElement) {
    console.warn(`Timer element not found: ${selector}`);
  }

  // 创建暂停按钮
  createPauseButton();
}

/**
 * 创建暂停按钮
 */
function createPauseButton() {
  // 如果已经创建过，直接返回
  if (pauseButton) return;

  pauseButton = document.createElement('button');
  pauseButton.className = 'pause-btn';
  pauseButton.innerHTML = '⏸️';
  pauseButton.setAttribute('aria-label', '暂停游戏');
  pauseButton.setAttribute('type', 'button');

  // 绑定点击事件
  pauseButton.addEventListener('click', handlePauseToggle);

  // 添加到计时器区域
  const timerArea = document.getElementById('timerArea');
  if (timerArea) {
    // 设置为 flex 布局以并排显示
    timerArea.style.display = 'flex';
    timerArea.style.alignItems = 'center';
    timerArea.style.justifyContent = 'center';
    timerArea.style.gap = '10px';
    timerArea.appendChild(pauseButton);
  } else {
    console.warn('Timer area not found for pause button');
  }
}

/**
 * 处理暂停按钮点击
 */
function handlePauseToggle() {
  const isPaused = getGlobalState('isPaused');
  if (isPaused) {
    emit('game:resume');
  } else {
    emit('game:pause');
  }
}

/**
 * 启动计时器
 * @example
 * startTimer();
 */
export function startTimer() {
  if (running) {
    return;
  }

  startTime = Date.now() - pausedTime;
  pausedTime = 0;

  if (!timerElement) {
    initTimer();
  }

  if (timerElement) {
    timerElement.textContent = formatTime(0);
  }

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (timerElement) {
      timerElement.textContent = formatTime(elapsed);
    }
    emit('timer:tick', { elapsed });
  }, TIMER_UPDATE_INTERVAL);

  running = true;
  emit('timer:started', { startTime });
}

/**
 * 停止计时器
 * @example
 * stopTimer();
 */
export function stopTimer() {
  // 先获取已用时间（此时 running 还是 true）
  const elapsed = getElapsedTime();

  // 清除定时器
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // 保存暂停时间
  pausedTime = elapsed;

  // 停止运行
  running = false;

  emit('timer:stopped', { elapsed });
}

/**
 * 暂停计时器
 * @example
 * pauseTimer();
 */
export function pauseTimer() {
  if (!running) return;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  pausedTime = Date.now() - startTime;
  running = false;
  emit('timer:paused', { elapsed: pausedTime });
}

/**
 * 恢复计时器
 * @example
 * resumeTimer();
 */
export function resumeTimer() {
  if (running) return;
  startTimer();
}

/**
 * 重置计时器
 * @example
 * resetTimer();
 */
export function resetTimer() {
  stopTimer();
  startTime = null;
  pausedTime = 0;

  if (timerElement) {
    timerElement.textContent = formatTime(0);
  }

  emit('timer:reset');
}

/**
 * 获取已用时间（毫秒）
 * @returns {number} 已用时间
 * @example
 * const elapsed = getElapsedTime();
 * console.log('Time:', formatTime(elapsed));
 */
export function getElapsedTime() {
  if (!startTime) {
    return 0;
  }
  if (running) {
    return Date.now() - startTime;
  }
  return pausedTime;
}

/**
 * 检查计时器是否运行中
 * @returns {boolean} 是否运行中
 */
export function isRunning() {
  return running;
}

/**
 * 设置计时器显示文本（用于显示特殊消息）
 * @param {string} text - 要显示的文本
 * @example
 * setTimerDisplay('生成中...');
 */
export function setTimerDisplay(text) {
  if (!timerElement) {
    initTimer();
  }

  if (timerElement) {
    timerElement.textContent = text;
  }
}

/**
 * 获取格式化的当前时间
 * @returns {string} 格式化的时间字符串
 * @example
 * const timeStr = getFormattedTime();
 */
export function getFormattedTime() {
  return formatTime(getElapsedTime());
}

/**
 * 更新暂停按钮的外观
 * @param {boolean} isPaused - 是否暂停
 * @param {Function} t - i18n 翻译函数（可选）
 */
export function updatePauseButton(isPaused, t) {
  if (!pauseButton) return;

  if (isPaused) {
    pauseButton.innerHTML = '▶️';
    pauseButton.setAttribute('aria-label', t ? t('pause.resume') : '继续游戏');
  } else {
    pauseButton.innerHTML = '⏸️';
    pauseButton.setAttribute('aria-label', '暂停游戏');
  }
}

/**
 * 检查暂停按钮是否存在
 * @returns {boolean} 暂停按钮是否已创建
 */
export function hasPauseButton() {
  return pauseButton !== null;
}

/**
 * 设置已用时间（用于恢复保存的游戏状态）
 * @param {number} elapsed - 已用时间（毫秒）
 */
export function setElapsedTime(elapsed) {
  pausedTime = elapsed;
  if (timerElement) {
    timerElement.textContent = formatTime(elapsed);
  }
}

/**
 * 启动计时器（从指定的已用时间开始）
 * @param {number} elapsed - 起始已用时间（毫秒）
 */
export function startTimerWithElapsed(elapsed) {
  pausedTime = elapsed;
  startTimer();
}
