'use strict';
(function () {
  const D = window.PROJECT_DATA;
  const view = document.getElementById('view');
  if (!D) { view.innerHTML = '<p style="padding:20px">未找到项目数据 (window.PROJECT_DATA)</p>'; return; }
  const LSK = 'prdstudio:' + D.id;
  document.getElementById('projTitle').textContent = '· ' + D.title;

  // 视图状态（提前声明，避免 applyTheme 初始化时的 TDZ）
  let curTab = 'prd', protoMode = 'preview', uiMode = 'preview';
  let curScreen = (D.proto && D.proto.screens[0]) ? D.proto.screens[0].id : null;

  // ---------- helpers ----------
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  function faceHead(t, d) { const h = el('div', 'faceHead'); h.appendChild(el('h1', null, esc(t))); if (d) h.appendChild(el('p', null, esc(d))); return h; }

  // ---------- toast ----------
  function toast(m) { const t = el('div', 'toast', esc(m)); document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
  function toastSaved() { toast('已保存 ✓'); }

  // ---------- rounds state ----------
  let rounds = [];
  try { rounds = JSON.parse(localStorage.getItem(LSK + ':rounds')) || []; } catch (e) { }
  function saveRounds() { localStorage.setItem(LSK + ':rounds', JSON.stringify(rounds)); }
  function currentRoundNum() { return rounds.length + 1; }

  // ---------- feedback state ----------
  let fb = {};
  try { fb = JSON.parse(localStorage.getItem(LSK + ':fb')) || {}; } catch (e) { }
  fb.verdicts = fb.verdicts || {}; fb.comments = fb.comments || []; fb.moves = fb.moves || {};
  function saveFb() { localStorage.setItem(LSK + ':fb', JSON.stringify(fb)); updateCount(); updateTabBadges(); updateRoundLabel(); }
  function saveFbWithToast() { saveFb(); toastSaved(); }

  // ---------- round label ----------
  function updateRoundLabel() {
    const lbl = document.getElementById('roundLabel');
    if (lbl) lbl.textContent = '第 ' + currentRoundNum() + ' 轮';
  }

  // ---------- count helpers ----------
  // 判断某条 verdict 是否"已填"（含 defaultVerdict 语义）
  function isVerdictFilled(refId, defaultVerdict) {
    const v = fb.verdicts[refId];
    if (v && (v.verdict || v.comment)) return true;
    if (!v && defaultVerdict) return true; // 有默认值视为已填
    return false;
  }

  // 统计各 face 已填条数（用于角标）
  function countByFace() {
    const counts = { prd: 0, proto: 0, arch: 0, test: 0, ui: 0, completeness: 0 };
    // verdicts
    for (const k in fb.verdicts) {
      const v = fb.verdicts[k];
      if (v && (v.verdict || v.comment) && v.face) counts[v.face] = (counts[v.face] || 0) + 1;
    }
    // 原型：defaultVerdict 不参与 proto 计数，仅计真实操作
    // 评论（proto / ui）
    fb.comments.forEach(c => {
      if (c.face === 'ui') counts.ui = (counts.ui || 0) + 1;
      else if (c.face === 'proto') counts.proto++;
    });
    counts.proto += Object.keys(fb.moves).length;
    // PRD defaultVerdict 计入
    if (D.prd) {
      D.prd.sections.forEach(sec => sec.items.forEach(it => {
        if (!fb.verdicts[it.id] && it.defaultVerdict) counts.prd++;
      }));
    }
    // arch defaultVerdict
    if (D.arch) {
      D.arch.assertions.forEach(a => {
        if (!fb.verdicts['arch-' + a.id] && a.defaultVerdict) counts.arch++;
      });
      D.arch.diagrams.forEach((dg, i) => {
        if (!fb.verdicts['arch-dg-' + (dg.id || i)] && dg.defaultVerdict) counts.arch++;
      });
    }
    // test defaultVerdict
    if (D.test) {
      D.test.scenarios.forEach(sc => { if (!fb.verdicts['test-' + sc.id] && sc.defaultVerdict) counts.test++; });
      D.test.cases.forEach(tc => { if (!fb.verdicts['case-' + tc.id] && tc.defaultVerdict) counts.test++; });
    }
    // completeness defaultVerdict
    if (D.completeness) {
      (D.completeness.journey || []).forEach(it => { if (!fb.verdicts['cmp-j-' + it.id] && it.defaultVerdict) counts.completeness++; });
      (D.completeness.frSlots || []).forEach(it => { if (!fb.verdicts['cmp-fr-' + it.id] && it.defaultVerdict) counts.completeness++; });
      (D.completeness.wildFeatures || []).forEach(it => { if (!fb.verdicts['cmp-wf-' + it.id] && it.defaultVerdict) counts.completeness++; });
      (D.completeness.reconcile || []).forEach(it => { if (!fb.verdicts['cmp-rc-' + it.id] && it.defaultVerdict) counts.completeness++; });
    }
    return counts;
  }

  function countFb() {
    let n = 0;
    for (const k in fb.verdicts) { const v = fb.verdicts[k]; if (v && (v.verdict || v.comment)) n++; }
    n += fb.comments.length; n += Object.keys(fb.moves).length;
    return n;
  }
  function updateCount() { document.getElementById('fbCount').textContent = countFb(); }

  // 更新各 tab 角标
  function updateTabBadges() {
    const counts = countByFace();
    const faces = ['prd', 'proto', 'arch', 'test', 'ui', 'completeness'];
    faces.forEach(face => {
      const btn = document.querySelector('#tabs button[data-tab="' + face + '"]');
      if (!btn) return;
      let badge = btn.querySelector('.tab-badge');
      const n = counts[face] || 0;
      if (n > 0) {
        if (!badge) { badge = el('span', 'tab-badge'); btn.appendChild(badge); }
        badge.textContent = n;
      } else {
        if (badge) badge.remove();
      }
    });
  }

  // ---------- theme ----------
  const themeBtn = document.getElementById('themeBtn');
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); themeBtn.textContent = t === 'dark' ? '☀️' : '🌙'; localStorage.setItem('prdstudio:theme', t); if (curTab === 'arch') renderArch(); }
  applyTheme(localStorage.getItem('prdstudio:theme') || 'light');
  themeBtn.onclick = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

  // ---------- verdict control (复用于 PRD / 架构 / 测试) ----------
  // item 可选字段：defaultVerdict: 'ok'|'no'|'q'，important: true
  function verdictCtl(refId, refLabel, face, item) {
    item = item || {};
    const defaultV = item.defaultVerdict || null;
    const important = !!item.important;

    const wrap = el('div');

    // important 标签
    if (important) {
      wrap.appendChild(el('span', 'important-tag', '需确认'));
    }

    const cur = fb.verdicts[refId] || {};
    // 有效态度：用户实际选择 > defaultVerdict
    const effectiveVerdict = cur.verdict || (cur.verdict === null ? null : defaultV);

    const row = el('div', 'verdict');
    [['ok', '✓ 赞成'], ['no', '✗ 异议'], ['q', '? 疑问']].forEach(([v, label]) => {
      const isActive = effectiveVerdict === v;
      const isDefault = !cur.verdict && defaultV === v;
      const b = el('button', 'vbtn' + (isActive ? ' on' : '') + (isDefault ? ' default-active' : ''));
      b.dataset.v = v; b.textContent = label;
      if (isDefault && !cur.verdict) {
        b.appendChild(el('span', 'default-hint', '默认'));
      }
      b.onclick = () => {
        const c = fb.verdicts[refId] || {};
        c.verdict = (c.verdict === v ? null : v);
        c.refLabel = refLabel; c.face = face;
        fb.verdicts[refId] = c;
        saveFb();
        toastSaved();
        // 重新渲染按钮状态
        const newEffective = c.verdict || (c.verdict === null ? null : defaultV);
        [...row.children].forEach(x => {
          const isNowActive = x.dataset.v === newEffective;
          const isNowDefault = !c.verdict && defaultV === x.dataset.v;
          x.className = 'vbtn' + (isNowActive ? ' on' : '') + (isNowDefault ? ' default-active' : '');
          // 移除旧 default-hint，按需加
          const oldHint = x.querySelector('.default-hint');
          if (oldHint) oldHint.remove();
          if (isNowDefault && !c.verdict) x.appendChild(el('span', 'default-hint', '默认'));
        });
        ta.classList.toggle('show', !!(c.verdict === 'no' || c.verdict === 'q' || c.comment));
      };
      row.appendChild(b);
    });
    wrap.appendChild(row);
    const ta = el('textarea', 'cmt' + ((cur.verdict === 'no' || cur.verdict === 'q' || cur.comment) ? ' show' : ''));
    ta.placeholder = '补充说明（异议/疑问/想改成…）'; ta.value = cur.comment || '';
    ta.oninput = () => {
      const c = fb.verdicts[refId] || {};
      c.comment = ta.value.trim() || null; c.refLabel = refLabel; c.face = face;
      fb.verdicts[refId] = c; saveFb();
    };
    ta.onblur = () => { if (ta.value.trim()) toastSaved(); };
    wrap.appendChild(ta);
    return wrap;
  }

  // ---------- 分块保存按钮 ----------
  function makePartialSaveBtn(face) {
    const btn = el('button', 'partial-save-btn', '✓ 保存本块');
    btn.onclick = async () => {
      const payload = buildPayload();
      payload.partial = true;
      payload.face = face;
      try {
        const r = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || 'fail');
        toast('本块已保存到服务器 ✓');
      } catch (e) { toast('本块已保存 ✓（服务器未连接，已存本地）'); }
    };
    return btn;
  }

  // ---------- tabs & modes ----------
  const tabs = document.getElementById('tabs');
  const protoModes = document.getElementById('protoModes');
  const uiModes = document.getElementById('uiModes');
  tabs.onclick = (e) => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); };
  function setTab(t) {
    curTab = t;
    [...tabs.children].forEach(b => b.classList.toggle('active', b.dataset.tab === t));
    protoModes.style.display = t === 'proto' ? 'flex' : 'none';
    if (uiModes) uiModes.style.display = t === 'ui' ? 'flex' : 'none';
    render();
  }
  protoModes.onclick = (e) => { const b = e.target.closest('button[data-mode]'); if (!b) return; protoMode = b.dataset.mode; [...protoModes.children].forEach(x => x.classList.toggle('active', x === b)); renderProto(); };
  if (uiModes) {
    uiModes.onclick = (e) => { const b = e.target.closest('button[data-mode]'); if (!b) return; uiMode = b.dataset.mode; [...uiModes.children].forEach(x => x.classList.toggle('active', x === b)); renderUI(); };
  }
  function setBodyMode() { document.body.className = curTab === 'proto' ? ('mode-proto-' + protoMode) : (curTab === 'ui' ? ('mode-ui-' + uiMode) : ''); }

  function render() {
    setBodyMode();
    if (curTab === 'prd') renderPRD();
    else if (curTab === 'proto') renderProto();
    else if (curTab === 'arch') renderArch();
    else if (curTab === 'test') renderTest();
    else if (curTab === 'ui') renderUI();
    else if (curTab === 'completeness') renderCompleteness();
  }

  // ---------- PRD ----------
  function renderPRD() {
    const root = el('div');
    root.appendChild(faceHead('PRD 评审', D.prd.intro));
    root.appendChild(el('div', 'legend', '逐条给态度：✓赞成 / ✗异议 / ?疑问，可写补充。异议和疑问会自动展开输入框。'));
    root.appendChild(makePartialSaveBtn('prd'));
    D.prd.sections.forEach(sec => {
      const s = el('div', 'section');
      s.appendChild(el('h2', null, esc(sec.title) + (sec.tag ? ` <span class="tag">${esc(sec.tag)}</span>` : '')));
      sec.items.forEach(it => {
        const c = el('div', 'card' + (it.important ? ' card-important' : ''));
        if (it.important) { c.appendChild(el('div', 'important-bar')); }
        c.appendChild(el('div', 'cid', esc(it.cid || it.id)));
        if (it.title) c.appendChild(el('div', 'ctitle', esc(it.title)));
        if (it.body) c.appendChild(el('div', 'cbody', esc(it.body)));
        if (it.list) { const ul = el('ul'); it.list.forEach(li => ul.appendChild(el('li', null, esc(li)))); c.appendChild(ul); }
        if (it.ac) { const acd = el('div', 'ac'); acd.innerHTML = '<b>验收标准</b>'; it.ac.forEach(a => acd.appendChild(el('div', null, '• ' + esc(a)))); c.appendChild(acd); }
        c.appendChild(verdictCtl(it.id, it.cid || it.id, 'prd', it));
        s.appendChild(c);
      });
      root.appendChild(s);
    });
    view.replaceChildren(root);
  }

  // ---------- 原型 ----------
  let ix = null;
  function ensureInteract() {
    if (ix || typeof interact === 'undefined') return;
    ix = interact('.w')
      .draggable({ listeners: { move: gMove, end: gEnd } })
      .resizable({ edges: { right: true, bottom: true }, listeners: { move: rMove, end: gEnd } });
  }
  function gMove(ev) { const t = ev.target; t.style.left = ((parseFloat(t.style.left) || 0) + ev.dx) + 'px'; t.style.top = ((parseFloat(t.style.top) || 0) + ev.dy) + 'px'; }
  function rMove(ev) { const t = ev.target; t.style.width = ev.rect.width + 'px'; t.style.height = ev.rect.height + 'px'; t.style.left = ((parseFloat(t.style.left) || 0) + ev.deltaRect.left) + 'px'; t.style.top = ((parseFloat(t.style.top) || 0) + ev.deltaRect.top) + 'px'; }
  function gEnd(ev) { const sc = D.proto.screens.find(s => s.id === curScreen); recordMove(sc, ev.target); }
  function recordMove(sc, t) {
    const mk = sc.id + ':' + t.dataset.wid;
    fb.moves[mk] = { geometry: { x: parseFloat(t.style.left) || 0, y: parseFloat(t.style.top) || 0, w: parseFloat(t.style.width) || 0, h: parseFloat(t.style.height) || 0 }, screenId: sc.id, refLabel: sc.name + ' / ' + t.dataset.wid };
    t.classList.add('moved'); saveFb();
  }
  function makeWidget(sc, w) {
    const e = el('div', 'w ' + (w.cls || 'box'));
    const mk = sc.id + ':' + w.id;
    const g = fb.moves[mk] ? fb.moves[mk].geometry : w;
    e.style.left = g.x + 'px'; e.style.top = g.y + 'px'; e.style.width = g.w + 'px'; e.style.height = g.h + 'px';
    e.dataset.wid = w.id;
    e.innerHTML = esc(w.text || '').replace(/\n/g, '<br>');
    if (fb.moves[mk]) e.classList.add('moved');
    if (w.goto) { e.dataset.goto = w.goto; e.classList.add('nav'); }
    e.addEventListener('click', () => { if (protoMode === 'preview' && w.goto) { curScreen = w.goto; renderProto(); } });
    return e;
  }
  function makePin(c) {
    const p = el('div', 'pin', '📌'); p.style.left = c.xPct + '%'; p.style.top = c.yPct + '%'; p.title = c.comment;
    p.onclick = (e) => { e.stopPropagation(); openComment(c); };
    return p;
  }
  function renderProto() {
    setBodyMode();
    const root = el('div');
    root.appendChild(faceHead('交互原型（低保真框线图）', D.proto.note));
    const bar = el('div', 'protoBar');
    const sel = el('select');
    D.proto.screens.forEach(sc => { const o = el('option'); o.value = sc.id; o.textContent = sc.name; sel.appendChild(o); });
    sel.value = curScreen; sel.onchange = () => { curScreen = sel.value; renderProto(); };
    bar.appendChild(sel);
    const hints = { preview: '预览：点蓝色控件可跳转页面', edit: '编辑：拖动 / 右下角拉伸控件，改动记成反馈', annotate: '批注：点页面任意位置加评论' };
    bar.appendChild(el('span', 'hint', hints[protoMode]));
    root.appendChild(bar);
    const wrap = el('div', 'phoneWrap');
    const phone = el('div', 'phone'); phone.appendChild(el('div', 'notch'));
    const sc = D.proto.screens.find(s => s.id === curScreen) || D.proto.screens[0];
    const screen = el('div', 'screen annot-target'); screen.dataset.screen = sc.id;
    sc.widgets.forEach(w => screen.appendChild(makeWidget(sc, w)));
    fb.comments.filter(c => c.face === 'proto' && c.screenId === sc.id).forEach(c => screen.appendChild(makePin(c)));
    if (protoMode === 'annotate') {
      screen.addEventListener('click', (ev) => {
        if (protoMode !== 'annotate') return;
        if (ev.target.classList.contains('pin')) return;
        const r = screen.getBoundingClientRect();
        const target = ev.target.closest('.w');
        openComment({ face: 'proto', screenId: sc.id, xPct: ((ev.clientX - r.left) / r.width) * 100, yPct: ((ev.clientY - r.top) / r.height) * 100, refLabel: sc.name + (target ? (' / ' + target.dataset.wid) : '') });
      });
    }
    phone.appendChild(screen); wrap.appendChild(phone); root.appendChild(wrap);
    view.replaceChildren(root);
    ensureInteract();
    if (ix) { ix.draggable({ enabled: protoMode === 'edit' }); ix.resizable({ enabled: protoMode === 'edit' }); }
  }

  // ---------- 架构 ----------
  function renderArch() {
    const root = el('div');
    root.appendChild(faceHead('架构确认', D.arch.intro));
    root.appendChild(el('div', 'legend', '看图 + 逐条勾"符合/不符合"。不必懂符号，只判断描述是否符合你的预期。'));
    root.appendChild(makePartialSaveBtn('arch'));
    D.arch.diagrams.forEach((dg, i) => {
      const s = el('div', 'section');
      s.appendChild(el('h2', null, esc(dg.title)));
      const box = el('div', 'diagram');
      box.innerHTML = '<pre class="mermaid">' + esc(dg.mermaid) + '</pre>';
      s.appendChild(box);

      // rationale 折叠说明（可选字段）
      if (dg.rationale) {
        const det = el('details', 'fold rationale-fold');
        det.appendChild(el('summary', null, '💡 原理说明（展开）'));
        det.appendChild(el('div', 'rationale-body', esc(dg.rationale)));
        s.appendChild(det);
      }

      const c = el('div', 'card' + (dg.important ? ' card-important' : ''));
      if (dg.important) c.appendChild(el('div', 'important-bar'));
      c.appendChild(el('div', 'cid', '对这张图的意见'));
      c.appendChild(verdictCtl('arch-dg-' + (dg.id || i), '图：' + dg.title, 'arch', dg));
      s.appendChild(c);
      root.appendChild(s);
    });
    const sa = el('div', 'section');
    sa.appendChild(el('h2', null, '关键断言逐条确认 <span class="tag">断言</span>'));
    const card = el('div', 'card');
    D.arch.assertions.forEach(a => {
      const block = el('div', 'assert' + (a.important ? ' assert-important' : '')); block.style.flexDirection = 'column';
      if (a.important) { const bar = el('div', 'important-bar assert-bar'); block.appendChild(bar); }
      block.appendChild(el('div', 'atext', '<b>' + esc(a.id) + '</b> ' + esc(a.text)));
      block.appendChild(verdictCtl('arch-' + a.id, a.id, 'arch', a));
      card.appendChild(block);
    });
    sa.appendChild(card); root.appendChild(sa);

    // 备选方案对比（可选字段 arch.alternatives）
    if (D.arch.alternatives && D.arch.alternatives.length) {
      const salt = el('div', 'section');
      salt.appendChild(el('h2', null, '备选方案对比 <span class="tag">架构决策</span>'));
      const altGrid = el('div', 'alt-grid');
      D.arch.alternatives.forEach(alt => {
        const ac = el('div', 'alt-card' + (alt.chosen ? ' alt-chosen' : ''));
        const header = el('div', 'alt-header');
        header.appendChild(el('span', 'alt-title', esc(alt.title)));
        if (alt.chosen) header.appendChild(el('span', 'alt-chosen-tag', '✓ 选定'));
        ac.appendChild(header);
        ac.appendChild(el('div', 'alt-desc', esc(alt.desc)));
        altGrid.appendChild(ac);
      });
      salt.appendChild(altGrid);
      root.appendChild(salt);
    }

    view.replaceChildren(root);
    try {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default' });
      mermaid.run({ querySelector: '.mermaid' });
    } catch (e) { console.warn('mermaid', e); }
  }

  // ---------- 测试 ----------
  function hl(g) { return esc(g).replace(/(^|\n)\s*(Given|When|Then|And|But|假设|当|那么|并且|而且)/g, (m, p1, p2) => p1 + '<span class="kw">' + p2 + '</span>'); }
  function renderTest() {
    const root = el('div');
    root.appendChild(faceHead('测试场景确认', D.test.intro));
    root.appendChild(makePartialSaveBtn('test'));
    const s1 = el('div', 'section');
    s1.appendChild(el('h2', null, '关键场景 <span class="tag">逐条确认</span>'));
    D.test.scenarios.forEach(sc => {
      const c = el('div', 'card' + (sc.important ? ' card-important' : ''));
      if (sc.important) c.appendChild(el('div', 'important-bar'));
      c.appendChild(el('div', 'ctitle', esc(sc.name)));
      c.appendChild(el('div', 'cbody', '预期：' + esc(sc.expect)));
      if (sc.impact) { const im = el('div', 'ac'); im.innerHTML = '<b style="color:var(--bad)">若不处理：</b>' + esc(sc.impact); c.appendChild(im); }
      c.appendChild(verdictCtl('test-' + sc.id, sc.name, 'test', sc));
      s1.appendChild(c);
    });
    root.appendChild(s1);
    const s2 = el('div', 'section');
    s2.appendChild(el('h2', null, '验收标准 ↔ 用例 <span class="tag">AC</span>'));
    D.test.cases.forEach(tc => {
      const c = el('div', 'card' + (tc.important ? ' card-important' : ''));
      if (tc.important) c.appendChild(el('div', 'important-bar'));
      c.appendChild(el('div', 'cid', esc(tc.id) + (tc.fr ? (' · ' + esc(tc.fr)) : '')));
      c.appendChild(el('div', 'ctitle', esc(tc.title)));
      if (tc.gherkin) {
        const d = el('details', 'fold');
        d.appendChild(el('summary', null, '展开 Given-When-Then'));
        d.appendChild(el('div', 'gherkin', hl(tc.gherkin)));
        c.appendChild(d);
      }
      c.appendChild(verdictCtl('case-' + tc.id, tc.id, 'test', tc));
      s2.appendChild(c);
    });
    root.appendChild(s2);
    view.replaceChildren(root);
  }

  // ---------- UI 设计 ----------
  function renderUI() {
    setBodyMode();
    if (!D.ui) { view.innerHTML = ''; return; }
    const root = el('div');
    root.appendChild(faceHead('UI 设计', D.ui.note));
    const bar = el('div', 'protoBar');
    const hintMap = { preview: '预览：iframe 可交互', annotate: '批注：点击画面任意位置加评论' };
    bar.appendChild(el('span', 'hint', hintMap[uiMode] || ''));
    root.appendChild(bar);

    const wrap = el('div', 'phoneWrap phoneWrap--multi');
    D.ui.screens.forEach(sc => {
      const phoneWrap = el('div', 'uiPhoneWrap');

      // 手机外框
      const phone = el('div', 'phone');
      phone.appendChild(el('div', 'notch'));

      // iframe 容器（绝对定位充满 .phone 内容区）
      const inner = el('div', 'ui-screen-inner');

      const iframe = el('iframe', 'ui-iframe');
      iframe.src = sc.src;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'auto');
      inner.appendChild(iframe);

      // 透明浮层（覆盖 iframe，用于批注点击捕获和钉子渲染）
      const overlay = el('div', 'ui-annot-overlay');
      // 渲染已有批注钉子
      fb.comments.filter(c => c.face === 'ui' && c.screenId === sc.id).forEach(c => {
        overlay.appendChild(makePin(c));
      });
      // 批注模式：捕获点击
      if (uiMode === 'annotate') {
        overlay.style.pointerEvents = 'auto';
        overlay.addEventListener('click', (ev) => {
          if (ev.target.classList.contains('pin')) return;
          const r = overlay.getBoundingClientRect();
          openComment({ face: 'ui', screenId: sc.id, xPct: ((ev.clientX - r.left) / r.width) * 100, yPct: ((ev.clientY - r.top) / r.height) * 100, refLabel: sc.name });
        });
      } else {
        overlay.style.pointerEvents = 'none';
      }
      inner.appendChild(overlay);

      phone.appendChild(inner);
      const label = el('div', 'ui-screen-label', esc(sc.name));
      phoneWrap.appendChild(phone);
      phoneWrap.appendChild(label);
      wrap.appendChild(phoneWrap);
    });
    root.appendChild(wrap);
    view.replaceChildren(root);
  }

  // ---------- 交互完整性自查 ----------
  function renderCompleteness() {
    if (!D.completeness) { view.innerHTML = ''; return; }
    const C = D.completeness;
    const root = el('div');
    root.appendChild(faceHead('交互完整性自查', C.note || '逐条审查用户旅程、FR 三件套、野生功能与三方对账，确保"建了必有确认"。'));
    root.appendChild(el('div', 'legend', '四组检查项逐条表态：覆盖/符合 · 缺失/待定 · 删功能 ——每条都必须有态度，不允许留空。'));
    root.appendChild(makePartialSaveBtn('completeness'));

    // ── Section 1：用户旅程七段 ──
    if (C.journey && C.journey.length) {
      const s = el('div', 'section');
      s.appendChild(el('h2', null, '用户旅程覆盖 <span class="tag">七段式</span>'));
      const hint = el('div', 'cmp-hint', '每段必须表态：覆盖 / 明确不做 / 待定。"待定"意味着需要明确决策。');
      s.appendChild(hint);
      C.journey.forEach(it => {
        const c = el('div', 'card' + (it.important ? ' card-important' : ''));
        if (it.important) c.appendChild(el('div', 'important-bar'));
        c.appendChild(el('div', 'cid', esc(it.id)));
        c.appendChild(el('div', 'ctitle', esc(it.label)));
        if (it.body) c.appendChild(el('div', 'cbody', esc(it.body)));
        if (it.gap) {
          const gd = el('div', 'ac cmp-gap');
          gd.innerHTML = '<b>缺口：</b>' + esc(it.gap);
          c.appendChild(gd);
        }
        // journey 的 verdict 语义：ok=覆盖 / no=明确不做 / q=待定
        const journeyItem = Object.assign({}, it, { defaultVerdict: it.defaultVerdict || null });
        const vc = verdictCtlCustom('cmp-j-' + it.id, it.id + ' ' + it.label, 'completeness', journeyItem, [['ok', '覆盖'], ['no', '明确不做'], ['q', '待定']]);
        c.appendChild(vc);
        s.appendChild(c);
      });
      root.appendChild(s);
    }

    // ── Section 2：FR 三件套审查 ──
    if (C.frSlots && C.frSlots.length) {
      const s = el('div', 'section');
      s.appendChild(el('h2', null, 'FR 三件套审查 <span class="tag">状态·反向流·错误恢复</span>'));
      const hint = el('div', 'cmp-hint', '每条 FR 的 states（所有状态含失败/空/待处理）/ inverseFlow（有创建是否有删除/撤销/重试）/ errorRecovery（AI 类分错了用户怎么救）是否齐全。');
      s.appendChild(hint);
      C.frSlots.forEach(it => {
        const c = el('div', 'card' + (it.important ? ' card-important' : ''));
        if (it.important) c.appendChild(el('div', 'important-bar'));
        c.appendChild(el('div', 'cid', esc(it.fr)));
        c.appendChild(el('div', 'ctitle', esc(it.title)));
        // 三件套详情
        const detail = el('div', 'cmp-slots');
        if (it.states !== undefined) {
          const row = el('div', 'cmp-slot-row');
          row.appendChild(el('span', 'cmp-slot-label', 'States：'));
          row.appendChild(el('span', 'cmp-slot-val ' + (it.states ? 'cmp-ok' : 'cmp-miss'), it.states || '缺失'));
          detail.appendChild(row);
        }
        if (it.inverseFlow !== undefined) {
          const row = el('div', 'cmp-slot-row');
          row.appendChild(el('span', 'cmp-slot-label', '反向流：'));
          row.appendChild(el('span', 'cmp-slot-val ' + (it.inverseFlow ? 'cmp-ok' : 'cmp-miss'), it.inverseFlow || '缺失'));
          detail.appendChild(row);
        }
        if (it.errorRecovery !== undefined) {
          const row = el('div', 'cmp-slot-row');
          row.appendChild(el('span', 'cmp-slot-label', '错误恢复：'));
          row.appendChild(el('span', 'cmp-slot-val ' + (it.errorRecovery ? 'cmp-ok' : 'cmp-miss'), it.errorRecovery || '缺失'));
          detail.appendChild(row);
        }
        c.appendChild(detail);
        if (it.note) { const nd = el('div', 'ac'); nd.innerHTML = '<b>备注：</b>' + esc(it.note); c.appendChild(nd); }
        // verdict 语义：ok=齐全 / no=缺项 / q=待核实
        const vc = verdictCtlCustom('cmp-fr-' + it.id, it.fr + ' ' + it.title, 'completeness', it, [['ok', '三件套齐全'], ['no', '有缺项'], ['q', '待核实']]);
        c.appendChild(vc);
        s.appendChild(c);
      });
      root.appendChild(s);
    }

    // ── Section 3：野生功能（建了但没确认） ──
    if (C.wildFeatures && C.wildFeatures.length) {
      const s = el('div', 'section');
      s.appendChild(el('h2', null, '野生功能清单 <span class="tag">建了但没确认</span>'));
      const hint = el('div', 'cmp-hint', '每条必须二选一：补需求（补写 FR/AC）或 删功能（从代码移除）。不允许留在灰色地带。');
      s.appendChild(hint);
      C.wildFeatures.forEach(it => {
        const c = el('div', 'card' + (it.important ? ' card-important' : ''));
        if (it.important) c.appendChild(el('div', 'important-bar'));
        c.appendChild(el('div', 'cid', esc(it.id)));
        c.appendChild(el('div', 'ctitle', esc(it.title)));
        if (it.body) c.appendChild(el('div', 'cbody', esc(it.body)));
        if (it.risk) {
          const rd = el('div', 'ac');
          rd.innerHTML = '<b style="color:var(--bad)">风险：</b>' + esc(it.risk);
          c.appendChild(rd);
        }
        // verdict 语义：ok=补需求 / no=删功能 / q=待定
        const vc = verdictCtlCustom('cmp-wf-' + it.id, it.id + ' ' + it.title, 'completeness', it, [['ok', '补需求'], ['no', '删功能'], ['q', '待定']]);
        c.appendChild(vc);
        s.appendChild(c);
      });
      root.appendChild(s);
    }

    // ── Section 4：三方对账（稿↔FR↔代码） ──
    if (C.reconcile && C.reconcile.length) {
      const s = el('div', 'section');
      s.appendChild(el('h2', null, '稿↔FR↔代码 三方对账 <span class="tag">对账</span>'));
      const hint = el('div', 'cmp-hint', '标出"稿有代码无"/"代码有需求无"/"稿A代码B"的不一致项，逐条决策。');
      s.appendChild(hint);
      C.reconcile.forEach(it => {
        const c = el('div', 'card' + (it.important ? ' card-important' : ''));
        if (it.important) c.appendChild(el('div', 'important-bar'));
        c.appendChild(el('div', 'cid', esc(it.id)));
        // 类型标签
        const typeMap = { 'spec-only': '稿有代码无', 'code-only': '代码有需求无', 'mismatch': '稿A代码B' };
        if (it.type) {
          c.appendChild(el('span', 'cmp-rc-type cmp-rc-' + it.type, typeMap[it.type] || esc(it.type)));
        }
        c.appendChild(el('div', 'ctitle', esc(it.title)));
        if (it.spec) { const d = el('div', 'cbody'); d.innerHTML = '<b>稿：</b>' + esc(it.spec); c.appendChild(d); }
        if (it.code) { const d = el('div', 'cbody'); d.innerHTML = '<b>代码：</b>' + esc(it.code); c.appendChild(d); }
        if (it.action) { const d = el('div', 'ac'); d.innerHTML = '<b>建议：</b>' + esc(it.action); c.appendChild(d); }
        // verdict 语义：ok=已对齐 / no=需修改 / q=待定
        const vc = verdictCtlCustom('cmp-rc-' + it.id, it.id + ' ' + it.title, 'completeness', it, [['ok', '已对齐'], ['no', '需修改'], ['q', '待定']]);
        c.appendChild(vc);
        s.appendChild(c);
      });
      root.appendChild(s);
    }

    view.replaceChildren(root);
  }

  // verdictCtl 的扩展版，支持自定义按钮标签（覆盖/缺失/待定等）
  function verdictCtlCustom(refId, refLabel, face, item, btnDefs) {
    item = item || {};
    const defaultV = item.defaultVerdict || null;
    const important = !!item.important;
    const wrap = el('div');
    if (important) wrap.appendChild(el('span', 'important-tag', '需确认'));
    const cur = fb.verdicts[refId] || {};
    const effectiveVerdict = cur.verdict || (cur.verdict === null ? null : defaultV);
    const row = el('div', 'verdict');
    btnDefs.forEach(([v, label]) => {
      const isActive = effectiveVerdict === v;
      const isDefault = !cur.verdict && defaultV === v;
      const b = el('button', 'vbtn' + (isActive ? ' on' : '') + (isDefault ? ' default-active' : ''));
      b.dataset.v = v; b.textContent = label;
      if (isDefault && !cur.verdict) b.appendChild(el('span', 'default-hint', '默认'));
      b.onclick = () => {
        const c = fb.verdicts[refId] || {};
        c.verdict = (c.verdict === v ? null : v);
        c.refLabel = refLabel; c.face = face;
        fb.verdicts[refId] = c;
        saveFb(); toastSaved();
        const newEffective = c.verdict || (c.verdict === null ? null : defaultV);
        [...row.children].forEach(x => {
          const isNowActive = x.dataset.v === newEffective;
          const isNowDefault = !c.verdict && defaultV === x.dataset.v;
          x.className = 'vbtn' + (isNowActive ? ' on' : '') + (isNowDefault ? ' default-active' : '');
          const oldHint = x.querySelector('.default-hint');
          if (oldHint) oldHint.remove();
          if (isNowDefault && !c.verdict) x.appendChild(el('span', 'default-hint', '默认'));
        });
        ta.classList.toggle('show', !!(c.verdict === 'no' || c.verdict === 'q' || c.comment));
      };
      row.appendChild(b);
    });
    wrap.appendChild(row);
    const ta = el('textarea', 'cmt' + ((cur.verdict === 'no' || cur.verdict === 'q' || cur.comment) ? ' show' : ''));
    ta.placeholder = '补充说明（缺哪项 / 改成什么 / 优先级…）'; ta.value = cur.comment || '';
    ta.oninput = () => {
      const c = fb.verdicts[refId] || {};
      c.comment = ta.value.trim() || null; c.refLabel = refLabel; c.face = face;
      fb.verdicts[refId] = c; saveFb();
    };
    ta.onblur = () => { if (ta.value.trim()) toastSaved(); };
    wrap.appendChild(ta);
    return wrap;
  }

  // ---------- 评论气泡 ----------
  const pop = document.getElementById('commentPop');
  let popCtx = null;
  function openComment(ctx) {
    popCtx = ctx;
    document.getElementById('popText').value = ctx.comment || '';
    document.getElementById('popDelete').style.display = ctx.id ? 'inline-block' : 'none';
    pop.style.left = '50%'; pop.style.top = '50%'; pop.style.transform = 'translate(-50%,-50%)';
    pop.classList.remove('hidden');
    setTimeout(() => document.getElementById('popText').focus(), 30);
  }
  document.getElementById('popSave').onclick = () => {
    const txt = document.getElementById('popText').value.trim();
    if (popCtx.id) { const c = fb.comments.find(x => x.id === popCtx.id); if (c) { if (txt) c.comment = txt; else fb.comments = fb.comments.filter(x => x.id !== popCtx.id); } }
    else if (txt) { fb.comments.push({ id: 'c' + Date.now() + Math.floor(Math.random() * 1e4), face: popCtx.face, screenId: popCtx.screenId, xPct: popCtx.xPct, yPct: popCtx.yPct, refLabel: popCtx.refLabel, comment: txt }); }
    saveFb(); toastSaved(); pop.classList.add('hidden');
    if (curTab === 'proto') renderProto();
    else if (curTab === 'ui') renderUI();
  };
  document.getElementById('popDelete').onclick = () => {
    if (popCtx && popCtx.id) { fb.comments = fb.comments.filter(x => x.id !== popCtx.id); saveFb(); }
    pop.classList.add('hidden');
    if (curTab === 'proto') renderProto();
    else if (curTab === 'ui') renderUI();
  };
  document.getElementById('popCancel').onclick = () => pop.classList.add('hidden');

  // ---------- 历史轮次面板 ----------
  const histDlg = document.getElementById('histDialog');
  let histViewIdx = -1; // -1 表示最新一轮

  function openHistPanel() {
    if (!rounds.length) {
      histViewIdx = -1;
      renderHistContent();
      histDlg.classList.remove('hidden');
      return;
    }
    histViewIdx = rounds.length - 1; // 默认显示最新已提交轮
    renderHistContent();
    histDlg.classList.remove('hidden');
  }

  function renderHistContent() {
    const body = document.getElementById('histBody');
    const nav = document.getElementById('histNav');

    if (!rounds.length) {
      nav.innerHTML = '';
      body.innerHTML = '<div class="hist-empty">还没有已提交的轮次</div>';
      return;
    }

    // 导航：轮次切换
    nav.innerHTML = '';
    rounds.forEach((r, i) => {
      const b = el('button', 'hist-nav-btn' + (i === histViewIdx ? ' active' : ''));
      b.textContent = '第 ' + r.round + ' 轮';
      b.onclick = () => { histViewIdx = i; renderHistContent(); };
      nav.appendChild(b);
    });

    const r = rounds[histViewIdx];
    if (!r) { body.innerHTML = ''; return; }

    // 时间格式化
    const dt = new Date(r.submittedAt);
    const dtStr = dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate()) + ' ' + pad2(dt.getHours()) + ':' + pad2(dt.getMinutes());

    body.innerHTML = '';

    // 标头
    const hdr = el('div', 'hist-hdr');
    hdr.appendChild(el('span', 'hist-round-tag', '第 ' + r.round + ' 轮'));
    hdr.appendChild(el('span', 'hist-meta', dtStr + (r.reviewer ? ' · ' + esc(r.reviewer) : '')));
    body.appendChild(hdr);

    // 总体意见
    if (r.summary) {
      const sumBox = el('div', 'hist-summary');
      sumBox.appendChild(el('div', 'hist-field-label', '总体意见'));
      sumBox.appendChild(el('div', 'hist-summary-text', esc(r.summary)));
      body.appendChild(sumBox);
    }

    // 按 face 分组列出条目
    if (!r.items || !r.items.length) {
      body.appendChild(el('div', 'hist-empty', '（本轮无逐条反馈）'));
      return;
    }

    const faceOrder = ['prd', 'proto', 'arch', 'test', 'ui', 'completeness'];
    const faceNames = { prd: 'PRD', proto: '原型', arch: '架构', test: '测试', ui: 'UI 设计', completeness: '交互完整性' };
    const byFace = {};
    r.items.forEach(it => {
      const f = it.face || 'other';
      if (!byFace[f]) byFace[f] = [];
      byFace[f].push(it);
    });

    const allFaces = [...faceOrder.filter(f => byFace[f]), ...Object.keys(byFace).filter(f => !faceOrder.includes(f))];
    allFaces.forEach(face => {
      const grp = el('div', 'hist-group');
      grp.appendChild(el('div', 'hist-group-title', faceNames[face] || face));
      byFace[face].forEach(it => {
        const row = el('div', 'hist-item');
        const left = el('span', 'hist-reflabel', esc(it.refLabel || it.refId));
        row.appendChild(left);
        if (it.type === 'move') {
          row.appendChild(el('span', 'hist-tag hist-tag-move', '🔧 移动'));
        } else if (it.verdict) {
          const cls = { 赞成: 'hist-tag-ok', 异议: 'hist-tag-no', 疑问: 'hist-tag-q' }[it.verdict] || '';
          row.appendChild(el('span', 'hist-tag ' + cls, it.verdict));
        } else {
          row.appendChild(el('span', 'hist-tag', '💬'));
        }
        if (it.comment) row.appendChild(el('span', 'hist-comment', esc(it.comment)));
        grp.appendChild(row);
      });
      body.appendChild(grp);
    });
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  document.getElementById('histClose').onclick = () => histDlg.classList.add('hidden');
  document.getElementById('histBtn').onclick = openHistPanel;

  // ---------- 提交 ----------
  const dlg = document.getElementById('submitDialog');
  document.getElementById('submitBtn').onclick = () => {
    document.getElementById('reviewerName').value = fb.reviewer || '';
    // 总体意见框始终从 fb.summary 读取（重置后为空）
    document.getElementById('summaryText').value = fb.summary || '';
    renderSummList();
    renderLastRoundInDlg();
    dlg.classList.remove('hidden');
  };
  document.getElementById('cancelSubmit').onclick = () => dlg.classList.add('hidden');
  // 清空本轮（不提交、不归档）：用于丢弃当前未提交的输入，回到干净状态
  const clearBtn = document.getElementById('clearRoundBtn');
  if (clearBtn) clearBtn.onclick = () => {
    if (!confirm('清空本轮所有未提交的态度/评论/移动与总体意见？（不影响已提交的历史轮次）')) return;
    fb.verdicts = {}; fb.comments = []; fb.moves = {}; fb.summary = '';
    const s = document.getElementById('summaryText'); if (s) s.value = '';
    saveFb(); render(); renderSummList(); toast('本轮已清空 ✓');
  };
  document.getElementById('reviewerName').oninput = (e) => { fb.reviewer = e.target.value; saveFb(); };
  document.getElementById('summaryText').oninput = (e) => { fb.summary = e.target.value; saveFb(); };

  // 在提交弹窗中渲染上一轮只读区域
  function renderLastRoundInDlg() {
    const box = document.getElementById('lastRoundBox');
    if (!box) return;
    if (!rounds.length) { box.style.display = 'none'; return; }
    box.style.display = '';
    const r = rounds[rounds.length - 1];
    const dt = new Date(r.submittedAt);
    const dtStr = dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate()) + ' ' + pad2(dt.getHours()) + ':' + pad2(dt.getMinutes());
    const det = box.querySelector('details');
    const summary = box.querySelector('summary');
    if (summary) summary.textContent = '第 ' + r.round + ' 轮已提交（' + dtStr + '）— 展开查看';
    const content = box.querySelector('.last-round-content');
    if (!content) return;
    content.innerHTML = '';
    if (r.summary) {
      const s = el('div', 'hist-summary');
      s.appendChild(el('div', 'hist-field-label', '总体意见'));
      s.appendChild(el('div', 'hist-summary-text', esc(r.summary)));
      content.appendChild(s);
    }
    if (!r.items || !r.items.length) {
      content.appendChild(el('div', 'hist-empty', '（无逐条记录）'));
      return;
    }
    r.items.forEach(it => {
      const row = el('div', 'hist-item');
      row.appendChild(el('span', 'hist-reflabel', esc(it.refLabel || it.refId)));
      if (it.type === 'move') {
        row.appendChild(el('span', 'hist-tag hist-tag-move', '🔧'));
      } else if (it.verdict) {
        const cls = { 赞成: 'hist-tag-ok', 异议: 'hist-tag-no', 疑问: 'hist-tag-q' }[it.verdict] || '';
        row.appendChild(el('span', 'hist-tag ' + cls, it.verdict));
      } else {
        row.appendChild(el('span', 'hist-tag', '💬'));
      }
      if (it.comment) row.appendChild(el('span', 'hist-comment', esc(it.comment)));
      content.appendChild(row);
    });
  }

  function buildPayload() {
    const items = [];
    const vm = { ok: '赞成', no: '异议', q: '疑问' };
    for (const k in fb.verdicts) { const v = fb.verdicts[k]; if (v && (v.verdict || v.comment)) items.push({ type: 'verdict', face: v.face, refId: k, refLabel: v.refLabel, verdict: vm[v.verdict] || '', comment: v.comment || '' }); }
    fb.comments.forEach(c => items.push({ type: 'comment', face: c.face, refId: c.id, refLabel: c.refLabel, comment: c.comment }));
    for (const k in fb.moves) { const m = fb.moves[k]; items.push({ type: 'move', face: 'proto', refId: k, refLabel: m.refLabel, geometry: m.geometry }); }
    return { project: D.id, projectTitle: D.title, reviewer: fb.reviewer || '', summary: fb.summary || '', items };
  }
  function renderSummList() {
    const p = buildPayload(); const box = document.getElementById('summList');
    if (!p.items.length) { box.innerHTML = '<div>（还没有任何反馈）</div>'; return; }
    box.innerHTML = '';
    p.items.forEach(it => { const tag = it.type === 'move' ? '🔧移动' : (it.verdict ? ('[' + it.verdict + ']') : '💬'); box.appendChild(el('div', null, esc(tag + ' ' + (it.refLabel || it.refId) + (it.comment ? (' — ' + it.comment) : '')))); });
  }
  function downloadPayload(p) { const b = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }); const a = el('a'); a.href = URL.createObjectURL(b); a.download = D.id + '-feedback.json'; a.click(); }
  document.getElementById('downloadBtn').onclick = () => downloadPayload(buildPayload());
  document.getElementById('doSubmit').onclick = async () => {
    const payload = buildPayload();
    if (!payload.items.length) { toast('还没有反馈可提交'); return; }
    try {
      const r = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'fail');

      // 归档本轮到 rounds
      const roundEntry = {
        round: rounds.length + 1,
        submittedAt: new Date().toISOString(),
        reviewer: payload.reviewer,
        summary: payload.summary,
        items: payload.items
      };
      rounds.push(roundEntry);
      saveRounds();

      // 清空工作集 fb（reviewer 保留）
      const savedReviewer = fb.reviewer;
      fb.verdicts = {}; fb.comments = []; fb.moves = {}; fb.summary = '';
      fb.reviewer = savedReviewer;
      saveFb();

      // 刷新提交弹窗内的输入框
      const sumEl = document.getElementById('summaryText'); if (sumEl) sumEl.value = '';

      // 强化成功态：显示条数 + 来源确认
      const successMsg = '已提交 ' + j.count + ' 条（第 ' + roundEntry.round + ' 轮）✓ 下一轮已重置';
      const successEl = document.getElementById('submitSuccess');
      if (successEl) {
        successEl.textContent = successMsg;
        successEl.style.display = 'block';
        setTimeout(() => {
          successEl.style.display = 'none';
          dlg.classList.add('hidden');
          render(); // 重渲染当前面，使 defaultVerdict 仍显示
        }, 2500);
      } else {
        toast(successMsg);
        dlg.classList.add('hidden');
        render();
      }
    } catch (e) { downloadPayload(payload); toast('未连到服务器：已导出反馈文件，请发回'); dlg.classList.add('hidden'); }
  };

  // ---------- init ----------
  // 动态插入 UI 设计 tab（仅当 D.ui 存在）
  if (D.ui) {
    const uiTabBtn = el('button', null, 'UI 设计');
    uiTabBtn.dataset.tab = 'ui';
    tabs.appendChild(uiTabBtn);
  }
  // 动态插入「交互完整性自查」tab（仅当 D.completeness 存在）
  if (D.completeness) {
    const cmpTabBtn = el('button', null, '交互完整性');
    cmpTabBtn.dataset.tab = 'completeness';
    tabs.appendChild(cmpTabBtn);
  }
  ensureInteract();
  updateCount();
  updateTabBadges();
  updateRoundLabel();
  setTab('prd');
})();
