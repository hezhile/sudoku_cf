/**
 * 数独游戏主入口
 * @module main
 */

// 核心模块
import { generateFullBoard, digHolesFromSolution } from './core/sudoku-engine.js';
import { digHolesWithValidation } from './core/solver.js';
import { validateSolution } from './core/validator.js';

// UI 模块
import { initBoardRenderer, renderBoard, readUserBoard } from './ui/board-renderer.js';
import { initTimer, startTimer, stopTimer, resetTimer, getElapsedTime, setTimerDisplay } from './ui/timer.js';
import { showSuccess, showError, showWarning, showToast } from './ui/toast.js';
import { initializeControls, getDifficulty, setLoading } from './ui/controls.js';

// 存储模块
import { saveRecord, loadRecords, getAllStats, clearRecords } from './storage/local-storage.js';
import { initSyncModule, uploadRecordOnComplete } from './storage/supabase-sync.js';

// 认证模块
import { initAuth } from './auth/auth-handler.js';

// 工具模块
import { on, emit } from './utils/event-bus.js';
import { formatTime } from './utils/helpers.js';

// 配置
import { DIFFICULTY_HOLES, DIFFICULTY_LABELS } from './config/constants.js';

// 获取全局i18n实例（将在初始化后设置）
let i18n = null;

/**
 * 游戏状态
 */
let solution = null;      // 完整解（9x9 数组）
let puzzle = null;        // 题目（带空格的 9x9）
let givenMask = null;     // 9x9 布尔，true 表示预填（不可编辑）

/**
 * 应用初始化
 */
async function init() {
  try {
    // 初始化多语言系统（优先初始化）
    await initializeI18n();

    // 设置全局i18n引用
    i18n = window.i18n;

    // 初始化各个模块
    initBoardRenderer('#board');
    initTimer('#timer');
    initializeControls();
    initSyncModule();

    // 初始化认证（异步）
    await initAuth();

    // 注册事件处理器
    registerEventHandlers();

    // 渲染初始状态
    renderEmptyBoard();
    renderRecords();
  } catch (error) {
    console.error('初始化失败:', error);
    if (i18n) {
      showError(i18n.t('errors.authFailed'));
    }
  }
}

/**
 * 注册事件处理器
 */
function registerEventHandlers() {
  // 游戏事件
  on('game:new', handleNewGame);
  on('game:reset', handleReset);
  on('board:complete', handleBoardComplete);

  // 记录事件
  on('records:clear', handleClearRecords);

  // 认证事件（可选的额外处理）
  on('auth:login', ({ user }) => {
    showSuccess(i18n.t('welcome', { email: user.email }));
  });

  // 同步事件
  on('sync:failed', ({ error }) => {
    console.warn('同步失败:', error);
  });
}

/**
 * 渲染空棋盘
 */
function renderEmptyBoard() {
  const emptyBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
  const emptyMask = Array.from({ length: 9 }, () => Array(9).fill(false));
  renderBoard(emptyBoard, emptyMask);
}

/**
 * 处理新游戏
 */
async function handleNewGame() {
  try {
    setLoading(true);
    stopTimer();
    setTimerDisplay(i18n.t('buttons.generating'));

    // 延迟让 UI 更新
    await new Promise(r => setTimeout(r, 100));

    const difficulty = getDifficulty();
    const holesTarget = DIFFICULTY_HOLES[difficulty];

    // 生成完整解
    solution = generateFullBoard();

    // 挖空并验证唯一性
    puzzle = digHolesWithValidation(solution, holesTarget);

    // 创建 givenMask（标记预填格子）
    givenMask = puzzle.map(row => row.map(cell => cell !== 0));

    // 渲染棋盘
    renderBoard(puzzle, givenMask);

    // 启动计时器
    resetTimer();
    startTimer();

    setLoading(false);
    showSuccess(i18n.t('puzzleGenerated', { difficulty: i18n.t(`difficulty.${difficulty}`) }));
    emit('game:started', { difficulty });
  } catch (error) {
    console.error('生成失败:', error);
    showError(i18n.t('errors.generationFailed'));
    setLoading(false);
    emit('error:generation', { error });
  }
}

/**
 * 处理重置
 */
function handleReset() {
  console.log('handleReset called, puzzle exists:', !!puzzle);
  if (!puzzle) {
    showWarning(i18n.t('errors.pleaseGenerate'));
    return;
  }

  // 防止重复重置
  if (window._isResetting) {
    console.log('Reset already in progress, ignoring');
    return;
  }

  window._isResetting = true;
  console.log('Resetting game...');
  stopTimer();
  console.log('Timer stopped');
  renderBoard(puzzle, givenMask);
  console.log('Board rendered');
  resetTimer();
  console.log('Timer reset');
  startTimer();
  console.log('Timer started');

  // 延迟显示toast，确保其他操作完成
  setTimeout(() => {
    console.log('Showing reset toast');
    showToast(i18n.t('status.gameReset'), 'info');
    window._isResetting = false;
  }, 100);

  console.log('Reset complete');
}

