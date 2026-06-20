/* 示例项目数据（开源 demo）。复制本文件为 projects/<你的项目>.js 改内容，
 * 然后用 ?p=<你的项目> 打开即可评审。数据结构见下方注释。 */
window.PROJECT_DATA = {
  id: 'demo',
  title: '示例 · 待办清单 App',

  // ① PRD：sections[].items[] 每条可被逐条评审（赞成/异议/疑问 + 评论）
  prd: {
    intro: '一个极简待办 App 的示例 PRD，用来演示这个确认工作台的 4 个面。',
    sections: [
      {
        title: '核心决策', tag: '基线',
        items: [
          { id: 'D1', cid: '决策 D1', title: '本地优先、无需登录', body: '数据存本地，首次打开即可用，不强制注册。' },
          { id: 'D2', cid: '决策 D2', title: '跨设备同步为可选', body: 'MVP 不做云同步；后续作为可选项。' },
        ]
      },
      {
        title: '功能需求', tag: 'FR',
        items: [
          { id: 'FR-1', cid: 'FR-1', title: '新建待办', body: '一行输入即可新建；回车快速连续添加。', ac: ['空输入不创建', '新建后输入框保持聚焦'] },
          { id: 'FR-2', cid: 'FR-2', title: '完成 / 删除', body: '点击勾选完成；左滑删除。', ac: ['完成项有明显视觉区分', '删除有撤销机会'] },
          { id: 'FR-3', cid: 'FR-3', title: '按状态筛选', body: '全部 / 未完成 / 已完成 三个筛选。', ac: ['切换筛选即时生效'] },
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
  arch: {
    intro: '看图 + 逐条确认断言是否符合预期。',
    diagrams: [
      {
        id: 'flow', title: '数据流',
        mermaid: `graph TD
  UI["Compose UI"] --> VM["ViewModel StateFlow"]
  VM --> Repo["Repository"]
  Repo --> DB["Room 本地数据库"]
  Repo -.可选.-> Sync["云同步 后续"]`
      },
    ],
    assertions: [
      { id: 'A1', text: '数据只存本地 Room，无需联网即可用。' },
      { id: 'A2', text: '云同步是后续可选项，不在 MVP。' },
    ]
  },

  // ④ 测试：scenarios[]（带 impact 业务影响）+ cases[]（AC + Gherkin）
  test: {
    intro: '关键场景 + 验收标准用例示例。',
    scenarios: [
      { id: 'S1', name: '无网络打开', impact: '断网就打不开会很糟', expect: '断网也能正常增删改查本地待办' },
      { id: 'S2', name: '误删恢复', impact: '误删任务无法找回', expect: '删除后短时间内可撤销' },
    ],
    cases: [
      { id: 'AC2.2', fr: 'FR-2', title: '删除可撤销', gherkin: '假设 列表里有一条待办\n当 用户删除它\n那么 顶部出现"已删除 · 撤销"提示\n并且 点撤销后该待办恢复' },
      { id: 'AC3.1', fr: 'FR-3', title: '筛选即时生效', gherkin: '假设 同时有已完成和未完成项\n当 切换到"未完成"筛选\n那么 只显示未完成项' },
    ]
  },
};
