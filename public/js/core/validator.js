/**
 * 数独验证器 - 冲突检测和完整性检查
 * @module core/validator
 */

import { GRID_SIZE, BLOCK_SIZE } from '../config/constants.js';

// 获取全局i18n实例
const getI18n = () => window.i18n;

/**
 * 检测棋盘中的冲突单元格
 * @param {number[][]} board - 要检测的棋盘
 * @returns {{hasConflicts: boolean, conflicts: Set<string>}} 冲突信息
 * @example
 * const {hasConflicts, conflicts} = detectConflicts(board);
 * if (hasConflicts) {
 *   console.log('Found conflicts:', conflicts);
 * }
 */
export function detectConflicts(board) {
  const conflicts = new Set();

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = board[r][c];
      if (!value) continue;

      // 检查行冲突
      for (let i = 0; i < GRID_SIZE; i++) {
        if (i !== c && board[r][i] === value) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r},${i}`);
        }
      }

      // 检查列冲突
      for (let i = 0; i < GRID_SIZE; i++) {
        if (i !== r && board[i][c] === value) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${i},${c}`);
        }
      }

      // 检查 3x3 宫格冲突
      const br = Math.floor(r / BLOCK_SIZE) * BLOCK_SIZE;
      const bc = Math.floor(c / BLOCK_SIZE) * BLOCK_SIZE;
      for (let i = 0; i < BLOCK_SIZE; i++) {
        for (let j = 0; j < BLOCK_SIZE; j++) {
          const rr = br + i;
          const cc = bc + j;
          if ((rr !== r || cc !== c) && board[rr][cc] === value) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${rr},${cc}`);
          }
        }
      }
    }
  }

  return {
    hasConflicts: conflicts.size > 0,
    conflicts
  };
}

/**
 * 检查棋盘是否已完成（全部填满且无冲突）
 * @param {number[][]} board - 棋盘
 * @returns {boolean} 是否完成
 * @example
 * if (isComplete(board)) {
 *   console.log('Game completed!');
 * }
 */
export function isComplete(board) {
  // 检查是否全部填满
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        return false;
      }
    }
  }

  // 检查是否有冲突
  const { hasConflicts } = detectConflicts(board);
  return !hasConflicts;
}

/**
 * 验证用户解答是否正确
 * @param {number[][]} userBoard - 用户填写的棋盘
 * @param {number[][]} solutionBoard - 标准解答
 * @returns {{isCorrect: boolean, errors: string[]}} 验证结果
 * @example
 * const {isCorrect, errors} = validateSolution(userBoard, solution);
 * if (!isCorrect) {
 *   console.log('Errors:', errors);
 * }
 */
export function validateSolution(userBoard, solutionBoard) {
  const errors = [];

  // 检查是否全部填满
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (userBoard[r][c] === 0) {
        errors.push(getI18n().t('errors.emptyCells'));
        return { isCorrect: false, errors };
      }
    }
  }

  // 检查冲突
  const { hasConflicts, conflicts } = detectConflicts(userBoard);
  if (hasConflicts) {
    errors.push(getI18n().t('errors.conflicts', { count: conflicts.size }));
    return { isCorrect: false, errors };
  }

  // 与标准解答比对
  if (solutionBoard) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (userBoard[r][c] !== solutionBoard[r][c]) {
          errors.push(getI18n().t('errors.incorrectAnswer'));
          return { isCorrect: false, errors };
        }
      }
    }
  }

  return { isCorrect: true, errors: [] };
}

/**
 * 获取指定单元格相关的所有单元格（同行、同列、同宫格）
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 * @returns {Array<[number, number]>} 相关单元格位置列表
 * @example
 * const related = getRelatedCells(4, 4);
 * // 返回所有与 (4,4) 相关的单元格坐标
 */
export function getRelatedCells(r, c) {
  const related = [];

  // 同行
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i !== c) {
      related.push([r, i]);
    }
  }

  // 同列
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i !== r) {
      related.push([i, c]);
    }
  }

  // 同宫格
  const br = Math.floor(r / BLOCK_SIZE) * BLOCK_SIZE;
  const bc = Math.floor(c / BLOCK_SIZE) * BLOCK_SIZE;
  for (let i = 0; i < BLOCK_SIZE; i++) {
    for (let j = 0; j < BLOCK_SIZE; j++) {
      const rr = br + i;
      const cc = bc + j;
      if (rr !== r || cc !== c) {
        // 避免重复添加
        const exists = related.some(([er, ec]) => er === rr && ec === cc);
        if (!exists) {
          related.push([rr, cc]);
        }
      }
    }
  }

  return related;
}

/**
 * 获取单元格的可选数字
 * @param {number[][]} board - 棋盘
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 * @returns {number[]} 可选数字列表
 * @example
 * const candidates = getCandidates(board, 0, 0);
 * console.log('Possible values:', candidates);
 */
export function getCandidates(board, r, c) {
  if (board[r][c] !== 0) {
    return []; // 已有数字，无候选
  }

  const used = new Set();

  // 收集行中的数字
  for (let i = 0; i < GRID_SIZE; i++) {
    if (board[r][i] !== 0) {
      used.add(board[r][i]);
    }
  }

  // 收集列中的数字
  for (let i = 0; i < GRID_SIZE; i++) {
    if (board[i][c] !== 0) {
      used.add(board[i][c]);
    }
  }

  // 收集宫格中的数字
  const br = Math.floor(r / BLOCK_SIZE) * BLOCK_SIZE;
  const bc = Math.floor(c / BLOCK_SIZE) * BLOCK_SIZE;
  for (let i = 0; i < BLOCK_SIZE; i++) {
    for (let j = 0; j < BLOCK_SIZE; j++) {
      const value = board[br + i][bc + j];
      if (value !== 0) {
        used.add(value);
      }
    }
  }

  // 返回未使用的数字
  const candidates = [];
  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) {
      candidates.push(n);
    }
  }

  return candidates;
}

/**
 * 检查单元格是否处于错误状态（与周围单元格冲突）
 * @param {number[][]} board - 棋盘
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 * @returns {boolean} 是否有错误
 * @example
 * if (isCellInvalid(board, 0, 0)) {
 *   console.log('Cell has conflict');
 * }
 */
export function isCellInvalid(board, r, c) {
  const value = board[r][c];
  if (value === 0) return false;

  const { conflicts } = detectConflicts(board);
  return conflicts.has(`${r},${c}`);
}
