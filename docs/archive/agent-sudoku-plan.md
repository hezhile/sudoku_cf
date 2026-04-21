# AI Agent Sudoku 游戏实施计划

## Context（背景）

用户希望将现有的数独游戏扩展为支持 AI agents（如 OpenClaw）通过 API 进行游戏。这个功能的目标是：

1. **展示 LLM 推理能力**
   让 AI agents 使用纯逻辑推理，而不是直接调用求解器，来完成数独。

2. **创建竞技平台**
   通过排行榜展示不同 AI agents 的表现，让不同模型在统一规则下竞争。

3. **防止作弊**
   通过服务端验证、频率限制、移动历史追踪和异常行为检测，降低直接调用求解器或脚本化作弊的可能性。

### 核心需求

- 在网站根目录提供 `llm.txt`，让 agents 可以自动发现规则与 API 能力。
- 不提供 SDK，agents 直接通过 HTTP API 交互。
- 每个 agent 每秒最多只能提交一次操作。
- 每次 API 调用只能填写一个格子。
- 增加排行榜，展示 agent 的成绩与可疑标记。

### 现有架构

- **后端**：Cloudflare Pages Functions + KV
- **数据存储**：Supabase（已存在 `games` 与 `best_scores` 表）
- **前端**：原生 JavaScript ES Modules 单页应用
- **游戏逻辑**：已有数独生成、验证、求解逻辑，位于 `public/js/core/`

---

## Implementation Plan（实施方案）

## Phase 1：创建 llm.txt 与核心工具函数

### 1.1 创建 `public/llm.txt`

此文件作为 AI agents 的入口文档，包含：

- 游戏规则说明
- API 端点文档
- 请求与响应格式
- rate limiting 规则（1 req/sec）
- 评分系统说明
- 反作弊机制说明
- 一次完整交互示例

### 1.2 创建 `functions/api/agent/utils/scoring.js`

负责评分与异常行为判断。

建议逻辑：

```javascript
calculateScore(difficulty, timeSeconds, errorsCount) {
  const baseScore = { easy: 100, medium: 200, hard: 400, expert: 800 };
  const timeBonus = Math.max(0, 1000 - timeSeconds);
  const errorPenalty = errorsCount * 10;
  return baseScore[difficulty] + timeBonus - errorPenalty;
}
```

异常行为检测方向：

- 完成时间过快，例如 `expert < 10 秒`
- 全程无试错且填充顺序过于机械
- 与求解器式固定顺序高度相似

### 1.3 创建 `functions/api/agent/utils/game-helpers.js`

复用现有前端核心逻辑中的数独能力：

- 生成完整棋盘
- 基于解挖空生成题面
- 校验落子是否合法
- 校验棋盘是否完成
- 管理会话状态对象

依赖的现有文件：

- `public/js/core/sudoku-engine.js`
- `public/js/core/solver.js`

---

## Phase 2：实现 Rate Limiting 中间件

### 2.1 创建 `functions/api/agent/_middleware.js`

为 `/api/agent/*` 路由统一加上频率限制。

### 逻辑

1. 从请求体或 query 中提取 `agentId`
2. 在 KV 中查询 `ratelimit:{agentId}`
3. 如果距离上次请求小于 1000ms，则返回 `429`
4. 否则更新请求时间戳并继续执行

### KV 结构

- Key：`ratelimit:{agentId}`
- Value：Unix 时间戳（毫秒）
- TTL：60 秒

### 复用

优先复用当前项目已经绑定的 KV 命名空间，而不是新增一套单独存储。

---

## Phase 3：实现游戏 API 端点

### 3.1 创建 `functions/api/agent/game/start.js`

**POST** `/api/agent/game/start`

请求示例：

```json
{
  "agentId": "openclaw-v1",
  "agentName": "OpenClaw Agent",
  "difficulty": "medium"
}
```

处理流程：

1. 生成完整解
2. 按难度挖空生成题面
3. 生成 `gameId`
4. 在 KV 中保存会话：
   - `puzzle`
   - `solution`
   - `agentId`
   - `agentName`
   - `difficulty`
   - `startTime`
   - `moves`
   - `errors`
5. 设置 1 小时 TTL
6. 返回题面，不返回解

响应示例：

```json
{
  "gameId": "uuid-v4",
  "puzzle": [[5,3,0,...], ...],
  "difficulty": "medium",
  "startTime": "2026-03-10T02:42:58Z"
}
```

### 3.2 创建 `functions/api/agent/game/move.js`

**POST** `/api/agent/game/move`

请求示例：

```json
{
  "gameId": "uuid-v4",
  "agentId": "openclaw-v1",
  "row": 0,
  "col": 2,
  "value": 4
}
```

处理流程：

1. 从 KV 读取当前会话
2. 验证 `agentId` 与会话归属是否一致
3. 检查该格是否属于原始 givens
4. 使用现有校验逻辑验证落子是否符合规则
5. 若无效：
   - 记录错误数
   - 返回冲突信息
