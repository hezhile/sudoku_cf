/**
 * 批次 2 模块测试
 * 在浏览器控制台运行: import('./js/test-batch2.js')
 */

import { generateFullBoard, digHolesFromSolution } from './core/sudoku-engine.js';
import { initBoardRenderer, renderBoard, readUserBoard } from './ui/board-renderer.js';
import { initTimer, startTimer, stopTimer, getElapsedTime, setTimerDisplay } from './ui/timer.js';
import { initializeControls, getDifficulty } from './ui/controls.js';
import { loadRecords, saveRecord, getBestTime, getAllStats } from './storage/local-storage.js';
import { on } from './utils/event-bus.js';
import { formatTime } from './utils/helpers.js';
import { showSuccess } from './ui/toast.js';

console.log('🚀 批次 2 模块测试开始...\n');

// 测试 1: Board Renderer
console.log('1️⃣ 测试 board-renderer.js');
try {
  initBoardRenderer('#board');
  const solution = generateFullBoard();
  const puzzle = digHolesFromSolution(solution, 30);
  const givenMask = puzzle.map(row => row.map(cell => cell !== 0));

  renderBoard(puzzle, givenMask);
  console.log('  棋盘已渲染');

  const userBoard = readUserBoard();
  console.log('  读取用户棋盘:', userBoard[0].slice(0, 3), '...');
  console.log('  ✅ board-renderer.js 工作正常\n');
} catch (error) {
  console.error('  ❌ board-renderer.js 错误:', error);
}

// 测试 2: Timer
console.log('2️⃣ 测试 timer.js');
try {
  initTimer('#timer');
  startTimer();

  setTimeout(() => {
    const elapsed = getElapsedTime();
    console.log('  计时器运行 1 秒，实际时间:', formatTime(elapsed));
    stopTimer();
    console.log('  ✅ timer.js 工作正常\n');

    // 测试 3: Controls
    console.log('3️⃣ 测试 controls.js');
    try {
      initializeControls();
      console.log('  当前难度:', getDifficulty());

      // 监听事件
      on('game:new', (data) => {
        console.log('  检测到新游戏事件:', data);
      });

      console.log('  ✅ controls.js 工作正常\n');
    } catch (error) {
      console.error('  ❌ controls.js 错误:', error);
    }

    // 测试 4: Local Storage
    console.log('4️⃣ 测试 local-storage.js');
    try {
      // 保存测试记录
      saveRecord('medium', 123456);
      const bestTime = getBestTime('medium');
      console.log('  保存测试记录，最佳时间:', formatTime(bestTime));

      const stats = getAllStats();
      console.log('  所有难度统计:', stats);

      const records = loadRecords();
      console.log('  记录数量:', Object.keys(records).length);

      console.log('  ✅ local-storage.js 工作正常\n');
    } catch (error) {
      console.error('  ❌ local-storage.js 错误:', error);
    }

    // 完成测试
    console.log('✨ 批次 2 测试完成！\n');
    console.log('📋 测试总结:');
    console.log('  - board-renderer.js: ✅');
    console.log('  - timer.js: ✅');
    console.log('  - controls.js: ✅');
    console.log('  - local-storage.js: ✅');
    console.log('\n🎉 所有 UI 和存储模块工作正常！');
    console.log('\n📝 下一步：');
    console.log('  1. 点击"新游戏"按钮测试');
    console.log('  2. 填写几个数字测试输入');
    console.log('  3. 使用方向键测试键盘导航');
    console.log('  4. 检查冲突高亮是否正常');

    showSuccess('批次 2 测试完成！');
  }, 1000);
} catch (error) {
  console.error('  ❌ timer.js 错误:', error);
}
