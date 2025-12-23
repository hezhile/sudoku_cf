/**
 * 数独游戏配置常量
 * @module config/constants
 */

/**
 * 难度与挖空数量映射
 * @type {Object.<string, number>}
 */
export const DIFFICULTY_HOLES = {
  easy: 36,      // 简单：36个空格
  medium: 46,    // 中等：46个空格
  hard: 52,      // 困难：52个空格
  expert: 58     // 专家：58个空格
};


/**
 * localStorage 存储键
 * @type {string}
 */
export const STORAGE_KEY = 'sudoku_records_v1';

/**
 * 游戏状态存储键
 * @type {string}
 */
export const GAME_STATE_STORAGE_KEY = 'sudoku_game_state_v1';

/**
 * Supabase 配置
 * @type {Object}
 */
export const SUPABASE_CONFIG = {
  url: 'https://ywzcvxypjgazdataefbq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3emN2eHlwamdhemRhdGFlZmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNjg0MDksImV4cCI6MjA3MTk0NDQwOX0.rRrJ1Sjat2rDu0yoIOgEHs0ZrR5hO4b6k38he57uY68'
};

/**
 * 计时器更新间隔（毫秒）
 * @type {number}
 */
export const TIMER_UPDATE_INTERVAL = 100;

/**
 * 棋盘大小
 * @type {number}
 */
export const GRID_SIZE = 9;

/**
 * 宫格大小
 * @type {number}
 */
export const BLOCK_SIZE = 3;

/**
 * Toast 默认显示时长（毫秒）
 * @type {number}
 */
export const TOAST_DURATION = 3000;
