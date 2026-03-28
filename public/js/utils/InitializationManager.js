/**
 * 初始化状态管理器
 * 统一管理模块初始化状态，避免散落的 window._xxxInitialized 标记
 * @module utils/InitializationManager
 */

class InitializationManager {
  constructor() {
    this.initializedModules = new Set();
  }

  /**
   * 检查模块是否已初始化
   * @param {string} moduleName - 模块名
   * @returns {boolean}
   */
  isInitialized(moduleName) {
    return this.initializedModules.has(moduleName);
  }

  /**
   * 标记模块已初始化
   * @param {string} moduleName - 模块名
   */
  markInitialized(moduleName) {
    this.initializedModules.add(moduleName);
  }

  /**
   * 重置模块初始化状态
   * @param {string} moduleName - 模块名（可选，不传则重置全部）
   */
  reset(moduleName) {
    if (moduleName) {
      this.initializedModules.delete(moduleName);
      return;
    }
    this.initializedModules.clear();
  }
}

export const initializationManager = new InitializationManager();
