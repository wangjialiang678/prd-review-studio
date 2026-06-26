# PRD Review Studio · Workflow Log

## 2026-06-26 — 新增第 6 个确认面「交互完整性自查」

### 改动摘要

**引擎层（进仓库）**
- `public/studio.js`：新增 `renderCompleteness()` 函数；新增 `verdictCtlCustom()` 支持自定义按钮标签（覆盖/明确不做/待定等）；动态插入「交互完整性」tab（`if (D.completeness)` 守卫，无数据则不出现）；`countByFace()` 和 `updateTabBadges()` 接入 `completeness` 角标计数；`render()` 路由接入；历史轮次面板的 `faceOrder` / `faceNames` 接入。
- `public/studio.css`：新增 `.cmp-hint`、`.cmp-slots`、`.cmp-slot-row`、`.cmp-slot-label`、`.cmp-slot-val`、`.cmp-ok`、`.cmp-miss`、`.cmp-gap`、`.cmp-rc-type`、`.cmp-rc-spec-only`、`.cmp-rc-code-only`、`.cmp-rc-mismatch` 等样式类。
- `public/projects/demo.js`：新增最小 `completeness` 示例段（3 条 journey / 2 条 frSlots / 1 条 wildFeatures / 2 条 reconcile），保证示例项目开箱可展示该面。

**数据层（本地私有，不进仓库）**
- `public/projects/recorder-app.js`：填充完整 `D.completeness` 审计数据，包含 7 条旅程、5 条 FR 三件套、8 条野生功能（B1–B8）、8 条三方对账（RC1–RC8）。

### 为什么加这个面

现有五个确认面（PRD/原型/架构/测试/UI 设计）均在"规划→验证"的维度工作，但存在一个系统性漏洞：**一个界面或功能可以被直接建出来，却从未进过 PRD 评审或交互确认**（如说话人改名面板、代表句试听、双 Marker 数据模型）。

「交互完整性自查」面的职责是堵住这类漏网：

1. **用户旅程七段**：强制逐段表态，确保从"会前准备"到"隐私与数据生命周期"每段都有明确决策（覆盖/明确不做/待定）。
2. **FR 三件套**：对每条功能需求审查 states（状态完整性）、inverseFlow（有创建是否有删除/撤销）、errorRecovery（AI 类功能分错后用户怎么救），避免只做正向路径。
3. **野生功能清单**：建了但没确认的功能必须二选一（补需求/删功能），不允许留在灰色地带。
4. **三方对账**：稿↔FR↔代码 三方不一致的地方逐条列出、逐条决策。

### 录音 App 填充的缺口（2026-06-26 审计实锤）

- **旅程**：会前准备/会后处理/归档/检索/跨设备/隐私 六段标为"待定"，有明确的缺口描述。
- **FR 三件套**：FR-6 说话人（states/inverseFlow/errorRecovery 全缺）、FR-9 删除+搜索（有 AC 无实现）、FR-12 自动标题（时间占位假绿）标为"有缺项"。
- **野生功能 B1–B8**：代表句面板选句算法未确认、说话人改名交互稿A代码B、双 Marker 模型并存、"发送到 AI"主 CTA 被换成普通导出等 8 项。
- **三方对账 RC1–RC8**：搜索框/自动标签/"发送到 AI"按钮（稿有代码无）；代表句面板/双 Marker 模型（代码有需求无）；说话人改名交互形态（稿A代码B）。
