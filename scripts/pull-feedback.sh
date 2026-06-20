#!/usr/bin/env bash
# 把线上工作台收到的反馈拉到本地 feedback/，供 AI 读取后迭代规格。
# 用环境变量传服务器信息（不写死，避免私密进仓库）：
#   DEPLOY_HOST=user@host  DEPLOY_KEY=~/.ssh/key  DEPLOY_PORT=22  bash scripts/pull-feedback.sh
set -euo pipefail
HOST="${DEPLOY_HOST:?请设置 DEPLOY_HOST，例如 user@your-server}"
KEY="${DEPLOY_KEY:?请设置 DEPLOY_KEY，例如 ~/.ssh/your_key}"
PORT="${DEPLOY_PORT:-22}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-~/projects/prd-studio}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$HERE/feedback"
rsync -az -e "ssh -i $KEY -p $PORT -o StrictHostKeyChecking=no" \
  "$HOST:$REMOTE_DIR/feedback/" "$HERE/feedback/"
echo "已拉取到 $HERE/feedback/ ："
ls -1 "$HERE/feedback/"*.md 2>/dev/null || echo "（暂无反馈）"
