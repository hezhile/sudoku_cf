/**
 * 游戏运行时状态管理器
 * 将主流程中的全局状态集中管理，降低耦合
 * @module core/game-state-manager
 */

class GameStateManager {
  constructor() {
    this.reset();
  }

  /**
   * 重置运行时状态
   */
  reset() {
    this.solution = null;
    this.puzzle = null;
    this.givenMask = null;
    this.lastSaveTime = 0;
  }

  /**
   * 更新棋局核心数据
   * @param {Object} state
   * @param {number[][]|null} [state.solution]
   * @param {number[][]|null} [state.puzzle]
   * @param {boolean[][]|null} [state.givenMask]
   */
  setGame({ solution, puzzle, givenMask }) {
    if (typeof solution !== 'undefined') {
      this.solution = solution;
    }
    if (typeof puzzle !== 'undefined') {
      this.puzzle = puzzle;
    }
    if (typeof givenMask !== 'undefined') {
      this.givenMask = givenMask;
    }
  }

  /**
   * 记录最近自动保存时间
   * @param {number} timestamp
   */
  setLastSaveTime(timestamp) {
    this.lastSaveTime = timestamp;
  }

  /**
   * 获取快照（只读视图）
   * @returns {{solution:number[][]|null,puzzle:number[][]|null,givenMask:boolean[][]|null,lastSaveTime:number}}
   */
  getSnapshot() {
    return {
      solution: this.solution,
      puzzle: this.puzzle,
      givenMask: this.givenMask,
      lastSaveTime: this.lastSaveTime
    };
  }
}

export const gameStateManager = new GameStateManager();
