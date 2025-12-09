/**
 * 控制器模块 - 按钮和选择器
 * @module ui/controls
 */

import { emit } from '../utils/event-bus.js';

/**
 * 控件元素引用
 */
let difficultyEl = null;
let newBtn = null;
let resetBtn = null;
let clearRecordsBtn = null;

/**
 * 初始化控制器
 * @example
 * initializeControls();
 */
export function initializeControls() {
  // 获取 DOM 元素
  difficultyEl = document.getElementById('difficulty');
  newBtn = document.getElementById('newBtn');
  resetBtn = document.getElementById('resetBtn');
  clearRecordsBtn = document.getElementById('clearRecords');

  // 绑定事件
  if (newBtn) {
    newBtn.addEventListener('click', handleNewGame);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }

  if (clearRecordsBtn) {
    clearRecordsBtn.addEventListener('click', handleClearRecords);
  }

  if (difficultyEl) {
    difficultyEl.addEventListener('change', handleDifficultyChange);
  }

  console.log('Controls initialized');
}

/**
 * 处理新游戏按钮点击
 */
function handleNewGame() {
  emit('game:new', { difficulty: getDifficulty() });
}

/**
 * 处理重置按钮点击
 */
function handleReset() {
  if (confirm('确定要重置游戏吗？')) {
    emit('game:reset');
  }
}

/**
 * 处理清除记录按钮点击
 */
function handleClearRecords() {
  if (confirm('确定清除所有本地记录？')) {
    emit('records:clear');
  }
}

/**
 * 处理难度改变
 */
function handleDifficultyChange() {
  emit('difficulty:changed', { difficulty: getDifficulty() });
}

/**
 * 获取当前选择的难度
 * @returns {string} 难度级别
 * @example
 * const diff = getDifficulty(); // "medium"
 */
export function getDifficulty() {
  if (!difficultyEl) {
    difficultyEl = document.getElementById('difficulty');
  }
  return difficultyEl ? difficultyEl.value : 'medium';
}

/**
 * 设置难度
 * @param {string} difficulty - 难度级别
 * @example
 * setDifficulty('hard');
 */
export function setDifficulty(difficulty) {
  if (!difficultyEl) {
    difficultyEl = document.getElementById('difficulty');
  }
  if (difficultyEl) {
    difficultyEl.value = difficulty;
  }
}

/**
 * 禁用所有控件
 * @example
 * disableControls();
 */
export function disableControls() {
  if (newBtn) newBtn.disabled = true;
  if (resetBtn) resetBtn.disabled = true;
  if (difficultyEl) difficultyEl.disabled = true;
  if (clearRecordsBtn) clearRecordsBtn.disabled = true;
}

/**
 * 启用所有控件
 * @example
 * enableControls();
 */
export function enableControls() {
  if (newBtn) newBtn.disabled = false;
  if (resetBtn) resetBtn.disabled = false;
  if (difficultyEl) difficultyEl.disabled = false;
  if (clearRecordsBtn) clearRecordsBtn.disabled = false;
}

/**
 * 显示加载状态
 * @param {boolean} loading - 是否加载中
 * @example
 * setLoading(true); // 显示加载状态
 * setLoading(false); // 恢复正常状态
 */
export function setLoading(loading) {
  if (loading) {
    disableControls();
    if (newBtn) {
      newBtn.textContent = '生成中...';
    }
  } else {
    enableControls();
    if (newBtn) {
      newBtn.textContent = '新游戏';
    }
  }
}