6. 若有效：
   - 更新当前棋盘
   - 记录 move history
7. 检查棋盘是否完成
8. 若已完成：
   - 计算得分
   - 标记是否可疑
   - 写入 Supabase 排行榜
9. 将最新会话回写 KV

成功响应示例：

```json
{
  "success": true,
  "valid": true,
  "isComplete": false,
  "currentBoard": [[5,3,4,...], ...],
  "moveCount": 1,
  "elapsedTime": 1234
}
```

规则冲突示例：

```json
{
  "success": false,
  "valid": false,
  "reason": "RULE_VIOLATION",
  "conflicts": [
    { "type": "row", "position": 0, "value": 4 }
  ]
}
```

完成响应示例：

```json
{
  "success": true,
  "valid": true,
  "isComplete": true,
  "score": 850,
  "stats": {
    "totalMoves": 46,
    "invalidMoves": 2,
    "duration": 46789,
    "rank": 15
  }
}
```

### 3.3 创建 `functions/api/agent/game/status.js`

**GET** `/api/agent/game/status?gameId=xxx&agentId=xxx`

处理流程：

1. 从 KV 读取会话
2. 验证归属
3. 返回当前棋盘和统计信息

响应示例：

```json
{
  "gameId": "uuid-v4",
  "currentBoard": [[5,3,4,...], ...],
  "isComplete": false,
  "moveCount": 45,
  "errorCount": 2,
  "elapsedTime": 45678,
  "difficulty": "medium"
}
```

---

## Phase 4：实现排行榜功能

### 4.1 创建 Supabase 表

建议执行 SQL：

```sql
CREATE TABLE agent_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  time_ms INTEGER NOT NULL,
  moves_count INTEGER NOT NULL,
  errors_count INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  move_history JSONB,
  is_suspicious BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_agent_difficulty
  ON agent_scores(agent_id, difficulty);

CREATE INDEX idx_leaderboard
  ON agent_scores(difficulty, score DESC, time_ms ASC);
```

### 4.2 创建 `functions/api/agent/leaderboard.js`

**GET** `/api/agent/leaderboard?difficulty=medium&limit=10`

逻辑：

1. 连接 Supabase
2. 查询 `agent_scores`
3. 可按 `difficulty` 过滤
4. 按 `score DESC, time_ms ASC` 排序
5. 限制返回条数

响应示例：

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "agentId": "gpt4-solver",
      "agentName": "GPT-4 Master",
      "score": 1250,
      "time": 32456,
      "moves": 46,
      "errors": 0,
      "isSuspicious": false
    }
  ],
  "difficulty": "medium",
  "updatedAt": "2026-03-10T02:42:58Z"
}
```

---

## Phase 5：前端排行榜集成

### 5.1 创建 `public/js/ui/agent-leaderboard.js`

职责：

- 拉取排行榜数据
- 渲染排行榜
- 自动刷新
- 难度切换

参考接口：

```javascript
export async function fetchLeaderboard(difficulty) {
  const response = await fetch(`/api/agent/leaderboard?difficulty=${difficulty}&limit=50`);
  return response.json();
}

export function renderLeaderboard(container, data) {
  // Rank | Agent | Score | Time | Moves | Errors
}

export function initLeaderboard() {
  // 每 30 秒刷新一次
}
```

### 5.2 修改 `public/index.html`

在本地记录区块后增加 Agent Leaderboard：

```html
<div id="agent-leaderboard-section" class="leaderboard-section">
  <div class="leaderboard-header">
    <strong data-i18n="agentLeaderboard">AI Agent Leaderboard</strong>
    <select id="leaderboard-difficulty" class="form-control">
      <option value="all" data-i18n="all">All</option>
      <option value="easy" data-i18n="easy">Easy</option>
      <option value="medium" selected data-i18n="medium">Medium</option>
      <option value="hard" data-i18n="hard">Hard</option>
      <option value="expert" data-i18n="expert">Expert</option>
    </select>
  </div>
  <div id="leaderboard-list"></div>
</div>
```

### 5.3 更新翻译文件

需要新增的翻译键包括：

- `agentLeaderboard`
- `rank`
- `agentName`
- `score`
- `time`
- `moves`
- `errors`
- `suspicious`

### 5.4 添加 CSS 样式

在 `public/css/styles.css` 中增加：

```css
.leaderboard-section {
  margin-top: 20px;
  padding: 15px;
  background: var(--bg-color);
  border-radius: 8px;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

#leaderboard-list table {
  width: 100%;
  border-collapse: collapse;
}

#leaderboard-list th,
#leaderboard-list td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.suspicious-flag {
  color: #ff9800;
}
```

### 5.5 修改 `public/js/main.js`

集成排行榜模块初始化：

```javascript
import { initLeaderboard } from './ui/agent-leaderboard.js';

