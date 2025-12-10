/**
 * 云端同步模块 - Supabase 数据同步
 * @module storage/supabase-sync
 */

import { getSupabaseClient, getCurrentSession } from '../auth/auth-handler.js';
import { loadRecords, saveRecords, getUnsyncedRecords, markAllAsSynced } from './local-storage.js';
import { emit } from '../utils/event-bus.js';
import { showSuccess, showError, showWarning } from '../ui/toast.js';

// 获取全局i18n实例
const getI18n = () => window.i18n;

/**
 * 上传单条记录到 Supabase
 * @param {string} userId - 用户 ID
 * @param {string} difficulty - 难度级别
 * @param {Object} record - 记录对象 { time, at, synced }
 * @returns {Promise<boolean>} 是否成功
 * @example
 * await uploadSingleRecord(userId, 'medium', { time: 123456, at: Date.now() });
 */
export async function uploadSingleRecord(userId, difficulty, record) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase 客户端未初始化');
    return false;
  }

  try {
    const { error } = await supabase.from('games').insert([{
      user_id: userId,
      difficulty: difficulty,
      duration_ms: record.time,
      created_at: new Date(record.at).toISOString(),
      success: true
    }]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('上传单条记录失败:', error);
    return false;
  }
}

/**
 * 同步本地记录到 Supabase
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 * @example
 * await syncLocalRecordsToSupabase(userId);
 */
export async function syncLocalRecordsToSupabase(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase 客户端未初始化');
    emit('sync:failed', { reason: 'client_not_initialized' });
    return;
  }

  try {
    const records = loadRecords();
    const rowsToInsert = [];

    // 收集所有未同步的记录
    for (const diff of ['easy', 'medium', 'hard', 'expert']) {
      const obj = records[diff];
      if (!obj || !obj.history || obj.history.length === 0) continue;

      for (const h of obj.history) {
        if (!h.synced) {
          rowsToInsert.push({
            user_id: userId,
            difficulty: diff,
            duration_ms: h.time,
            created_at: new Date(h.at).toISOString(),
            success: true
          });
        }
      }
    }

    if (rowsToInsert.length === 0) {
      emit('sync:completed', { count: 0 });
      return;
    }

    // 批量插入未同步的记录
    const { error: insertError } = await supabase.from('games').insert(rowsToInsert);
    if (insertError) {
      throw insertError;
    }

    // 标记所有记录为已同步
    markAllAsSynced();

    // 更新 best_scores
    await updateBestScores(userId, records);

    showSuccess(getI18n().t('buttons.synced', { count: rowsToInsert.length }));
    emit('sync:completed', { count: rowsToInsert.length });
  } catch (error) {
    console.error('同步失败:', error);
    showWarning(getI18n().t('errors.syncFailed'));
    emit('sync:failed', { error });
  }
}

/**
 * 更新 best_scores 表
 * @param {string} userId - 用户 ID
 * @param {Object} records - 本地记录对象
 * @returns {Promise<void>}
 */
async function updateBestScores(userId, records) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  for (const diff of ['easy', 'medium', 'hard', 'expert']) {
    const obj = records[diff];
    if (!obj || !obj.history || obj.history.length === 0) continue;

    const localBest = obj.best;
    if (!localBest) continue;

    try {
      // 读取远端当前 best
      const { data: existing, error: selErr } = await supabase
        .from('best_scores')
        .select('best_duration_ms')
        .eq('user_id', userId)
        .eq('difficulty', diff)
        .single();

      if (selErr && selErr.code !== 'PGRST116') {
        console.warn('读取远端 best 失败:', selErr);
        continue;
      }

      let shouldUpsert = false;
      if (!existing) {
        shouldUpsert = true;
      } else if (localBest < existing.best_duration_ms) {
        shouldUpsert = true;
      }

      if (shouldUpsert) {
        const { error: upErr } = await supabase.from('best_scores').upsert({
          user_id: userId,
          difficulty: diff,
          best_duration_ms: localBest,
          achieved_at: new Date().toISOString()
        }, { onConflict: ['user_id', 'difficulty'] });

        if (upErr) {
          console.warn('更新 best 失败:', upErr);
        }
      }
    } catch (error) {
      console.warn(`处理 ${diff} 最佳成绩时出错:`, error);
    }
  }
}

/**
 * 初始化同步模块（注册事件监听器）
 */
export function initSyncModule() {
  // 监听登录事件，自动同步
  import('../utils/event-bus.js').then(({ on }) => {
    on('auth:login', async ({ user }) => {
      await syncLocalRecordsToSupabase(user.id);
    });

    on('sync:manual-trigger', async ({ userId }) => {
      await syncLocalRecordsToSupabase(userId);
    });
  });
}

/**
 * 在游戏完成时立即上传记录（如果已登录）
 * @param {string} difficulty - 难度级别
 * @param {Object} record - 记录对象
 * @returns {Promise<boolean>} 是否成功
 */
export async function uploadRecordOnComplete(difficulty, record) {
  const session = await getCurrentSession();
  if (!session) {
    return false;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  try {
    // 上传记录
    const success = await uploadSingleRecord(session.user.id, difficulty, record);
    if (!success) {
      return false;
    }

    // 更新 best_scores
    const records = loadRecords();
    const localBest = records[difficulty]?.best;

    if (localBest) {
      const { data: existing } = await supabase
        .from('best_scores')
        .select('best_duration_ms')
        .eq('user_id', session.user.id)
        .eq('difficulty', difficulty)
        .single();

      if (!existing || record.time < existing.best_duration_ms) {
        await supabase.from('best_scores').upsert({
          user_id: session.user.id,
          difficulty,
          best_duration_ms: record.time,
          achieved_at: new Date().toISOString()
        }, { onConflict: ['user_id', 'difficulty'] });
      }
    }

    return true;
  } catch (error) {
    console.error('即时上传失败:', error);
    return false;
  }
}
