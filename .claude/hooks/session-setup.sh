#!/bin/bash
# SessionStart hook: worktree sessions and fresh clones start without
# node_modules, so install dependencies before any dev server, test, or
# lint command runs. No-op when node_modules already exists.
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

if [ -d node_modules ]; then
  exit 0
fi

echo "node_modules missing — running npm ci..." >&2
npm ci >&2
echo "Dependencies installed with npm ci (fresh checkout)."
