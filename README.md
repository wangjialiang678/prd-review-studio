# PRD Review Studio · PRD 确认工作台

> An self-contained, single-page tool to review a product spec across **four surfaces** — PRD, clickable wireframes, architecture diagrams, and test scenarios — leave inline feedback, and submit it back for an AI to iterate on.

把一份产品规格的 **PRD / 交互原型 / 架构 / 测试场景** 放进**一个自包含单页**，评审者在手机或电脑上**边看边批注**，一键提交后由 AI 据反馈迭代。换项目只换一个数据文件。

全程零授权风险（全 MIT）：`interact.js`（拖动/缩放）+ `mermaid`（架构图）+ 原生 JS（批注/状态机）+ 零依赖 Node 服务（提交反馈落盘）。

## 四个确认面

| 面 | 能做什么 |
|---|---|
| **PRD 评审** | 每条逐条 ✓赞成 / ✗异议 / ?疑问 + 文字补充 |
| **交互原型** | 低保真框线图；`预览`点控件跳页 / `编辑`拖动·缩放控件 / `批注`点页面任意处留评论钉点 |
| **架构** | Mermaid 数据流/部署图 + 关键断言逐条勾"符合/不符合" |
| **测试场景** | 关键场景（带"若不处理"业务影响）+ 验收标准 AC 配 Given-When-Then |

反馈实时存 `localStorage`；点「提交反馈」→ POST `/api/feedback` 落盘服务器；连不上服务器时自动「导出文件」兜底。

## 快速开始

```bash
node server.js                 # 默认 http://127.0.0.1:8088
PORT=8090 node server.js       # 指定端口
```

打开 `http://127.0.0.1:8088` 看示例项目；`http://127.0.0.1:8088/?p=<项目名>` 看指定项目。

## 加一个你自己的项目（核心：换项目只换数据）

1. 复制 `public/projects/demo.js` → `public/projects/<你的项目>.js`，改 `window.PROJECT_DATA`（结构见 `demo.js` 注释）。
2. 用 `?p=<你的项目>` 打开。
3. 引擎 `studio.js` / `studio.css` / `server.js` 通用，不用动。

> 私有项目数据不想进仓库？把它加进 `.gitignore`（本仓库已忽略 `public/projects/recorder-app.js` 作为示范）。

## 部署到自己的服务器

任意能跑 Node 的 VPS。用环境变量传服务器信息，避免把私密写进仓库：

```bash
export DEPLOY_HOST=user@your-server.example.com
export DEPLOY_KEY=~/.ssh/your_key
export DEPLOY_PORT=22

rsync -az --delete \
  --exclude node_modules --exclude .git --exclude feedback --exclude .DS_Store \
  -e "ssh -i $DEPLOY_KEY -p $DEPLOY_PORT -o StrictHostKeyChecking=no" \
  ./ "$DEPLOY_HOST:~/projects/prd-studio/"

ssh -i "$DEPLOY_KEY" -p "$DEPLOY_PORT" "$DEPLOY_HOST" \
  "cd ~/projects/prd-studio && (pm2 restart prd-studio || PORT=8090 pm2 start server.js --name prd-studio) && pm2 save"
```

> `--exclude feedback` 保证不会覆盖线上已提交的反馈。前面套 Nginx 反代 + HTTPS 即可手机访问。

## 读取反馈（AI 迭代用）

每次提交写一对 `feedback/<project>-<时间>.json`（AI 读）+ `.md`（人读）。

```bash
DEPLOY_HOST=user@host DEPLOY_KEY=~/.ssh/key DEPLOY_PORT=22 bash scripts/pull-feedback.sh
# 或：curl -s "https://<你的域名>/api/feedback?project=<项目名>"
```

## 反馈数据结构

```jsonc
{
  "project": "demo",
  "reviewer": "Someone",
  "summary": "总评…",
  "items": [
    { "type": "verdict", "face": "prd",  "refId": "FR-1", "verdict": "赞成|异议|疑问", "comment": "…" },
    { "type": "comment", "face": "proto", "refLabel": "列表/fab", "comment": "按钮再大点" },
    { "type": "move",    "face": "proto", "refLabel": "列表/fab", "geometry": {"x":110,"y":520,"w":120,"h":120} }
  ]
}
```

## 目录结构

```
public/
  index.html        # 外壳：按 ?p= 动态加载项目数据
  studio.js         # 引擎：4 个面渲染 / 批注 / 拖动 / 提交
  studio.css        # 样式（亮/暗）
  vendor/           # interact.js + mermaid（本地化，免 CDN）
  projects/demo.js  # 示例项目数据（复制改即用）
server.js           # 零依赖 Node：静态托管 + POST /api/feedback
scripts/pull-feedback.sh
```

## License

MIT
