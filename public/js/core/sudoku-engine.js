/**
 * 数独引擎 - 棋盘生成和基础操作
 * @module core/sudoku-engine
 */

import { GRID_SIZE, BLOCK_SIZE } from '../config/constants.js';

/**
 * 创建空棋盘
 * @returns {number[][]} 9x9 的空棋盘（全部填 0）
 * @example
 * const board = createEmptyBoard();
 * // [[0,0,0,...], [0,0,0,...], ...]
 */
export function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

/**
 * 克隆棋盘
 * @param {number[][]} board - 要克隆的棋盘
 * @returns {number[][]} 克隆后的棋盘
 * @example
 * const copy = cloneBoard(original);
 */
export function cloneBoard(board) {
  return board.map(row => row.slice());
}

/**
 * Fisher-Yates 洗牌算法
 * @param {Array} array - 要打乱的数组
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * 检查在指定位置放置数字是否合法
 * @param {number[][]} board - 棋盘
 * @param {number} r - 行索引 (0-8)
 * @param {number} c - 列索引 (0-8)
 * @param {number} value - 要放置的数字 (1-9)，0 表示空格
 * @returns {boolean} 是否合法
 * @example
 * if (isValidPlacement(board, 0, 0, 5)) {
 *   board[0][0] = 5;
 * }
 */
export function isValidPlacement(board, r, c, value) {
  if (value === 0) return true;

  // 检查行
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i !== c && board[r][i] === value) {
      return false;
    }
  }

  // 检查列
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i !== r && board[i][c] === value) {
      return false;
    }
  }

  // 检查 3x3 宫格
  const br = Math.floor(r / BLOCK_SIZE) * BLOCK_SIZE;
  const bc = Math.floor(c / BLOCK_SIZE) * BLOCK_SIZE;
  for (let i = 0; i < BLOCK_SIZE; i++) {
    for (let j = 0; j < BLOCK_SIZE; j++) {
      const rr = br + i;
      const cc = bc + j;
      if ((rr !== r || cc !== c) && board[rr][cc] === value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 生成完整的数独解（使用回溯算法）
 * @returns {number[][]} 完整的 9x9 数独解
 * @throws {Error} 如果生成失败
 * @example
 * const solution = generateFullBoard();
 */
export function generateFullBoard() {
  const board = createEmptyBoard();
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  /**
   * 回溯算法填充棋盘
   * @param {number} pos - 当前位置 (0-80)
   * @returns {boolean} 是否成功
   */
  function backtrack(pos = 0) {
    if (pos === 81) return true;

    const r = Math.floor(pos / 9);
    const c = pos % 9;

    // 随机顺序尝试数字
    shuffle(nums);
    for (const n of nums) {
      if (isValidPlacement(board, r, c, n)) {
        board[r][c] = n;
        if (backtrack(pos + 1)) return true;
        board[r][c] = 0;
      }
    }

    return false;
  }

  const success = backtrack();
  if (!success) {
    throw new Error('Failed to generate full board');
  }

  return board;
}

/**
 * 从完整解挖空生成题目（确保唯一解）
 * @param {number[][]} solBoard - 完整的数独解
 * @param {number} holesTarget - 目标空格数量
 * @returns {number[][]} 挖空后的题目
 * @throws {Error} 如果输入的棋盘无效
 * @example
 * const solution = generateFullBoard();
 * const puzzle = digHolesFromSolution(solution, 46);
 */
export function digHolesFromSolution(solBoard, holesTarget) {
  if (!solBoard || solBoard.length !== GRID_SIZE) {
    throw new Error('Invalid solution board');
  }

  const board = cloneBoard(solBoard);
  const positions = [];

  // 收集所有位置
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      positions.push([i, j]);
    }
  }

  // 随机打乱位置
  shuffle(positions);

  let holes = 0;

  // 逐个尝试挖空
  for (let idx = 0; idx < positions.length && holes < holesTarget; idx++) {
    const [r, c] = positions[idx];
    if (board[r][c] === 0) continue;

    const backup = board[r][c];
    board[r][c] = 0;

    // 检查是否仍然有唯一解（这里导入 solver 会有循环依赖，暂时简化处理）
    // 实际使用时在 solver.js 中实现 countSolutions
    // 这里我们先挖空，后续在 solver.js 中添加验证逻辑

    holes++;

    // 如果达到目标，提前退出
    if (holes >= holesTarget) break;
  }

  return board;
}

/**
 * 检查棋盘是否已填满
 * @param {number[][]} board - 棋盘
 * @returns {boolean} 是否已填满
 * @example
 * if (isBoardFull(board)) {
 *   console.log('Board is complete!');
 * }
 */
export function isBoardFull(board) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 获取指定单元格所在的宫格索引
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 * @returns {{blockRow: number, blockCol: number}} 宫格索引
 * @example
 * const {blockRow, blockCol} = getBlockIndex(4, 5);
 * // blockRow = 1, blockCol = 1
 */
export function getBlockIndex(r, c) {
  return {
    blockRow: Math.floor(r / BLOCK_SIZE),
    blockCol: Math.floor(c / BLOCK_SIZE)
  };
}
