/**
 * 棋盘渲染器 - DOM 操作和用户交互
 * @module ui/board-renderer
 */

import { emit, getGlobalState } from '../utils/event-bus.js';
import { detectConflicts } from '../core/validator.js';
import { GRID_SIZE } from '../config/constants.js';

/**
 * 棋盘 DOM 元素
 * @type {HTMLElement|null}
 */
let boardElement = null;

/**
 * Given mask - 标记哪些格子是预填的
 * @type {boolean[][]|null}
 */
let givenMask = null;

/**
 * 初始化棋盘渲染器
 * @param {string} boardSelector - 棋盘容器的选择器
 */
export function initBoardRenderer(boardSelector = '#board') {
  boardElement = document.querySelector(boardSelector);
  if (!boardElement) {
    throw new Error(`Board element not found: ${boardSelector}`);
  }
}

/**
 * 渲染棋盘
 * @param {number[][]} board - 棋盘数据
 * @param {boolean[][]} given - 预填格子标记
 * @example
 * renderBoard(puzzle, givenMask);
 */
export function renderBoard(board, given) {
  if (!boardElement) {
    initBoardRenderer();
  }

  // 重置标志由事件总线管理，这里不需要设置
  givenMask = given;
  boardElement.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      // 添加加粗边框（3x3 宫格分界）
      if (r === 2 || r === 5) {
        cell.style.borderBottom = '3px solid var(--border-thick)';
      }
      if (c === 2 || c === 5) {
        cell.style.borderRight = '3px solid var(--border-thick)';
      }

      if (given[r][c]) {
        // 预填格子
        cell.classList.add('prefilled');
        cell.textContent = board[r][c] || '';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.dataset.value = board[r][c] || ''; // 添加值到dataset
      } else {
        // 可编辑格子
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.className = 'cell-input';
        input.dataset.r = r;
        input.dataset.c = c;
        input.value = board[r][c] ? board[r][c] : '';

        // 事件监听 - 使用 passive 事件监听器
        input.addEventListener('input', onCellInput, { passive: true });
        input.addEventListener('keydown', onCellKeyDown, { passive: true });

        cell.appendChild(input);
      }

      boardElement.appendChild(cell);
    }
  }

  updateConflicts();
}

/**
 * 单元格输入处理
 * @param {Event} e - 输入事件
 */
function onCellInput(e) {
  const input = e.target;
  const isResetting = getGlobalState('isResetting');
  const isPaused = getGlobalState('isPaused');
  console.log('onCellInput called, isResetting:', isResetting, 'isPaused:', isPaused);

  // 如果正在重置或暂停，不处理输入事件
  if (isResetting) {
    console.log('Skipping input event due to reset');
    return;
  }

  if (isPaused) {
    console.log('Skipping input event due to pause');
    // 清空输入，阻止用户在暂停时输入
    input.value = '';
    return;
  }

  // 只保留 1-9 的数字
  const raw = input.value.replace(/[^\d]/g, '');
  let v = raw.slice(0, 1);
  if (v === '0') v = '';
  input.value = v;

  // 更新冲突高亮
  updateConflicts();

  // 触发事件
  emit('cell:input', {
    row: +input.dataset.r,
    col: +input.dataset.c,
    value: v ? parseInt(v) : 0
  });

  // 检查是否完成
  checkAutoComplete();
}

/**
 * 键盘导航处理
 * @param {KeyboardEvent} e - 键盘事件
 */
function onCellKeyDown(e) {
  const key = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
    e.preventDefault();
    moveFocus(key, e.target);
  }
}

/**
 * 移动焦点到相邻格子
 * @param {string} direction - 方向键
 * @param {HTMLInputElement} input - 当前输入框
 */
function moveFocus(direction, input) {
  const r = +input.dataset.r;
  const c = +input.dataset.c;
  let nr = r;
  let nc = c;

  switch (direction) {
    case 'ArrowLeft':
      nc = (c + 8) % 9;
      break;
    case 'ArrowRight':
      nc = (c + 1) % 9;
      break;
    case 'ArrowUp':
      nr = (r + 8) % 9;
      break;
    case 'ArrowDown':
      nr = (r + 1) % 9;
      break;
  }

  // 查找下一个可编辑的格子
  for (let i = 0; i < 81; i++) {
    const selector = `input.cell-input[data-r="${nr}"][data-c="${nc}"]`;
    const next = boardElement.querySelector(selector);
    if (next) {
      next.focus();
      break;
    }

    // 继续寻找下一个
    if (direction === 'ArrowLeft' || direction === 'ArrowRight') {
      nc = direction === 'ArrowLeft' ? (nc + 8) % 9 : (nc + 1) % 9;
      if (nc === c) nr = direction === 'ArrowLeft' ? (nr + 8) % 9 : (nr + 1) % 9;
    } else {
      nr = direction === 'ArrowUp' ? (nr + 8) % 9 : (nr + 1) % 9;
      if (nr === r) nc = direction === 'ArrowUp' ? (nc + 8) % 9 : (nc + 1) % 9;
    }
  }
}

