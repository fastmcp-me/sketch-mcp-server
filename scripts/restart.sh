#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

LOG_FILE="/tmp/sketch-mcp-server.out"
PID_FILE="/tmp/sketch-mcp-server.pid"

echo "[restart] Stopping existing server if any..."
pkill -f "ts-node.*server" || true
sleep 1

echo "[restart] Starting server (logs will stream below, also saved to $LOG_FILE) ..."

# Start in foreground and stream logs to terminal, also save to file
# Keep PID file updated with the running ts-node server
(
  npm run start &
  SVR_PID=$!
  echo $SVR_PID > "$PID_FILE"
  wait $SVR_PID
) 2>&1 | tee "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}
echo "[restart] Server exited with code $EXIT_CODE"
exit $EXIT_CODE


