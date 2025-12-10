/**
 * 事件监听器管理器 - 统一管理DOM事件监听器的添加和清理
 * @module utils/listener-manager
 */

/**
 * 监听器存储
 * @type {Map<string, Array<{element: Element, event: string, handler: Function, options?: AddEventListenerOptions}>>}
 */
const listeners = new Map();

/**
 * 生成唯一的监听器ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 添加事件监听器并记录
 * @param {Element} element - DOM元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @param {AddEventListenerOptions} [options] - 事件选项
 * @returns {string} 监听器ID
 * @example
 * const id = addListener(button, 'click', handleClick);
 * removeListener(id); // 使用ID移除
 */
export function addListener(element, event, handler, options) {
  const id = generateId();

  // 添加监听器
  element.addEventListener(event, handler, options);

  // 记录监听器
  const listenerData = {
    element,
    event,
    handler,
    options,
    id
  };

  if (!listeners.has(id)) {
    listeners.set(id, listenerData);
  }

  return id;
}

/**
 * 移除指定的事件监听器
 * @param {string} id - 监听器ID
 * @returns {boolean} 是否成功移除
 * @example
 * removeListener('listener_1234567890_abc123');
 */
export function removeListener(id) {
  const listenerData = listeners.get(id);
  if (!listenerData) {
    return false;
  }

  const { element, event, handler, options } = listenerData;

  // 移除监听器
  element.removeEventListener(event, handler, options);

  // 从记录中删除
  listeners.delete(id);

  return true;
}

/**
 * 为元素添加多个监听器
 * @param {Element} element - DOM元素
 * @param {Array<{event: string, handler: Function, options?: AddEventListenerOptions}>} events - 事件配置数组
 * @returns {string[]} 监听器ID数组
 * @example
 * const ids = addMultipleListeners(element, [
 *   { event: 'click', handler: handleClick },
 *   { event: 'mouseover', handler: handleHover }
 * ]);
 */
export function addMultipleListeners(element, events) {
  const ids = [];

  events.forEach(({ event, handler, options }) => {
    const id = addListener(element, event, handler, options);
    ids.push(id);
  });

  return ids;
}

/**
 * 移除多个监听器
 * @param {string[]} ids - 监听器ID数组
 * @example
 * removeMultipleListeners(['id1', 'id2', 'id3']);
 */
export function removeMultipleListeners(ids) {
  ids.forEach(id => removeListener(id));
}

/**
 * 移除元素的所有监听器
 * @param {Element} element - DOM元素
 * @returns {number} 移除的监听器数量
 * @example
 * const count = removeAllListeners(element);
 */
export function removeAllListeners(element) {
  let count = 0;

  // 找到该元素的所有监听器
  for (const [id, listenerData] of listeners) {
    if (listenerData.element === element) {
      removeListener(id);
      count++;
    }
  }

  return count;
}

/**
 * 清理所有监听器
 * @returns {number} 清理的监听器数量
 * @example
 * const count = clearAllListeners();
 */
export function clearAllListeners() {
  const count = listeners.size;
  listeners.clear();
  return count;
}

/**
 * 获取监听器信息（用于调试）
 * @param {string} [id] - 监听器ID，如果不提供则返回所有
 * @returns {Object|Array} 监听器信息
 */
export function getListenerInfo(id) {
  if (id) {
    const listenerData = listeners.get(id);
    if (listenerData) {
      return {
        id: listenerData.id,
        element: listenerData.element.tagName,
        event: listenerData.event
      };
    }
    return null;
  }

  // 返回所有监听器信息
  return Array.from(listeners.values()).map(data => ({
    id: data.id,
    element: data.element.tagName,
    event: data.event
  }));
}

/**
 * 创建一个自动清理的监听器组
 * @param {string} groupName - 组名
 * @returns {Object} 监听器组对象
 * @example
 * const group = createListenerGroup('gameControls');
 * group.add(button, 'click', handler);
 * group.clear(); // 清理组内所有监听器
 */
export function createListenerGroup(groupName) {
  const groupIds = new Set();

  return {
    add(element, event, handler, options) {
      const id = addListener(element, event, handler, options);
      groupIds.add(id);
      return id;
    },

    remove(id) {
      const success = removeListener(id);
      if (success) {
        groupIds.delete(id);
      }
      return success;
    },

    clear() {
      removeMultipleListeners(Array.from(groupIds));
      groupIds.clear();
    },

    size() {
      return groupIds.size;
    }
  };
}