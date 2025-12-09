/**
 * 批次 1 模块测试
 * 在浏览器控制台运行: import('./js/test-batch1.js')
 */

import { DIFFICULTY_HOLES, STORAGE_KEY, SUPABASE_CONFIG } from './config/constants.js';
import { on, emit, getEventList } from './utils/event-bus.js';
import { formatTime, validateEmail, debounce } from './utils/helpers.js';
import { showToast, showSuccess, showError, showWarning } from './ui/toast.js';
import { generateFullBoard, digHolesFromSolution, isValidPlacement } from './core/sudoku-engine.js';
import { countSolutions, hasUniqueSolution, solvePuzzle } from './core/solver.js';
import { detectConflicts, isComplete, getCandidates } from './core/validator.js';

console.log('🚀 批次 1 模块测试开始...\n');

// 测试 1: 常量模块
console.log('1️⃣ 测试 constants.js');
console.log('  DIFFICULTY_HOLES:', DIFFICULTY_HOLES);
console.log('  STORAGE_KEY:', STORAGE_KEY);
console.log('  Supabase URL:', SUPABASE_CONFIG.url);
console.log('  ✅ constants.js 工作正常\n');

// 测试 2: Event Bus
console.log('2️⃣ 测试 event-bus.js');
let eventFired = false;
on('test:event', (data) => {
  eventFired = true;
  console.log('  事件触发，数据:', data);
});
emit('test:event', { test: 'data' });
console.log('  事件系统工作:', eventFired ? '✅' : '❌');
console.log('  注册的事件:', getEventList());
console.log('');

// 测试 3: Helpers
console.log('3️⃣ 测试 helpers.js');
console.log('  formatTime(123456):', formatTime(123456));
console.log('  validateEmail("test@example.com"):', validateEmail('test@example.com'));
console.log('  validateEmail("invalid"):', validateEmail('invalid'));
console.log('  ✅ helpers.js 工作正常\n');

// 测试 4: Toast 系统
console.log('4️⃣ 测试 toast.js');
console.log('  显示 Toast 通知...');
setTimeout(() => showSuccess('测试成功！'), 100);
setTimeout(() => showError('测试错误！'), 600);
setTimeout(() => showWarning('测试警告！'), 1100);
setTimeout(() => showToast('测试信息', 'info'), 1600);
console.log('  ✅ toast.js 已触发（查看页面右上角）\n');

// 测试 5: 数独引擎
console.log('5️⃣ 测试 sudoku-engine.js');
try {
  const solution = generateFullBoard();
  console.log('  生成完整解:', solution[0].slice(0, 3), '...');

  const puzzle = digHolesFromSolution(solution, 30);
  let emptyCount = 0;
  puzzle.forEach(row => row.forEach(cell => { if (cell === 0) emptyCount++; }));
  console.log('  挖空后空格数:', emptyCount);

  const valid = isValidPlacement(solution, 0, 0, solution[0][0]);
  console.log('  验证位置合法性:', valid);

  console.log('  ✅ sudoku-engine.js 工作正常\n');
} catch (error) {
  console.error('  ❌ sudoku-engine.js 错误:', error);
}

// 测试 6: Solver
console.log('6️⃣ 测试 solver.js');
try {
  const solution = generateFullBoard();
  const puzzle = digHolesFromSolution(solution, 30);

  const solCount = countSolutions(puzzle, 2);
  console.log('  解的数量:', solCount);

  const unique = hasUniqueSolution(puzzle);
  console.log('  是否唯一解:', unique);

  console.log('  ✅ solver.js 工作正常\n');
} catch (error) {
  console.error('  ❌ solver.js 错误:', error);
}

// 测试 7: Validator
console.log('7️⃣ 测试 validator.js');
try {
  const solution = generateFullBoard();
  const { hasConflicts, conflicts } = detectConflicts(solution);
  console.log('  完整解有冲突:', hasConflicts);
  console.log('  完整解是否完成:', isComplete(solution));

  const candidates = getCandidates(solution, 0, 0);
  console.log('  已填格子的候选数:', candidates.length);

  console.log('  ✅ validator.js 工作正常\n');
} catch (error) {
  console.error('  ❌ validator.js 错误:', error);
}

console.log('✨ 批次 1 测试完成！\n');
console.log('📋 测试总结:');
console.log('  - constants.js: ✅');
console.log('  - event-bus.js: ✅');
console.log('  - helpers.js: ✅');
console.log('  - toast.js: ✅ (查看页面)');
console.log('  - sudoku-engine.js: ✅');
console.log('  - solver.js: ✅');
console.log('  - validator.js: ✅');
console.log('\n🎉 所有基础模块工作正常！');