initLeaderboard();
```

---

## File Summary（文件清单）

### 新建文件

1. `public/llm.txt`
2. `functions/api/agent/_middleware.js`
3. `functions/api/agent/utils/scoring.js`
4. `functions/api/agent/utils/game-helpers.js`
5. `functions/api/agent/game/start.js`
6. `functions/api/agent/game/move.js`
7. `functions/api/agent/game/status.js`
8. `functions/api/agent/leaderboard.js`
9. `public/js/ui/agent-leaderboard.js`
10. `supabase-migration.sql`

### 修改文件

1. `public/index.html`
2. `public/translations/en-US.json`
3. `public/translations/zh-CN.json`
4. `public/translations/ja-JP.json`
5. `public/css/styles.css`
6. `public/js/main.js`

### 关键复用文件

- `public/js/core/sudoku-engine.js`
- `public/js/core/solver.js`
- `functions/api/counter/increment.js`

---

## Implementation Order（实施顺序）

### Day 1：基础设施

1. 创建 `llm.txt`
2. 创建 `utils/scoring.js`
3. 创建 `utils/game-helpers.js`
4. 创建 `_middleware.js`

### Day 2：游戏 API

5. 创建 `game/start.js`
6. 创建 `game/move.js`
7. 创建 `game/status.js`
8. 用 `curl` 或 Postman 验证接口

### Day 3：排行榜与数据表

9. 执行 Supabase migration
10. 创建 `leaderboard.js`
11. 验证数据持久化

### Day 4：前端集成

12. 创建 `agent-leaderboard.js`
13. 修改 `index.html`
14. 更新三份翻译
15. 添加 CSS 样式
16. 修改 `main.js`

### Day 5：测试与部署

17. 端到端测试完整 agent 交互流程
18. 验证 rate limiting
19. 验证可疑行为检测
20. 部署到 Cloudflare Pages
21. 验证 KV 与环境变量绑定

---

## Verification（验证方法）

### 功能验证清单

- [ ] `llm.txt` 可访问
- [ ] 频率限制生效，重复请求返回 `429`
- [ ] 新建游戏接口返回有效题面
- [ ] 有效落子成功
- [ ] 无效落子返回冲突信息
- [ ] 修改 givens 被拒绝
- [ ] 游戏完成后触发评分
- [ ] 成绩写入 Supabase
- [ ] 排行榜显示正确
- [ ] 可疑记录能被标记
- [ ] 前端排行榜可刷新

### 测试命令示例

```bash
curl -X POST https://sudoku.vuntun.app/api/agent/game/start \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test-agent","difficulty":"easy"}'

curl -X POST https://sudoku.vuntun.app/api/agent/game/move \
  -H "Content-Type: application/json" \
  -d '{"gameId":"xxx","agentId":"test-agent","row":0,"col":2,"value":4}'

curl "https://sudoku.vuntun.app/api/agent/leaderboard?difficulty=easy"
```

---

## Configuration（配置要求）

### Cloudflare Dashboard

- 确保 KV 已正确绑定到 Pages Functions
- 如需环境变量，统一通过现有配置管理

### Supabase Dashboard

- 执行 migration 创建 `agent_scores`
- 检查索引创建成功
- 如有需要，补充 RLS 策略

---

## Design Decisions（设计决策）

### 为什么用 KV 存游戏会话

- 读写快，适合实时游戏状态
- TTL 易管理，能自动过期清理
- 当前访问模式是按 `gameId` 点查，非常适合 KV

### 为什么用 Supabase 存排行榜

- 排行榜需要复杂排序、筛选和分页
- 成绩需要长期持久化
- 项目当前已经在使用 Supabase

### Rate Limiting 策略

- 按 `agentId` 限制，而不是按 IP 限制
- 统一 1 秒窗口
- 用 KV 保存短期时间戳，简单可靠

### 反作弊策略

- 所有落子都在服务端校验
- 保存移动历史用于回放与审查
- 加时间阈值与模式识别判断异常
- 可疑记录不直接删除，而是打标供后续分析

---

## Risks And Mitigations（风险与缓解）

### 风险 1：KV 读写限制

- 问题：Cloudflare KV 有吞吐和一致性限制
- 缓解：控制请求频率、会话短 TTL、避免不必要写入

### 风险 2：Supabase 免费层限制

- 问题：行数和存储可能增长过快
- 缓解：限制保存天数或定期归档旧成绩

### 风险 3：反作弊绕过

- 问题：agent 可能伪装成人类式输入
- 缓解：组合使用速度、顺序、错误率、模式检测

### 风险 4：API 滥用

- 问题：恶意请求可能消耗资源
- 缓解：rate limiting + Cloudflare 自带边缘防护

---

## Next Steps（后续可能扩展）

1. 为 Python / JavaScript 提供官方 SDK
2. 增加实时排行榜
3. 增加定期比赛模式
4. 增加 agent 解题过程可视化
5. 支持多 agent 同题竞速

---

## Note

本文件为基于会话中已读取到的旧版内容进行的**重建归档版**，目标是恢复原始计划的结构与关键设计信息；措辞和排版可能与最初本地文件不完全一致。
