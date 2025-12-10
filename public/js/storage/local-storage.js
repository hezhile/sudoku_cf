/**
 * 本地存储模块 - localStorage 抽象层
 * @module storage/local-storage
 */

import { STORAGE_KEY } from '../config/constants.js';
import { emit } from '../utils/event-bus.js';
import { safeJSONParse, safeJSONStringify } from '../utils/helpers.js';
import { showWarning, showError } from '../ui/toast.js';

// 获取全局i18n实例
const getI18n = () => window.i18n;

/**
 * 加载记录
 * @returns {Object} 记录对象
 * @example
 * const records = loadRecords();
 * // { easy: { best: 123456, history: [...] }, ... }
 */
export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const records = safeJSONParse(raw, {});
    return migrateOldFormat(records);
  } catch (error) {
    // 处理隐私模式或localStorage不可用的情况
    if (error.name === 'SecurityError' || error.name === 'TypeError') {
      console.warn('localStorage is not available (privacy mode), returning empty records');
      return {};
    }
    console.error('加载记录失败:', error);
    emit('storage:error', { error, operation: 'load' });
    return {};
  }
}

/**
 * 保存记录
 * @param {Object} records - 记录对象
 * @example
 * saveRecords(records);
 */
export function saveRecords(records) {
  try {
    const json = safeJSONStringify(records, '{}');
    localStorage.setItem(STORAGE_KEY, json);
    emit('records:saved', { records });
  } catch (error) {
    // 处理隐私模式或localStorage不可用的情况
    if (error.name === 'SecurityError' || error.name === 'TypeError') {
      console.warn('localStorage is not available (privacy mode), records will not be saved');
      // 在隐私模式下，仍然触发事件以保持应用正常运行
      emit('records:saved', { records });
      return;
    }
    console.error('保存记录失败:', error);

    if (error.name === 'QuotaExceededError') {
      emit('storage:quota-exceeded', { error });
      showWarning(getI18n().t('errors.storageFull'));
    } else {
      emit('storage:error', { error, operation: 'save' });
      showError(getI18n().t('errors.saveFailed'));
    }
  }
}

/**
 * 保存单条记录
 * @param {string} difficulty - 难度级别
 * @param {number} timeMs - 用时（毫秒）
 * @returns {Promise<void>}
 * @example
 * await saveRecord('medium', 123456);
 */
export async function saveRecord(difficulty, timeMs) {
  try {
    const rec = loadRecords();

    if (!rec[difficulty]) {
      rec[difficulty] = { best: null, history: [] };
    }

    // 添加新记录，默认未同步
    const newRecord = {
      time: timeMs,
      at: Date.now(),
      synced: false
    };

    rec[difficulty].history.push(newRecord);

    // 更新最佳时间
    const isBest = !rec[difficulty].best || timeMs < rec[difficulty].best;
    if (isBest) {
      rec[difficulty].best = timeMs;
    }

    saveRecords(rec);

    emit('record:saved', {
      difficulty,
      time: timeMs,
      isBest
    });
  } catch (error) {
    console.error('保存记录失败:', error);
    emit('storage:error', { error, operation: 'saveRecord' });
  }
}

/**
 * 清除所有记录
 * @example
 * clearRecords();
 */
export function clearRecords() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    emit('records:cleared');
  } catch (error) {
    // 处理隐私模式或localStorage不可用的情况
    if (error.name === 'SecurityError' || error.name === 'TypeError') {
      console.warn('localStorage is not available (privacy mode), no records to clear');
      emit('records:cleared');
      return;
    }
    console.error('清除记录失败:', error);
    emit('storage:error', { error, operation: 'clear' });
  }
}

/**
 * 获取最佳时间
 * @param {string} difficulty - 难度级别
 * @returns {number|null} 最佳时间（毫秒）
 * @example
 * const bestTime = getBestTime('medium');
 */
export function getBestTime(difficulty) {
  const records = loadRecords();
  return records[difficulty]?.best || null;
}

/**
 * 获取历史记录
 * @param {string} difficulty - 难度级别
 * @returns {Array} 历史记录列表
 * @example
 * const history = getRecordHistory('medium');
 */
export function getRecordHistory(difficulty) {
  const records = loadRecords();
  return records[difficulty]?.history || [];
}

