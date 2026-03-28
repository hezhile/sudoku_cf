/**
 * 事件总线 - 模块间通信的核心
 * @module utils/event-bus
 */

import { EVENTS } from '../config/events.js';

/**
 * 事件处理器存储
 * @type {Object.<string, Function[]>}
 */
const events = {};

/**
 * 全局状态存储
 * @type {Object.<string, any>}
 */
const globalState = {
  isResetting: false,
  isPaused: false
};

/**
 * 订阅事件
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @example
 * on('game:new', (data) => console.log('New game:', data));
 */
export function on(event, handler) {
  if (!events[event]) {
    events[event] = [];
  }
  // 检查是否已经注册了这个处理器
  if (!events[event].includes(handler)) {
    events[event].push(handler);
    console.log(`Registered handler for event '${event}', total handlers: ${events[event].length}`);
  } else {
    console.warn(`Handler already registered for event '${event}', skipping duplicate`);
  }
}

/**
 * 取消订阅事件
 * @param {string} event - 事件名称
 * @param {Function} handler - 要移除的处理函数
 * @example
 * off('game:new', handleNewGame);
 */
export function off(event, handler) {
  if (events[event]) {
    events[event] = events[event].filter(h => h !== handler);
  }
}

/**
 * 触发事件
 * @param {string} event - 事件名称
 * @param {*} data - 事件数据
 * @example
 * emit('game:completed', { difficulty: 'medium', time: 123456 });
 */
export function emit(event, data) {
  if (events[event]) {
    console.log(`Emitting event '${event}' with ${events[event].length} handlers`);
    events[event].forEach((handler, index) => {
      try {
        console.log(`Calling handler ${index} for event '${event}'`);
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    });
  }
}

/**
 * 订阅事件（仅触发一次）
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @example
 * once('game:started', () => console.log('Game started (once)'));
 */
export function once(event, handler) {
  const onceHandler = (data) => {
    handler(data);
    off(event, onceHandler);
  };
  on(event, onceHandler);
}

/**
 * 清除某个事件的所有处理器
 * @param {string} event - 事件名称
 */
export function clear(event) {
  if (events[event]) {
    delete events[event];
  }
}

/**
 * 清除所有事件处理器
 */
export function clearAll() {
  for (const event in events) {
    delete events[event];
  }
}

/**
 * 获取已注册的事件列表（用于调试）
 * @returns {string[]} 事件名称列表
 */
export function getEventList() {
  return Object.keys(events);
}

/**
 * 获取某个事件的处理器数量（用于调试）
 * @param {string} event - 事件名称
 * @returns {number} 处理器数量
 */
export function getHandlerCount(event) {
  return events[event] ? events[event].length : 0;
}

/**
 * 设置全局状态
 * @param {string} key - 状态键
 * @param {any} value - 状态值
 * @example
 * setGlobalState('isResetting', true);
 */
export function setGlobalState(key, value) {
  globalState[key] = value;
}

/**
 * 获取全局状态
 * @param {string} key - 状态键
 * @returns {any} 状态值
 * @example
 * const isResetting = getGlobalState('isResetting');
 */
export function getGlobalState(key) {
  return globalState[key];
}

/**
 * 事件列表（用于文档和调试）
 * @readonly
 * @enum {string}
 */
export const EventTypes = EVENTS;
