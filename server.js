'use strict';
/*
 * PRD Review Studio — 零依赖 Node 服务
 * - 静态托管 public/
 * - POST /api/feedback   提交一份反馈（写 feedback/<project>-<ts>.json + .md）
 * - GET  /api/feedback?project=xxx  列出某项目历次反馈（供 AI 读取）
 * - GET  /api/health
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const _argv = process.argv.slice(2);
const _pi = _argv.indexOf('--port');
const PORT = process.env.PORT || (_pi >= 0 ? parseInt(_argv[_pi + 1], 10) : 8088);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const FEEDBACK_DIR = path.join(ROOT, 'feedback');
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function safeName(s) {
  return String(s || 'unknown').replace(/[^a-zA-Z0-9_\-一-龥]/g, '_').slice(0, 60);
}

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ 'Access-Control-Allow-Origin': '*' }, headers || {}));
  res.end(body);
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC, rel));
  if (!filePath.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  });
}

// 把结构化反馈渲染成人类可读 + AI 友好的 Markdown
function toMarkdown(fb) {
  const lines = [];
  lines.push(`# PRD 评审反馈 — ${fb.project || 'unknown'}`);
  lines.push('');
  lines.push(`- 提交时间：${fb.submittedAt}`);
  lines.push(`- 评审者：${fb.reviewer || '(未填)'}`);
  lines.push(`- 条目总数：${(fb.items || []).length}`);
  if (fb.summary) lines.push(`- 总体意见：${fb.summary}`);
  lines.push('');
  const byFace = {};
  for (const it of fb.items || []) {
    (byFace[it.face] = byFace[it.face] || []).push(it);
  }
  const faceTitle = { prd: 'PRD 评审', proto: '交互原型', arch: '架构', test: '测试场景' };
  for (const face of Object.keys(byFace)) {
    lines.push(`## ${faceTitle[face] || face}`);
    lines.push('');
    for (const it of byFace[face]) {
      const verdict = it.verdict ? ` **[${it.verdict}]**` : '';
      const ref = it.refLabel ? ` \`${it.refLabel}\`` : (it.refId ? ` \`#${it.refId}\`` : '');
      lines.push(`- ${it.type === 'move' ? '🔧 控件移动' : '💬 批注'}${verdict}${ref}`);
      if (it.comment) lines.push(`  - 意见：${it.comment}`);
      if (it.type === 'move' && it.geometry) {
        lines.push(`  - 新位置：x=${Math.round(it.geometry.x)}, y=${Math.round(it.geometry.y)}, w=${Math.round(it.geometry.w)}, h=${Math.round(it.geometry.h)}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function handleFeedbackPost(req, res) {
  let raw = '';
  req.on('data', (c) => { raw += c; if (raw.length > 5e6) req.destroy(); });
  req.on('end', () => {
    let fb;
    try { fb = JSON.parse(raw || '{}'); } catch (e) { return send(res, 400, JSON.stringify({ ok: false, error: 'bad json' }), { 'Content-Type': 'application/json' }); }
    fb.submittedAt = new Date().toISOString();
    const ts = fb.submittedAt.replace(/[:.]/g, '-');
    const base = `${safeName(fb.project)}-${ts}`;
    try {
      fs.writeFileSync(path.join(FEEDBACK_DIR, base + '.json'), JSON.stringify(fb, null, 2));
      fs.writeFileSync(path.join(FEEDBACK_DIR, base + '.md'), toMarkdown(fb));
    } catch (e) {
      return send(res, 500, JSON.stringify({ ok: false, error: String(e) }), { 'Content-Type': 'application/json' });
    }
    send(res, 200, JSON.stringify({ ok: true, file: base + '.md', count: (fb.items || []).length }), { 'Content-Type': 'application/json' });
  });
}

function handleFeedbackList(req, res, query) {
  const proj = safeName(query.project || '');
  let files = [];
  try {
    files = fs.readdirSync(FEEDBACK_DIR)
      .filter((f) => f.endsWith('.json') && (!query.project || f.startsWith(proj + '-')))
      .sort().reverse();
  } catch (e) {}
  send(res, 200, JSON.stringify({ ok: true, files }), { 'Content-Type': 'application/json' });
}

http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === 'OPTIONS') return send(res, 204, '', { 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  if (parsed.pathname === '/api/health') return send(res, 200, JSON.stringify({ ok: true, ts: Date.now() }), { 'Content-Type': 'application/json' });
  if (parsed.pathname === '/api/feedback' && req.method === 'POST') return handleFeedbackPost(req, res);
  if (parsed.pathname === '/api/feedback' && req.method === 'GET') return handleFeedbackList(req, res, parsed.query);
  return serveStatic(req, res, parsed.pathname);
}).listen(PORT, () => {
  console.log(`PRD Review Studio running at http://0.0.0.0:${PORT}`);
});
