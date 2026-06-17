#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
Autopilot wrapper

Use this script as a local checklist runner. The actual AI autopilot loop must be executed by OpenCode/pencode CLI using .ai/autopilot-prompt.md.

Suggested command inside your AI coding CLI:
Read .ai/autopilot-prompt.md and run the full autonomous build loop until every task in docs/tasks/backlog.md is completed. Do not ask for confirmation unless a stop condition is triggered.
EOF

if [ -f scripts/validate-source-of-truth.js ]; then
  node scripts/validate-source-of-truth.js
fi

if [ -f scripts/quality-gate.sh ]; then
  bash scripts/quality-gate.sh
fi
