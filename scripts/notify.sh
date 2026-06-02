#!/usr/bin/env bash
# notify.sh <status> <sha> <actor> <run-url> — POST to the Discord DEPLOY_WEBHOOK.
set -euo pipefail
[ -z "${DEPLOY_WEBHOOK:-}" ] && { echo "DEPLOY_WEBHOOK unset; skipping notify"; exit 0; }
sha7="${2:0:7}"
content="$1"$'\n'"repo: ampersand-discord-bot · commit \`${sha7}\` by ${3}"$'\n'"${4}"
curl -fsS -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$content" '{content:$c}')" "$DEPLOY_WEBHOOK" >/dev/null
echo "notified"
