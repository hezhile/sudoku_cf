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
import { initTimer, startTimer, startTimerWithElapsed, stopTimer, resetTimer, pauseTimer, resumeTimer, getElapsedTime, setTimerDisplay, updatePauseButton, setElapsedTime } from './ui/timer.js';
import { showSuccess, showError, showWarning, showToast } from './ui/toast.js';
import { initializeControls, getDifficulty, setLoading, disableControlsForPause, enableControlsFromPause, setDifficulty } from './ui/controls.js';
import { initPauseOverlay, showPauseOverlay as showPauseOverlayDirect, hidePauseOverlay } from './ui/pause-overlay.js';

// 存储模块
import { saveRecord, loadRecords, getAllStats, clearRecords } from './storage/local-storage.js';
import { initSyncModule, uploadRecordOnComplete } from './storage/supabase-sync.js';
import { saveGameState, loadGameState, clearGameState } from './storage/game-state.js';

// 认证模块
import { initAuth } from './auth/auth-handler.js';

// 工具模块
import { on, emit, setGlobalState, getGlobalState } from './utils/event-bus.js';
import { formatTime } from './utils/helpers.js';
import { addListener, removeListener, createListenerGroup } from './utils/listener-manager.js';

// 配置
import { DIFFICULTY_HOLES } from './config/constants.js';
// 计数器模块
import { initCounter, incrementGameCount } from './api/counter.js';

// 获取全局i18n实例（将在初始化后设置）
let i18n = null;

// 监听器组
const uiListeners = createListenerGroup('uiListeners');
const languageListeners = createListenerGroup('languageListeners');

// 自动保存节流
let lastSaveTime = 0;
const SAVE_INTERVAL = 5000; // 每5秒保存一次

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
    // 设置全局i18n引用（在初始化前就设置）
    i18n = window.i18n;

    // 初始化多语言系统（优先初始化）
    await initializeI18n();

    // 确保翻译已加载后再继续初始化
    await i18n.ensureTranslationsLoaded();

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

    // 检查并恢复游戏状态
    await checkAndRestoreGameState();

    // 现在可以安全地渲染记录，因为翻译已经加载完成
    renderRecords();

    // 初始化全局计数器
    initCounter();
  } catch (error) {
    console.error('初始化失败:', error);
    if (i18n) {
      showError(i18n.t('errors.authFailed'));
    }

    // 即使翻译加载失败，也尝试渲染记录（会使用默认文本）
    renderRecords();
  }
}

/**
 * 注册事件处理器
 */
function registerEventHandlers() {
  // 游戏事件
  on('game:new', handleNewGame);
  on('game:reset', handleReset);
  on('game:pause', handlePause);
  on('game:resume', handleResume);
  on('board:complete', handleBoardComplete);

  // 计时器事件（用于自动保存）
  on('timer:tick', handleTimerTick);

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
    // 清除保存的游戏状态
    clearGameState();
    setGlobalState('isPaused', false);

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

    // 更新暂停按钮
    updatePauseButton(false, i18n ? i18n.t.bind(i18n) : null);

    setLoading(false);
    showSuccess(i18n.t('puzzleGenerated', { difficulty: i18n.t(`difficulty.${difficulty}`) }));
    emit('game:started', { difficulty });

    // 增加全局计数（非阻塞，不影响游戏体验）
    incrementGameCount();
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
  if (getGlobalState('isResetting')) {
    console.log('Reset already in progress, ignoring');
    return;
  }

  setGlobalState('isResetting', true);
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
    setGlobalState('isResetting', false);
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

    // 等待语言检测和初始化完成
    if (globalI18n._initializationPromise) {
      await globalI18n._initializationPromise;
    }

    console.log('Initializing i18n, current language:', globalI18n.currentLang);

    // 确保翻译已加载
    if (!globalI18n.translations[globalI18n.currentLang]) {
      await globalI18n.loadTranslations(globalI18n.currentLang);
    }
    console.log('Loaded translations:', Object.keys(globalI18n.translations));

    // 更新DOM中的翻译（包括难度选择器）
    globalI18n.updateDOM();

    // 设置语言选择器的当前值
    updateLanguageSelector();

    // 清理旧的语言变更事件监听器
    uiListeners.clear();

    // 添加语言变更事件监听器
    uiListeners.add(window, 'languageChanged', () => {
      // 重新渲染记录（包含翻译的文本）
      renderRecords();
      updateLanguageSelector();
    });
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  }
}

/**
 * 更新语言选择器
 */