/**
 * 更新冲突高亮
 */
export function updateConflicts() {
  if (!boardElement) return;

  // 清除所有冲突样式
  const cells = boardElement.querySelectorAll('.cell');
  cells.forEach(c => c.classList.remove('conflict'));

  // 读取当前棋盘
  const board = readUserBoard();

  // 检测冲突
  const { conflicts } = detectConflicts(board);

  // 标记冲突格子
  conflicts.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    const idx = r * 9 + c;
    const cell = cells[idx];
    if (cell) {
      cell.classList.add('conflict');
    }
  });
}

/**
 * 读取用户填写的棋盘
 * @returns {number[][]} 当前棋盘状态
 */
export function readUserBoard() {
  const board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

  if (!boardElement) return board;

  // 读取可编辑格子
  const inputs = boardElement.querySelectorAll('input.cell-input');
  inputs.forEach(inp => {
    const r = +inp.dataset.r;
    const c = +inp.dataset.c;
    const v = parseInt(inp.value);
    board[r][c] = (!isNaN(v) && v >= 1 && v <= 9) ? v : 0;
  });

  // 读取预填格子（优先使用 dataset.value）
  const prefilledCells = boardElement.querySelectorAll('.cell.prefilled');
  prefilledCells.forEach(cell => {
    const r = +cell.dataset.r;
    const c = +cell.dataset.c;
    // 优先从 dataset.value 读取，如果不存在则从 textContent 读取
    const value = parseInt(cell.dataset.value || cell.textContent);
    if (!isNaN(value) && value >= 1 && value <= 9) {
      board[r][c] = value;
    }
  });

  return board;
}

/**
 * 检查是否自动完成
 */
function checkAutoComplete() {
  const isResetting = getGlobalState('isResetting');
  const isPaused = getGlobalState('isPaused');
  console.log('checkAutoComplete called, isResetting:', isResetting, 'isPaused:', isPaused);

  // 如果正在重置或暂停，不进行检查
  if (isResetting) {
    console.log('Skipping auto-complete check due to reset');
    return;
  }

  if (isPaused) {
    console.log('Skipping auto-complete check due to pause');
    return;
  }

  // 添加防抖，防止短时间内多次调用
  if (window._checkCompleteTimeout) {
    clearTimeout(window._checkCompleteTimeout);
  }

  window._checkCompleteTimeout = setTimeout(() => {
    const board = readUserBoard();
    console.log('Board state:', board);

    // 检查是否全部填满
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === 0) {
          console.log('Board not complete, cell [', r, ',', c, '] is empty');
          return;
        }
      }
    }

    console.log('Board is complete, checking for conflicts...');
    // 检查是否有冲突
    const hasConflict = !!boardElement.querySelector('.conflict');
    if (!hasConflict) {
      console.log('No conflicts found, emitting board:complete');
      // 触发完成事件
      emit('board:complete', { board });
    } else {
      console.log('Conflicts found, not completing');
    }
  }, 100); // 延迟100ms执行，避免重复触发
}

/**
 * 清空棋盘
 */
export function clearBoard() {
  if (!boardElement) return;
  boardElement.innerHTML = '';
  givenMask = null;
}

/**
 * 获取指定位置的单元格值
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @returns {number} 单元格值
 */
export function getCellValue(row, col) {
  const board = readUserBoard();
  return board[row][col];
}

/**
 * 设置指定位置的单元格值
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @param {number} value - 值 (0-9)
 */
export function setCellValue(row, col, value) {
  if (!boardElement) return;

  const selector = `input.cell-input[data-r="${row}"][data-c="${col}"]`;
  const input = boardElement.querySelector(selector);
  if (input) {
    input.value = value > 0 ? value : '';
    updateConflicts();
  }
}

/**
 * 高亮指定的单元格列表
 * @param {Array<[number, number]>} positions - 位置列表
 * @param {string} className - CSS 类名
 */
export function highlightCells(positions, className = 'highlight') {
  if (!boardElement) return;

  const cells = boardElement.querySelectorAll('.cell');
  positions.forEach(([r, c]) => {
    const idx = r * 9 + c;
    if (cells[idx]) {
      cells[idx].classList.add(className);
    }
  });
}

/**
 * 清除高亮
 * @param {string} className - CSS 类名
 */
export function clearHighlight(className = 'highlight') {
  if (!boardElement) return;

  const cells = boardElement.querySelectorAll('.cell');
  cells.forEach(cell => cell.classList.remove(className));
}
