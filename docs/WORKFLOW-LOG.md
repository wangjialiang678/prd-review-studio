# PRD Review Studio · Workflow Log

## 2026-06-27 — relabel 对账段措辞 + FR-1/FR-6 文字可视化拆解

### 改动摘要

两处改进，回应用户反馈"对账按钮看不懂""FR-1/FR-6 文字太多太复杂"。

**① 引擎层 relabel（`public/studio.js`，进仓库）**

`renderCompleteness` 里把含糊的对账/勾选标签改直白，让评审人一眼看懂语义：
- **三方对账（reconcile）**：`已对齐` → **`三方一致·无需改`**；`需修改` → **`有冲突·要改`**；`待定` 保留。（这是用户实锤"看不懂"的那条）
- **用户旅程（journey）**：`覆盖` → `已覆盖`（动词补成状态，避免与"去覆盖"混淆）；`明确不做`/`待定` 保留。
- **野生功能（wildFeatures）**：`补需求` → `补需求·保留`；`删功能` → `删功能·移除`（点明"补 = 留下、删 = 移除"的后果）；`待定` 保留。
- **FR 三件套（frSlots）**：`三件套齐全`/`有缺项`/`待核实` 已清楚（每段有 cmp-hint 解释语义），保留不动。
- `renderPRD` 渲染 `cbody` 改为 `esc(it.body).replace(/\n/g, '<br>')`，让 PRD 正文里的 `\n` 渲染成换行（原先 `\n` 被折叠成空格，长正文无法分条）。journey/wildFeatures 的 cbody 同步走此渲染，单行正文无副作用。

**② FR-1 / FR-6 文字可视化拆解（`public/projects/recorder-app.js`，私有不进仓库）**

把两条 important FR 的 `body` 大段文字拆成"扫一眼能懂"的短点（`【小标题】` + `· ` 分条 + 空行分组），信息不丢：
- **FR-1**：拆成【两态界面】（未录音/录音中/底部键）+【取消弹窗·去歧义】（标题/正文/两按钮/去掉的歧义项）两组。
- **FR-6**：拆成【精识别】一句话 +【说话人命名/指认·独立模块】四条要点（命名全局生效 / 名册 / 代表句试听辅助指认 / 人数修正）。
- 两条末尾各加一行 **📐 设计锚点**，把 FR 锚到 UI 设计稿：FR-1→放弃录音弹窗(b-cancel)、录音中两态(b-recording/b-home)；FR-6→说话人指认抽屉(b-speaker-sheet)、精识别中(b-transcribing)。落地"稿↔FR 锚定"理念。

### 验证

- `node --check public/studio.js` 通过；`node --check public/projects/recorder-app.js` 通过。
- `PORT=8090 node server.js` + `curl /?p=recorder-app` → **HTTP 200**。
- `studio.js` 已 commit/push（引擎）；`recorder-app.js` 经 `git check-ignore` 确认私有、未提交。

---

## 2026-06-27 — 补齐录音 App「会议录音」缺失的高保真界面（B 风格）

### 补了哪些稿（新建到 `public/ui/`，本地私有不进仓库）

P0：
- `b-cancel.html` —— 放弃录音确认弹窗（录音中遮罩上浮层）。去歧义：「继续录音」(主) / 「放弃并删除」(危险次)，不出现"保留/取消"双否定。
- `b-transcribing.html` —— 结束录音后「精识别中」中间态（详情页变体）。顶栏导出禁用灰；脉冲徽标 + 不确定态进度条 + 带说话人段落骨架；安抚文案"录音已安全保存，正在生成带说话人的终稿"。两段式架构的等待屏。
- `b-failed.html` —— 转写失败（详情页变体）。克制红失败横幅 + 原因占位（错误码）+「重试转写」主按钮 + 安抚区"音频仍可播放/导出"（仍可用的迷你播放器 + 导出音频）。
- `b-speaker-sheet.html` —— 说话人指认底部抽屉（最重要）。统一收口：名称输入框 + 代表句(点▶试听) 2–3 句带时间戳 + 纠错区(合并到…/拆分/改人数) + 底部「保存」主按钮；文件下方另放一个"保存成功内联反馈态"副本（内联 toast「已保存 ✓」+ 保存键变绿勾）。
- `b-permission.html` —— 麦克风权限被永久拒绝引导。麦克风+禁止斜杠图标 + "需要麦克风才能录音" + 三步去设置指引 +「去设置开启」主 +「以后再说」次。
- `b-delete.html` —— 删除录音确认弹窗。标题「删除这段录音？」+ 正文「本地音频与文稿将一并删除、无法恢复」+ 删谁摘要(防误删) +「取消」「删除」(危险)。

