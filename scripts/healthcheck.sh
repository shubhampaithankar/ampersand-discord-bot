#!/usr/bin/env bash
# healthcheck.sh <container> <wait-seconds> — pass if container is Up + not crash-looping.
set -euo pipefail
C="${1:?container}"; WAIT="${2:-30}"
echo "waiting ${WAIT}s for $C to stabilise..."; sleep "$WAIT"
running=$(docker inspect -f '{{.State.Running}}' "$C" 2>/dev/null || echo false)
restarting=$(docker inspect -f '{{.State.Restarting}}' "$C" 2>/dev/null || echo true)
restarts=$(docker inspect -f '{{.RestartCount}}' "$C" 2>/dev/null || echo 99)
echo "running=$running restarting=$restarting restartCount=$restarts"
echo "--- last 20 log lines ---"; docker logs --tail 20 "$C" 2>&1 || true
if [ "$running" != "true" ] || [ "$restarting" = "true" ] || [ "${restarts:-0}" -gt 2 ]; then
  echo "::error::$C unhealthy (running=$running restarting=$restarting restarts=$restarts)"; exit 1
fi
echo "healthy"