/**
 * 初始化多语言系统
 */
async function initializeI18n() {
  try {
    // 使用全局的 i18n 实例
    const globalI18n = window.i18n;
    console.log('Initializing i18n, current language:', globalI18n.currentLang);

    // 加载当前语言的翻译
    await globalI18n.loadTranslations(globalI18n.currentLang);
    console.log('Loaded translations:', Object.keys(globalI18n.translations));

    // 更新DOM中的翻译
    globalI18n.updateDOM();

    // 设置语言选择器的当前值
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
      languageSelector.value = globalI18n.currentLang;

      // 移除旧的事件监听器（如果存在）
      if (languageSelector._i18nChangeHandler) {
        languageSelector.removeEventListener('change', languageSelector._i18nChangeHandler);
      }

      // 创建新的事件处理函数并保存引用
      languageSelector._i18nChangeHandler = async (e) => {
        const newLang = e.target.value;
        console.log('Language changed to:', newLang);
        await globalI18n.setLanguage(newLang);
      };

      // 监听语言切换事件
      languageSelector.addEventListener('change', languageSelector._i18nChangeHandler);
    }

    // 移除旧的语言变更事件监听器（如果存在）
    if (window._i18nLanguageChangedHandler) {
      window.removeEventListener('languageChanged', window._i18nLanguageChangedHandler);
    }

    // 创建新的事件处理函数并保存引用
    window._i18nLanguageChangedHandler = (e) => {
      console.log('Language changed event received:', e.detail);
      // 重新渲染记录（包含翻译的文本）
      renderRecords();
    };

    // 监听语言变更事件，更新需要动态翻译的内容
    window.addEventListener('languageChanged', window._i18nLanguageChangedHandler);
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  }
}

/**
 * 处理棋盘完成
 */
async function handleBoardComplete() {
  console.log('handleBoardComplete called');
  if (!solution) {
    console.log('No solution, showing error');
    showError(i18n.t('errors.gameNotStarted'));
    return;
  }

  const userBoard = readUserBoard();
  console.log('Validating solution...');

  // 验证解答
  const { isCorrect, errors } = validateSolution(userBoard, solution);
  console.log('Validation result:', isCorrect, errors);

  if (isCorrect) {
    // 停止计时器
    stopTimer();
    const elapsed = getElapsedTime();
    const difficulty = getDifficulty();

    // 保存记录到本地
    const record = {
      time: elapsed,
      at: Date.now(),
      synced: false
    };
    await saveRecord(difficulty, elapsed);

    // 尝试即时上传到云端（如果已登录）
    const uploaded = await uploadRecordOnComplete(difficulty, record);
    if (uploaded) {
      // 更新 synced 标记
      const records = loadRecords();
      if (records[difficulty]?.history?.length > 0) {
        const lastRecord = records[difficulty].history[records[difficulty].history.length - 1];
        lastRecord.synced = true;
        // 保存更新后的记录
        import('./storage/local-storage.js').then(({ saveRecords }) => {
          saveRecords(records);
        });
      }
    }

    // 刷新记录显示
    renderRecords();

    // 显示成功消息
    showSuccess(i18n.t('gameComplete', { time: formatTime(elapsed) }));

    emit('game:completed', {
      difficulty,
      elapsed,
      uploaded
    });
  } else {
    showError(i18n.t('errors.incorrectAnswer'));
    emit('game:failed', { errors });
  }
}

/**
 * 处理清除记录
 */
function handleClearRecords() {
  renderRecords();
  showToast(i18n.t('status.recordsCleared'), 'info');
}

/**
 * 渲染记录
 */
function renderRecords() {
  const stats = getAllStats();
  const recordsList = document.getElementById('recordsList');

  if (!recordsList) return;

  const html = ['easy', 'medium', 'hard', 'expert'].map(diff => {
    const stat = stats[diff];
    const bestStr = stat.best ? formatTime(stat.best) : '—';
    const lastStr = stat.lastTime ? formatTime(stat.lastTime) : '—';
    const label = DIFFICULTY_LABELS[diff];

    return `
      <div class="record-row">
        <div>${label} <span class="small">（最近：${lastStr}）</span></div>
        <div>最好：${bestStr}</div>
      </div>
    `;
  }).join('');

  recordsList.innerHTML = html;
}

/**
 * DOM 加载完成后初始化
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 导出供调试使用
if (typeof window !== 'undefined') {
  window.sudokuDebug = {
    getSolution: () => solution,
    getPuzzle: () => puzzle,
    getGivenMask: () => givenMask,
    readUserBoard,
    emit
  };
}