P1：
- `b-export.html` —— 导出格式选择底部抽屉。保留「导出」语义（未改"发送到 AI"）。单选 Markdown / 纯文本(TXT)；开关 含时间戳/含重点标记/含说话人；底部「导出」(主) 「复制到剪贴板」(次)。

### 为什么补这些

原设计稿只覆盖 happy-path 三屏（home / recording / detail），二级界面与状态态全缺——这正是 2026-06-26「交互完整性自查」面审计实锤的漏洞（FR-1 取消弹窗、FR-6 说话人 states/inverseFlow、FR-9 删除、转写中/失败态均无独立 UI）。本轮把这些缺失的状态屏与交互抽屉补成高保真稿，严格复用 B「极简专业 Clean Pro」令牌（主色 #E0322B 唯一关键动作色；失败/危险用克制红 #C5453B 文字 + rgba(197,69,59,.10) 底，不抢主色饱和度），统一 360 宽、状态栏 / icon-btn / topbar / sheet 结构沿用现有稿。

### 关键设计决策

- **B2（说话人改名交互形态）**：采纳"行内✎入口 + 统一指认抽屉"。入口 = 文稿详情每段说话人的行内✎（对齐设计稿，更直觉）；内容 = 名称改名 + 代表句试听 + 纠错(合并/拆分/改人数) + 保存反馈，全部收进一个底部抽屉里统一承载（解决稿A代码B的分歧：保留行内入口的直觉，又用单一抽屉降低实现/认知成本）。
- **导出保留「导出」语义**：`b-export.html` 不改成"发送到 AI"，避免与 RC5/B7 的核心 CTA 争议绑死；导出抽屉是中性的格式选择面，"发送到 AI"主 CTA 的去留另行在 PRD 工作台拍板。

### 登记 & 验证

- `public/projects/recorder-app.js` 的 `ui.screens` 追加 ④–⑩ 共 7 条（home/recording/detail 三条不动），最终 **10 条**。
- `node --check public/projects/recorder-app.js` 通过；运行期取数确认 screens.length=10。
- 7 个新 html 全部通过：含 `<!DOCTYPE html>` / `--primary:            #E0322B;` / `</html>`，div/button/svg 标签平衡（delta=0），文件非空。
- `public/ui/` 与 `recorder-app.js` 均 `.gitignore` 私有，留本地、未 commit/push。

---

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

### 配套：需求确认工作流方法论也更新（requirement-discovery skill）

工作台是"工具"，方法论是"规矩"，两者一起才算把需求确认工作流补完整。同日给全局 `requirement-discovery` skill 增加「交互完整性确认」闸门章节（确认 PRD 后、进入设计/编码前必过），并在工作流生态图里插入 `🔴交互完整性自查(PRD 工作台·五项闸门)` 节点。五项 = 稿↔FR 双向锚定 / 代码反扫对账 / 每条 FR 三件套(states·inverseFlow·errorRecovery) / 用户旅程七段式 / AC↔实现负控绑定。本工作台「交互完整性自查」面就是这五项的承载界面。

与 closed-loop-test 的「设计稿保真验证(3.4c)」接力：本闸门管"需求/交互全不全"（早），3.4c 管"实现还原得对不对"（晚）。
