/**
 * 游戏状态持久化模块
 * 处理保存和恢复当前游戏状态到 localStorage
 * @module storage/game-state
 */

import { GAME_STATE_STORAGE_KEY } from '../config/constants.js';
import { StorageAdapter } from './StorageAdapter.js';

export function normalizeGameState(gameState) {
  if (!gameState || typeof gameState !== 'object') {
    return null;
  }

  const { elapsed, elapsedTime, ...rest } = gameState;

  return {
    ...rest,
    elapsedTime: typeof elapsedTime === 'number'
      ? elapsedTime
      : (typeof elapsed === 'number' ? elapsed : 0)
  };
}

/**
 * 保存当前游戏状态到 localStorage
 * @param {Object} gameState - 游戏状态对象
 * @param {number[][]} gameState.solution - 完整解（9x9 数组）
 * @param {number[][]} gameState.puzzle - 原始题目（9x9 数组，0 表示空格）
 * @param {boolean[][]} gameState.givenMask - 预填格子标记（9x9 布尔数组）
 * @param {number[][]} gameState.currentBoard - 当前用户棋盘（9x9 数组）
 * @param {number} gameState.elapsedTime - 已用时间（毫秒）
 * @param {string} gameState.difficulty - 难度级别
 * @param {boolean} gameState.isPaused - 暂停状态
 */
export function saveGameState(gameState) {
  try {
    const normalizedState = normalizeGameState(gameState);
    if (!normalizedState) {
      return;
    }

    const state = {
      ...normalizedState,
      savedAt: Date.now()
    };
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save game state:', error);
  }
}

/**
 * 从 localStorage 加载游戏状态
 * @returns {Object|null} 游戏状态对象，如果未找到则返回 null
 */
export function loadGameState() {
  try {
    const raw = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (!raw) return null;
    return normalizeGameState(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to load game state:', error);
    return null;
  }
}

/**
 * 清除保存的游戏状态
 */
export function clearGameState() {
  try {
    localStorage.removeItem(GAME_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear game state:', error);
  }
}

/**
 * 检查是否有保存的游戏状态
 * @returns {boolean} 是否存在保存的游戏状态
 */
export function hasSavedGameState() {
  return loadGameState() !== null;
}

/**
 * 游戏状态存储适配器
 */
class GameStateAdapter extends StorageAdapter {
  constructor() {
    super('GameStateAdapter');
  }

  async save(key, data) {
    if (key !== 'gameState') {
      throw new Error(`Unsupported key for game state adapter: ${key}`);
    }
    saveGameState(data || {});
    return true;
  }

  async load(key) {
    if (key !== 'gameState') {
      throw new Error(`Unsupported key for game state adapter: ${key}`);
    }
    return loadGameState();
  }

  async clear(key) {
    if (key !== 'gameState') {
      throw new Error(`Unsupported key for game state adapter: ${key}`);
    }
    clearGameState();
    return true;
  }
}

export const gameStateAdapter = new GameStateAdapter();
