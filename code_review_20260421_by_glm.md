# Code Review - 2026-04-21

**Reviewer**: GLM (Claude Sonnet 4.6)
**Scope**: 全仓库

---

## 1. 安全问题 (高优先级)

### 1.1 调试接口暴露
- **文件**: `public/js/main.js:594-602`
- **问题**: `window.sudokuDebug` 导出了 `getSolution`、`getPuzzle` 等方法。任何用户打开浏览器控制台输入 `sudokuDebug.getSolution()` 即可看到答案，构成作弊漏洞。
- **建议**: 生产环境移除调试导出，或仅在开发模式下启用（通过环境变量控制）。

### 1.2 innerHTML 拼接风险
- **文件**: `public/js/main.js:567-581` — `renderRecords()` 使用模板字符串拼接 HTML 后赋值给 `innerHTML`
- **问题**: 虽然当前数据来自 `formatTime()` 和 i18n 翻译（可信来源），但 `innerHTML` 模式本身不安全。如果未来翻译内容被引入用户数据或包含恶意标签，可能产生 XSS。
- **建议**: 改用 DOM API（`createElement` + `textContent`）构建记录列表。

---

## 2. 死代码 / 无用文件 (中高优先级)

### 2.1 `functions/hello.js`
- **问题**: 只有一行 `return new Response("Hello from Function!")`，是 Cloudflare Workers 的模板文件，无实际用途。
- **建议**: 删除。

### 2.2 `public/html/index.html`
- **问题**: `public/` 下已有 `index.html`，`public/html/` 下又存在一个，疑似遗留文件。
- **建议**: 确认后删除多余的那个。

### 2.3 `docs/` 下的过时计划文档
- **文件**: `docs/PHASE3_PHASE4_PLAN.md`, `docs/agent-sudoku-plan.md`
- **问题**: 历史开发计划，已完成，不应留在代码库中。
- **建议**: 删除或移至 wiki。

---

## 3. 代码质量 (中优先级)

### 3.1 `window._checkCompleteTimeout` 全局变量
- **文件**: `public/js/ui/board-renderer.js:283-286`
- **问题**: 防抖 timer 直接挂在 `window` 上，污染全局命名空间。
- **建议**: 改为模块级变量 `let _checkCompleteTimeout = null;`。

### 3.2 i18n 实例全局耦合
- **文件**: `public/js/main.js:54`, `public/js/main.js:242`, `public/js/main.js:281`
- **问题**: 多处通过 `window.i18n` 全局访问，与 i18n 实现紧耦合。
- **建议**: main.js 统一持有 i18n 引用，通过参数传递或事件机制给其他模块。

### 3.3 `renderRecords()` 硬编码 fallback 翻译
- **文件**: `public/js/main.js:551-564`
- **问题**: 内联了英文 fallback 翻译映射，与翻译文件内容重复。i18n 系统本身已有 fallback 机制（回退到 en-US），这段硬编码是多余的。
- **建议**: 依赖 i18n fallback 机制，移除硬编码 fallback 对象。

### 3.4 3x3 宫格边框双重实现
- **文件**: `public/js/ui/board-renderer.js:63-68` (JS inline style) 和 `public/css/styles.css:225-230` (CSS nth-child)
- **问题**: JS 通过 inline style 添加粗边框，CSS 通过 nth-child 选择器也添加粗边框。两者同时存在，JS 的 inline style 会覆盖 CSS，导致 CSS 规则实际不生效。
- **建议**: 统一使用 CSS 方案，移除 JS 中的 inline border style。

---

## 4. 性能优化 (中优先级)

### 4.1 `moveFocus` 低效 DOM 查询
- **文件**: `public/js/ui/board-renderer.js:186-202`
- **问题**: 键盘方向键导航时，循环中每次迭代都调用 `boardElement.querySelector()` 搜索 DOM。最坏情况 81 次 DOM 查询。虽然已缓存 `cachedInputs`，但此处未使用。
- **建议**: 用缓存的 `cachedInputs` 构建二维索引 `inputsByPosition[r][c]`，直接通过坐标访问，避免 DOM 查询。

### 4.2 i18n `updateDOM` 多次 DOM 扫描
- **文件**: `public/js/i18n/i18n.js:257-294`
- **问题**: 每次语言切换时执行 4 次 `querySelectorAll`（分别处理 `data-i18n`、`data-i18n-placeholder`、`data-i18n-title`、`data-i18n-aria-label`）。
- **建议**: 合并为一次 DOM 遍历，根据属性类型分别处理。

---

## 5. 可访问性 (中优先级)

### 5.1 缺少 ARIA 标签
- **文件**: `public/index.html:47` — 语言选择器缺少 `aria-label`
- **文件**: `public/index.html:68` — 难度选择器缺少 `aria-label`
- **文件**: `public/index.html:58` — 邮箱输入框缺少 `required` 属性和验证错误提示

### 5.2 缺少键盘焦点指示器
- **文件**: `public/css/styles.css` — 缺少 `.btn:focus-visible` 和 `.form-control:focus-visible` 样式，键盘用户无法看到当前聚焦的元素。

---

## 6. CSS 改进 (低优先级)

### 6.1 `!important` 使用
- **文件**: `public/css/styles.css:189` — `display: flex !important`
- **文件**: `public/css/styles.css:256-259` — 冲突样式 `!important`（`background` 和 `color`）
- **建议**: 通过提高选择器特异性替代 `!important`。

### 6.2 Inline styles
- **文件**: `public/index.html:46-47` — 语言选择器使用 inline style 控制定位和宽度
- **建议**: 移至 CSS class。

---

## 总结

| 类别 | 数量 | 优先级 |
|------|------|--------|
| 安全问题 | 2 | 高 |
| 死代码/无用文件 | 3 | 中高 |
| 代码质量 | 4 | 中 |
| 性能优化 | 2 | 中 |
| 可访问性 | 2 | 中 |
| CSS 改进 | 2 | 低 |

**总计**: 15 个改进点
