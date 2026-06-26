/* 示例项目数据（开源 demo）。复制本文件为 projects/<你的项目>.js 改内容，
 * 然后用 ?p=<你的项目> 打开即可评审。数据结构见下方注释。
 *
 * 新支持字段（均可选、向后兼容）：
 *  - items[].defaultVerdict: 'ok'|'no'|'q'  用户未操作时视为此态度（计入进度、按钮浅色高亮）
 *  - items[].important: true                 视觉重点高亮（左侧橙色条 + "需确认"标签）
 *  - arch.diagrams[].rationale: string       图下方折叠"💡 原理说明"
 *  - arch.diagrams[].defaultVerdict / .important  同上
 *  - arch.assertions[].defaultVerdict / .important 同上
 *  - arch.alternatives: [{id,title,desc,chosen}]  备选方案对比卡片
 *  - test.scenarios[].defaultVerdict / .important  同上
 *  - test.cases[].defaultVerdict / .important       同上
 */
window.PROJECT_DATA = {
  id: 'demo',
  title: '示例 · 待办清单 App',

  // ① PRD：sections[].items[] 每条可被逐条评审（赞成/异议/疑问 + 评论）
  //    可选：defaultVerdict:'ok'|'no'|'q'（默认态度）、important:true（重点高亮）
  prd: {
    intro: '一个极简待办 App 的示例 PRD，用来演示这个确认工作台的 4 个面。',
    sections: [
      {
        title: '核心决策', tag: '基线',
        items: [
          {
            id: 'D1', cid: '决策 D1', title: '本地优先、无需登录',
            body: '数据存本地，首次打开即可用，不强制注册。',
            defaultVerdict: 'ok'   // 演示：默认赞成，按钮浅绿高亮并标"默认"，可改
          },
          {
            id: 'D2', cid: '决策 D2', title: '跨设备同步为可选',
            body: 'MVP 不做云同步；后续作为可选项。',
            important: true        // 演示：重点高亮，左侧橙条 + "需确认"标签
          },
        ]
      },
      {
        title: '功能需求', tag: 'FR',
        items: [
          { id: 'FR-1', cid: 'FR-1', title: '新建待办', body: '一行输入即可新建；回车快速连续添加。', ac: ['空输入不创建', '新建后输入框保持聚焦'] },
          { id: 'FR-2', cid: 'FR-2', title: '完成 / 删除', body: '点击勾选完成；左滑删除。', ac: ['完成项有明显视觉区分', '删除有撤销机会'] },
          {
            id: 'FR-3', cid: 'FR-3', title: '按状态筛选',
            body: '全部 / 未完成 / 已完成 三个筛选。', ac: ['切换筛选即时生效'],
            important: true, defaultVerdict: 'q'  // 演示：重点 + 默认疑问
          },
        ]
      },
    ]
  },

  // ② 原型：screens[].widgets[]，坐标 x/y/w/h 为相对手机内屏(约 340×720)的 px
  //    cls: box|solid|bigbtn|bar|text|label|pill；goto 指定点击跳转的 screen id
  proto: {
    note: '低保真框线图示例：预览点蓝色控件跳页 / 编辑拖动控件 / 批注点页面留评论。',
    screens: [
      {
        id: 'list', name: '① 待办列表',
        widgets: [
          { id: 'title', cls: 'label', x: 20, y: 34, w: 200, h: 24, text: '今天' },
          { id: 'filter', cls: 'pill', x: 200, y: 32, w: 120, h: 28, text: '全部 ▾' },
          { id: 'input', cls: 'box', x: 20, y: 74, w: 300, h: 40, text: '＋ 添加一项待办…' },
          { id: 't1', cls: 'box nav', x: 20, y: 128, w: 300, h: 48, text: '☐ 写周报', goto: 'detail' },
          { id: 't2', cls: 'box', x: 20, y: 184, w: 300, h: 48, text: '☑ 买牛奶（已完成）' },
          { id: 't3', cls: 'box', x: 20, y: 240, w: 300, h: 48, text: '☐ 预约牙医' },
          { id: 'fab', cls: 'bigbtn', x: 244, y: 596, w: 76, h: 76, text: '＋' },
        ]
      },
      {
        id: 'detail', name: '② 待办详情',
        widgets: [
          { id: 'back', cls: 'solid nav', x: 14, y: 30, w: 44, h: 32, text: '‹', goto: 'list' },
          { id: 'title', cls: 'label', x: 66, y: 34, w: 200, h: 24, text: '写周报' },
          { id: 'note', cls: 'box', x: 20, y: 80, w: 300, h: 120, text: '备注：本周进展 + 下周计划' },
          { id: 'due', cls: 'pill', x: 20, y: 216, w: 160, h: 28, text: '⏰ 周五 18:00' },
          { id: 'done', cls: 'solid', x: 20, y: 600, w: 300, h: 46, text: '标记完成' },
        ]
      },
    ]
  },

  // ③ 架构：diagrams[].mermaid（Mermaid 语法）+ assertions[] 逐条勾"符合/不符合"
  //    新增可选：diagrams[].rationale（原理说明折叠）、arch.alternatives（备选方案对比）
  arch: {
    intro: '看图 + 逐条确认断言是否符合预期。',
    diagrams: [
      {
        id: 'flow', title: '数据流',
        mermaid: `graph TD
  UI["Compose UI"] --> VM["ViewModel StateFlow"]
  VM --> Repo["Repository"]
  Repo --> DB["Room 本地数据库"]
  Repo -.可选.-> Sync["云同步 后续"]`,
        // 演示：给技术小白的原理说明，折叠展示
        rationale: '界面（UI）产生操作事件，交给 ViewModel 处理业务逻辑；ViewModel 通过 Repository 读写数据库，不直接接触底层；数据库选用 Room（SQLite 封装），数据只存本地，无需联网。虚线表示云同步是未来可选功能，MVP 不做。',
        defaultVerdict: 'ok'  // 演示：图默认赞成
      },
    ],
    assertions: [
      { id: 'A1', text: '数据只存本地 Room，无需联网即可用。', defaultVerdict: 'ok' },
      { id: 'A2', text: '云同步是后续可选项，不在 MVP。', important: true },  // 演示：重点断言
    ],
    // 演示：备选方案对比，chosen:true 标"✓ 选定"
    alternatives: [
      { id: 'alt-room', title: 'Room（SQLite）', desc: '官方 Android 持久化方案，成熟稳定，无需网络，查询灵活。', chosen: true },
      { id: 'alt-datastore', title: 'DataStore', desc: '适合简单键值对，不支持复杂查询，不适合列表型待办。', chosen: false },
      { id: 'alt-firebase', title: 'Firebase Firestore', desc: '云端实时同步，但强依赖网络，违背本地优先原则。', chosen: false },
    ]
  },

  // ⑥ 交互完整性自查（新面 · 示例）：四组检查项逐条表态
  //    journey: 用户旅程七段式（覆盖/明确不做/待定）
  //    frSlots: 每条 FR 的三件套（states/inverseFlow/errorRecovery）
  //    wildFeatures: 建了但没确认的功能（补需求/删功能/待定）
  //    reconcile: 稿↔FR↔代码 三方对账（已对齐/需修改/待定）
  completeness: {
    note: '示例项目·待办清单 App ── 交互完整性自查演示。',
    journey: [
      { id: 'J1', label: '首次使用', body: '安装后引导 → 创建第一条待办。', defaultVerdict: 'ok' },
      { id: 'J2', label: '日常使用', body: '打开 → 增删改查 → 筛选。', defaultVerdict: 'ok' },
      { id: 'J3', label: '数据迁移 / 跨设备', body: '换手机时数据如何转移。', gap: 'MVP 未做同步，迁移路径未定义。', defaultVerdict: 'q' },
    ],
    frSlots: [
      {
        id: 'FR2', fr: 'FR-2', title: '完成 / 删除',
        states: '完成 ☑ 与未完成 ☐ 有视觉区分',
        inverseFlow: '删除有撤销（AC 已写）',
        errorRecovery: '无（本地操作无需）',
        defaultVerdict: 'ok'
      },
      {
        id: 'FR3', fr: 'FR-3', title: '按状态筛选',
        states: '全部/未完成/已完成 三态',
        inverseFlow: null,
        errorRecovery: '筛选结果为空时的空态未定义',
        note: '空态（筛选无结果）的界面设计缺失。',
        defaultVerdict: 'no'
      },
    ],
    wildFeatures: [
      { id: 'B1', title: '待办详情页', body: '详情页（备注+截止时间）已建原型，但 PRD 无对应 FR。', risk: '功能范围未对齐。' },
    ],
    reconcile: [
      { id: 'RC1', type: 'spec-only', title: '截止时间控件', spec: '详情页原型有「⏰ 周五 18:00」截止时间 pill', code: 'PRD 和代码均无截止时间需求', action: '补 FR 或从原型中移除。' },
      { id: 'RC2', type: 'mismatch', title: '删除方式', spec: '原型：左滑删除', code: 'AC 写的是"左滑删除"，但无原型验证', action: '确认交互后统一稿和 AC。', defaultVerdict: 'q' },
    ],
  },

  // ④ 测试：scenarios[]（带 impact 业务影响）+ cases[]（AC + Gherkin）
  test: {
    intro: '关键场景 + 验收标准用例示例。',
    scenarios: [
      { id: 'S1', name: '无网络打开', impact: '断网就打不开会很糟', expect: '断网也能正常增删改查本地待办', defaultVerdict: 'ok' },
      { id: 'S2', name: '误删恢复', impact: '误删任务无法找回', expect: '删除后短时间内可撤销', important: true },
    ],
    cases: [
      { id: 'AC2.2', fr: 'FR-2', title: '删除可撤销', gherkin: '假设 列表里有一条待办\n当 用户删除它\n那么 顶部出现"已删除 · 撤销"提示\n并且 点撤销后该待办恢复' },
      { id: 'AC3.1', fr: 'FR-3', title: '筛选即时生效', gherkin: '假设 同时有已完成和未完成项\n当 切换到"未完成"筛选\n那么 只显示未完成项', important: true, defaultVerdict: 'q' },
    ]
  },
};