/**
 * 获取最近一次记录
 * @param {string} difficulty - 难度级别
 * @returns {Object|null} 最近记录
 * @example
 * const last = getLastRecord('medium');
 */
export function getLastRecord(difficulty) {
  const history = getRecordHistory(difficulty);
  return history.length > 0 ? history[history.length - 1] : null;
}

/**
 * 获取所有难度的统计信息
 * @returns {Object} 统计信息
 * @example
 * const stats = getAllStats();
 * // { easy: { best: 123, count: 10 }, ... }
 */
export function getAllStats() {
  const records = loadRecords();
  const stats = {};

  ['easy', 'medium', 'hard', 'expert'].forEach(diff => {
    const data = records[diff];
    stats[diff] = {
      best: data?.best || null,
      count: data?.history?.length || 0,
      lastTime: data?.history?.length > 0 ?
        data.history[data.history.length - 1].time : null
    };
  });

  return stats;
}

/**
 * 迁移旧格式数据（向后兼容）
 * @param {Object} records - 记录对象
 * @returns {Object} 迁移后的记录
 */
function migrateOldFormat(records) {
  if (!records || typeof records !== 'object') {
    return {};
  }

  let migrated = false;

  // 为旧记录添加 synced 标记
  Object.keys(records).forEach(diff => {
    if (records[diff]?.history && Array.isArray(records[diff].history)) {
      records[diff].history = records[diff].history.map(r => {
        if (typeof r === 'object' && r !== null && !('synced' in r)) {
          migrated = true;
          return {
            ...r,
            synced: false  // 默认未同步
          };
        }
        return r;
      });
    }
  });

  // 如果进行了迁移，保存更新后的格式
  if (migrated) {
    saveRecords(records);
  }

  return records;
}

/**
 * 获取未同步的记录
 * @returns {Array<{difficulty: string, record: Object}>} 未同步记录列表
 * @example
 * const unsynced = getUnsyncedRecords();
 */
export function getUnsyncedRecords() {
  const records = loadRecords();
  const unsynced = [];

  ['easy', 'medium', 'hard', 'expert'].forEach(diff => {
    const history = records[diff]?.history || [];
    history.forEach(record => {
      if (!record.synced) {
        unsynced.push({ difficulty: diff, record });
      }
    });
  });

  return unsynced;
}

/**
 * 标记记录为已同步
 * @param {string} difficulty - 难度级别
 * @param {number} timestamp - 记录时间戳
 * @example
 * markRecordAsSynced('medium', 1234567890000);
 */
export function markRecordAsSynced(difficulty, timestamp) {
  const records = loadRecords();

  if (records[difficulty]?.history) {
    records[difficulty].history = records[difficulty].history.map(r => {
      if (r.at === timestamp) {
        return { ...r, synced: true };
      }
      return r;
    });

    saveRecords(records);
  }
}

/**
 * 标记所有未同步记录为已同步
 * @example
 * markAllAsSynced();
 */
export function markAllAsSynced() {
  const records = loadRecords();
  let updated = false;

  Object.keys(records).forEach(diff => {
    if (records[diff]?.history) {
      records[diff].history = records[diff].history.map(r => {
        if (!r.synced) {
          updated = true;
          return { ...r, synced: true };
        }
        return r;
      });
    }
  });

  if (updated) {
    saveRecords(records);
  }
}

/**
 * 导出记录为 JSON（用于备份）
 * @returns {string} JSON 字符串
 * @example
 * const json = exportRecords();
 * // 可以下载或复制
 */
export function exportRecords() {
  const records = loadRecords();
  return safeJSONStringify(records, '{}');
}

/**
 * 导入记录（用于恢复备份）
 * @param {string} jsonString - JSON 字符串
 * @returns {boolean} 是否成功
 * @example
 * const success = importRecords(jsonString);
 */
export function importRecords(jsonString) {
  try {
    const records = safeJSONParse(jsonString, null);
    if (!records) {
      showError(getI18n().t('errors.invalidData'));
      return false;
    }

    saveRecords(records);
    emit('records:imported', { records });
    return true;
  } catch (error) {
    console.error('导入记录失败:', error);
    showError(getI18n().t('errors.importFailed') + error.message);
    return false;
  }
}