function updateLanguageSelector() {
  const globalI18n = window.i18n;
  const languageSelector = document.getElementById('language-selector');

  if (languageSelector) {
    languageSelector.value = globalI18n.currentLang;

    // 标记是否为自动检测
    const isAutoDetected = !globalI18n.getSavedLanguage();
    if (isAutoDetected) {
      languageSelector.title = `自动检测: ${globalI18n.currentLang}`;
    } else {
      languageSelector.title = '';
    }

    // 清理旧的监听器
    languageListeners.clear();

    // 添加新的语言切换监听器
    languageListeners.add(languageSelector, 'change', async (e) => {
      const newLang = e.target.value;
      console.log('Language changed to:', newLang);
      await globalI18n.setLanguage(newLang);
    });
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
    // 清除保存的游戏状态
    clearGameState();
    setGlobalState('isPaused', false);

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
  // 清理所有UI监听器
  uiListeners.clear();
  languageListeners.clear();

  renderRecords();
  showToast(i18n.t('status.recordsCleared'), 'info');
}

/**
 * 处理暂停
 */
function handlePause() {
  if (!puzzle || getGlobalState('isPaused')) return;

  // 设置暂停状态
  setGlobalState('isPaused', true);

  // 暂停计时器
  pauseTimer();

  // 保存当前游戏状态
  const currentBoard = readUserBoard();
  saveGameState({
    solution,
    puzzle,
    givenMask,
    currentBoard,
    elapsedTime: getElapsedTime(),
    difficulty: getDifficulty(),
    isPaused: true
  });

  // 显示遮罩
  showPauseOverlayDirect();

  // 禁用控件
  disableControlsForPause();

  // 更新暂停按钮
  updatePauseButton(true, i18n ? i18n.t.bind(i18n) : null);

  emit('game:paused');
}

/**
 * 处理恢复
 */
function handleResume() {
  if (!puzzle || !getGlobalState('isPaused')) return;

  // 清除暂停状态
  setGlobalState('isPaused', false);

  // 隐藏遮罩
  hidePauseOverlay();

  // 恢复计时器
  resumeTimer();

  // 启用控件
  enableControlsFromPause();

  // 更新暂停按钮
  updatePauseButton(false, i18n ? i18n.t.bind(i18n) : null);

  // 保存恢复后的状态
  const currentBoard = readUserBoard();
  saveGameState({
    solution,
    puzzle,
    givenMask,
    currentBoard,
    elapsedTime: getElapsedTime(),
    difficulty: getDifficulty(),
    isPaused: false
  });

  emit('game:resumed');
}

/**
 * 处理计时器滴答 - 自动保存游戏状态
 */
function handleTimerTick({ elapsed }) {
  if (!puzzle || getGlobalState('isPaused')) return;

  const now = Date.now();
  // 节流：每5秒保存一次
  if (now - lastSaveTime >= SAVE_INTERVAL) {
    const currentBoard = readUserBoard();
    saveGameState({
      solution,
      puzzle,
      givenMask,
      currentBoard,
      elapsed,
      difficulty: getDifficulty(),
      isPaused: false
    });
    lastSaveTime = now;
  }
}

/**
 * 检查并恢复保存的游戏状态
 */
async function checkAndRestoreGameState() {
  const savedState = loadGameState();
  if (!savedState) return;

  // 检查保存状态是否在24小时内
  const hoursSinceSave = (Date.now() - savedState.savedAt) / (1000 * 60 * 60);
  if (hoursSinceSave > 24) {
    clearGameState();
    return;
  }

  // 恢复游戏状态
  solution = savedState.solution;
  puzzle = savedState.puzzle;
  givenMask = savedState.givenMask;

  // 恢复棋盘
  renderBoard(savedState.currentBoard, givenMask);

  // 设置难度
  setDifficulty(savedState.difficulty);

  if (savedState.isPaused) {
    // 游戏处于暂停状态
    setGlobalState('isPaused', true);

    // 设置计时器显示
    setElapsedTime(savedState.elapsedTime);

    // 初始化并显示暂停遮罩
    initPauseOverlay();
    showPauseOverlayDirect();

    // 禁用控件
    disableControlsForPause();

    // 更新暂停按钮
    updatePauseButton(true, i18n ? i18n.t.bind(i18n) : null);
  } else {
    // 游戏处于进行中状态 - 从保存的时间继续计时
    startTimerWithElapsed(savedState.elapsedTime);

    // 更新暂停按钮
    updatePauseButton(false, i18n ? i18n.t.bind(i18n) : null);
  }

  emit('game:state:restored', { state: savedState });
}

/**
 * 渲染记录
 */
function renderRecords() {
  const stats = getAllStats();
  const recordsList = document.getElementById('recordsList');

  if (!recordsList) return;

  // 获取翻译，如果未加载则使用默认值
  const getTranslation = (key, fallback) => {
    if (window.i18n && window.i18n.translations && window.i18n.translations[window.i18n.currentLang]) {
      return window.i18n.t(key);
    }
    // Fallback values for English
    const fallbacks = {
      'difficulty.easy': 'Easy',
      'difficulty.medium': 'Medium',
      'difficulty.hard': 'Hard',
      'difficulty.expert': 'Expert',
      'records.recent': 'Recent: {{time}}',
      'records.best': 'Best: {{time}}'
    };
    return fallbacks[key] || fallback || key;
  };

  const html = ['easy', 'medium', 'hard', 'expert'].map(diff => {
    const stat = stats[diff];
    const bestStr = stat.best ? formatTime(stat.best) : '—';
    const lastStr = stat.lastTime ? formatTime(stat.lastTime) : '—';
    const label = getTranslation(`difficulty.${diff}`);

    return `
      <div class="record-row">
        <div>${label} <span class="small">${getTranslation('records.recent').replace('{{time}}', lastStr)}</span></div>
        <div>${getTranslation('records.best').replace('{{time}}', bestStr)}</div>
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
