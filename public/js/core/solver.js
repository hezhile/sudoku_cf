/**
 * 数独求解器 - 解题和唯一性验证
 * @module core/solver
 */

import { cloneBoard, isValidPlacement } from './sudoku-engine.js';
import { GRID_SIZE } from '../config/constants.js';

/**
 * 查找棋盘中第一个空格
 * @param {number[][]} board - 棋盘
 * @returns {[number, number]|null} 空格位置 [row, col] 或 null
 */
function findEmpty(board) {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board[i][j] === 0) {
        return [i, j];
      }
    }
  }
  return null;
}

/**
 * 计算题目的解的数量（用于验证唯一性）
 * @param {number[][]} board - 要求解的棋盘
 * @param {number} [limit=2] - 最大计数限制（超过限制提前停止）
 * @returns {number} 解的数量
 * @example
 * const count = countSolutions(puzzle, 2);
 * if (count === 1) {
 *   console.log('有唯一解');
 * } else if (count > 1) {
 *   console.log('有多解');
 * }
 */
export function countSolutions(board, limit = 2) {
  const b = cloneBoard(board);
  let count = 0;

  /**
   * 回溯算法计数解
   */
  function backtrack() {
    if (count >= limit) return;

    const pos = findEmpty(b);
    if (!pos) {
      count++;
      return;
    }

    const [r, c] = pos;
    for (let n = 1; n <= 9; n++) {
      if (isValidPlacement(b, r, c, n)) {
        b[r][c] = n;
        backtrack();
        b[r][c] = 0;

        if (count >= limit) return;
      }
    }
  }

  backtrack();
  return count;
}

/**
 * 检查题目是否有唯一解
 * @param {number[][]} board - 要检查的棋盘
 * @returns {boolean} 是否有唯一解
 * @example
 * if (hasUniqueSolution(puzzle)) {
 *   console.log('题目有唯一解');
 * }
 */
export function hasUniqueSolution(board) {
  return countSolutions(board, 2) === 1;
}

/**
 * 求解数独题目（返回一个解）
 * @param {number[][]} board - 要求解的棋盘
 * @returns {number[][]|null} 解答棋盘，无解返回 null
 * @example
 * const solution = solvePuzzle(puzzle);
 * if (solution) {
 *   console.log('找到解答');
 * }
 */
export function solvePuzzle(board) {
  const b = cloneBoard(board);

  /**
   * 回溯算法求解
   * @returns {boolean} 是否成功
   */
  function backtrack() {
    const pos = findEmpty(b);
    if (!pos) return true; // 已填满，找到解

    const [r, c] = pos;
    for (let n = 1; n <= 9; n++) {
      if (isValidPlacement(b, r, c, n)) {
        b[r][c] = n;
        if (backtrack()) return true;
        b[r][c] = 0;
      }
    }

    return false;
  }

  const solved = backtrack();
  return solved ? b : null;
}

/**
 * 验证用户答案是否正确
 * @param {number[][]} userBoard - 用户填写的棋盘
 * @param {number[][]} solutionBoard - 标准解答
 * @returns {boolean} 是否完全匹配
 * @example
 * if (validateAnswer(userBoard, solution)) {
 *   console.log('答案正确！');
 * }
 */
export function validateAnswer(userBoard, solutionBoard) {
  if (!userBoard || !solutionBoard) return false;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (userBoard[r][c] !== solutionBoard[r][c]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 从完整解挖空并验证唯一性（改进版的挖空算法）
 * @param {number[][]} solBoard - 完整解
 * @param {number} holesTarget - 目标空格数量
 * @returns {number[][]} 挖空后的题目
 */
export function digHolesWithValidation(solBoard, holesTarget) {
  const board = cloneBoard(solBoard);
  const positions = [];

  // 收集所有位置
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      positions.push([i, j]);
    }
  }

  // Fisher-Yates 洗牌
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let holes = 0;

  // 逐个尝试挖空
  for (let idx = 0; idx < positions.length && holes < holesTarget; idx++) {
    const [r, c] = positions[idx];
    if (board[r][c] === 0) continue;

    const backup = board[r][c];
    board[r][c] = 0;

    // 检查是否仍然有唯一解
    const solutions = countSolutions(board, 2);
    if (solutions !== 1) {
      // 恢复，不挖这个格子
      board[r][c] = backup;
    } else {
      holes++;
    }
  }

  return board;
}

/**
 * 检查棋盘状态是否有效（所有已填数字都不冲突）
 * @param {number[][]} board - 棋盘
 * @returns {boolean} 是否有效
 * @example
 * if (isBoardValid(board)) {
 *   console.log('当前棋盘状态有效');
 * }
 */
export function isBoardValid(board) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = board[r][c];
      if (value === 0) continue;

      // 临时移除当前值，检查是否可以放置
      board[r][c] = 0;
      const valid = isValidPlacement(board, r, c, value);
      board[r][c] = value;

      if (!valid) {
        return false;
      }
    }
  }
  return true;
}
