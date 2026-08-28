#!/usr/bin/env bash
# healthcheck.sh <container> <wait-seconds> [health-wait-seconds] — pass if container is Up,
# not crash-looping, and (when it defines a healthcheck) reports healthy.
set -euo pipefail
C="${1:?container}"; WAIT="${2:-30}"; HEALTH_WAIT="${3:-180}"
echo "waiting ${WAIT}s for $C to stabilise..."; sleep "$WAIT"
running=$(docker inspect -f '{{.State.Running}}' "$C" 2>/dev/null || echo false)
restarting=$(docker inspect -f '{{.State.Restarting}}' "$C" 2>/dev/null || echo true)
restarts=$(docker inspect -f '{{.RestartCount}}' "$C" 2>/dev/null || echo 99)
echo "running=$running restarting=$restarting restartCount=$restarts"
echo "--- last 20 log lines ---"; docker logs --tail 20 "$C" 2>&1 || true
if [ "$running" != "true" ] || [ "$restarting" = "true" ] || [ "${restarts:-0}" -gt 2 ]; then
  echo "::error::$C unhealthy (running=$running restarting=$restarting restarts=$restarts)"; exit 1
fi

# Running != working. The 2026-08-23 outage had running=true restartCount=0 for three days on a
# bot that was dead, which is exactly what the checks above would have signed off on. Read Docker's
# health verdict too, when the container defines one.
# Poll rather than sample once: the client's healthcheck has start_period=120s, so at the deploy's
# T+30s it is still "starting" and a single read would fail every deploy on a bot that is merely booting.
h() { docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$C" 2>/dev/null || echo none; }
health=$(h)
if [ "$health" != "none" ]; then
  deadline=$((SECONDS + HEALTH_WAIT))
  while [ "$health" = "starting" ] && [ "$SECONDS" -lt "$deadline" ]; do sleep 10; health=$(h); done
  echo "health=$health"
  if [ "$health" != "healthy" ]; then
    echo "--- health probe log ---"
    docker inspect -f '{{range .State.Health.Log}}exit={{.ExitCode}} {{println .Output}}{{end}}' "$C" 2>/dev/null || true
    echo "::error::$C health=$health after ${HEALTH_WAIT}s"; exit 1
  fi
fi
echo "healthy"
