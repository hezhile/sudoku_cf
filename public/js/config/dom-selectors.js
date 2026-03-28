/**
 * DOM 选择器常量集合
 * 所有 DOM 元素的选择器在此管理，便于维护和重构
 * @module config/dom-selectors
 */

/**
 * DOM 选择器枚举
 * @readonly
 * @enum {string}
 */
export const DOM_SELECTORS = {
  // ========== 主容器 ==========
  MAIN_CONTAINER: '.main-container',
  
  // ========== 语言选择 ==========
  LANGUAGE_SELECTOR: '#language-selector',
  
  // ========== 登录区域 ==========
  LOGIN_AREA: '#loginArea',
  EMAIL_INPUT: '#emailInput',
  LOGIN_BTN: '#loginBtn',
  USER_INFO: '#userInfo',
  LOGOUT_BTN: '#logoutBtn',
  
  // ========== 游戏控制 ==========
  DIFFICULTY_SELECT: '#difficulty',
  NEW_GAME_BTN: '#newBtn',
  RESET_BTN: '#resetBtn',
  PAUSE_BTN: '#pauseBtn',
  
  // ========== 计时器 ==========
  TIMER_AREA: '#timerArea',
  TIMER_DISPLAY: '#timer',
  
  // ========== 棋盘 ==========
  BOARD_WRAPPER: '.board-wrapper',
  BOARD: '#board',
  CELL: '.cell',
  CELL_INPUT: '.cell-input',
  
  // ========== 记录 ==========
  RECORDS_CONTAINER: '#records',
  RECORD_HEADER: '.record-header',
  SYNC_BTN: '#syncBtn',
  CLEAR_RECORDS_BTN: '#clearRecords',
  RECORDS_LIST: '#recordsList',
  
  // ========== 其他 ==========
  CHANGELOG: '.changelog-details',
  GAME_COUNTER_SECTION: '.game-counter-section',
  GAME_COUNTER_VALUE: '#game-counter',
  
  // ========== 暂停覆盖层 ==========
  PAUSE_OVERLAY: '#pauseOverlay',
  PAUSE_OVERLAY_CONTENT: '.pause-overlay-content',
  RESUME_BTN: '#resumeBtn'
};

/**
 * 获取 DOM 元素，带性能优化（缓存）
 * @type {Map<string, HTMLElement>}
 */
const elementCache = new Map();

/**
 * 获取 DOM 元素（支持缓存）
 * @param {string} selector - DOM 选择器
 * @param {boolean} cache - 是否缓存此元素（默认 false）
 * @returns {HTMLElement|null} DOM 元素或 null
 * @example
 * const board = getElement(DOM_SELECTORS.BOARD, true);
 */
export function getElement(selector, cache = false) {
  if (cache && elementCache.has(selector)) {
    return elementCache.get(selector);
  }
  
  const element = document.querySelector(selector);
  
  if (cache && element) {
    elementCache.set(selector, element);
  }
  
  return element;
}

/**
 * 获取多个 DOM 元素
 * @param {string} selector - DOM 选择器
 * @returns {NodeList} DOM 元素列表
 * @example
 * const cells = getElements(DOM_SELECTORS.CELL);
 */
export function getElements(selector) {
  return document.querySelectorAll(selector);
}

/**
 * 清除 DOM 元素缓存
 * @param {string} selector - 要清除的选择器，如果为空则清除全部
 * @example
 * clearElementCache(DOM_SELECTORS.BOARD);
 */
export function clearElementCache(selector = null) {
  if (selector) {
    elementCache.delete(selector);
  } else {
    elementCache.clear();
  }
}
