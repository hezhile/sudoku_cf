/**
 * 应用事件常量集合
 * 所有事件名称在此管理，避免硬编码字符串
 * @module config/events
 */

/**
 * 事件常量枚举
 * @readonly
 * @enum {string}
 */
export const EVENTS = {
  // ========== 游戏事件 ==========
  /** 新游戏开始 */
  GAME_NEW: 'game:new',
  /** 游戏重置 */
  GAME_RESET: 'game:reset',
  GAME_PAUSE_REQUEST: 'game:pause:request',
  GAME_RESUME_REQUEST: 'game:resume:request',
  /** 游戏已启动（棋盘已生成） */
  GAME_STARTED: 'game:started',
  /** 游戏完成 */
  GAME_COMPLETED: 'game:completed',
  /** 游戏失败（答案错误） */
  GAME_FAILED: 'game:failed',
  /** 游戏暂停 */
  GAME_PAUSED: 'game:paused',
  /** 游戏恢复 */
  GAME_RESUMED: 'game:resumed',
  /** 游戏状态已保存 */
  GAME_STATE_SAVED: 'game:state:saved',
  /** 游戏状态已恢复 */
  GAME_STATE_RESTORED: 'game:state:restored',

  // ========== 棋盘事件 ==========
  /** 棋盘发生改变 */
  BOARD_CHANGED: 'board:changed',
  /** 棋盘已完成 */
  BOARD_COMPLETE: 'board:complete',
  /** 单元格输入 */
  CELL_INPUT: 'cell:input',
  /** 单元格获得焦点 */
  CELL_FOCUS: 'cell:focus',

  // ========== 计时器事件 ==========
  /** 计时器已启动 */
  TIMER_STARTED: 'timer:started',
  /** 计时器已停止 */
  TIMER_STOPPED: 'timer:stopped',
  /** 计时器已暂停 */
  TIMER_PAUSED: 'timer:paused',
  /** 计时器已重置 */
  TIMER_RESET: 'timer:reset',
  /** 计时器计时脉冲（周期性） */
  TIMER_TICK: 'timer:tick',

  // ========== 控件事件 ==========
  /** 难度变化 */
  DIFFICULTY_CHANGED: 'difficulty:changed',
  /** 清空记录请求 */
  RECORDS_CLEAR: 'records:clear',
  /** 记录已清空 */
  RECORDS_CLEARED: 'records:cleared',
  /** 记录已保存（批量） */
  RECORDS_SAVED: 'records:saved',
  /** 记录已导入 */
  RECORDS_IMPORTED: 'records:imported',

  // ========== 存储事件 ==========
  /** 记录已保存 */
  RECORD_SAVED: 'record:saved',
  /** 存储错误 */
  STORAGE_ERROR: 'storage:error',
  /** 存储空间已满 */
  STORAGE_QUOTA_EXCEEDED: 'storage:quota-exceeded',
  /** 同步已完成 */
  SYNC_COMPLETED: 'sync:completed',
  /** 同步失败 */
  SYNC_FAILED: 'sync:failed',
  /** 手动触发同步 */
  SYNC_MANUAL_TRIGGER: 'sync:manual-trigger',
  /** 魔法链接已发送 */
  AUTH_MAGIC_LINK_SENT: 'auth:magic-link-sent',

  // ========== 认证事件 ==========
  /** 用户已登录 */
  AUTH_LOGIN: 'auth:login',
  /** 用户已登出 */
  AUTH_LOGOUT: 'auth:logout',
  /** 认证会话已改变 */
  AUTH_SESSION_CHANGED: 'auth:session-changed',
  /** 认证错误 */
  AUTH_ERROR: 'auth:error',

  // ========== 错误事件 ==========
  /** 棋盘生成错误 */
  ERROR_GENERATION: 'error:generation',
  /** 验证错误 */
  ERROR_VALIDATION: 'error:validation',
  /** 存储错误 */
  ERROR_STORAGE: 'error:storage',
  /** 网络错误 */
  ERROR_NETWORK: 'error:network'
};
