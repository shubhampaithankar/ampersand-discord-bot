#!/usr/bin/env bash
# migrate-mongo.sh — ONE-TIME: copy all data from the OLD mongo into the in-stack self-hosted mongo.
# Run on the mini-pc from /home/shubham/ampersand, BEFORE the first consolidated deploy.
#   OLD_MONGO_URL="mongodb://<old-host>:27017/ampersand" bash scripts/migrate-mongo.sh
# If the old mongo is another container on secure-net, use its container name as <old-host>.
# Streams dump->restore through the mongo:7 tools over the stack network (no temp files). Idempotent (--drop).
set -euo pipefail
: "${OLD_MONGO_URL:?set OLD_MONGO_URL to the current source mongo connection string}"
NEW_MONGO_URL="${NEW_MONGO_URL:-mongodb://mongo:27017/ampersand}"

echo "bringing up in-stack mongo..."
docker compose up -d mongo

echo "waiting for new mongo to accept connections..."
until docker compose exec -T mongo mongosh --quiet --eval "db.adminCommand('ping').ok" >/dev/null 2>&1; do
  sleep 2
done

echo "dump ($OLD_MONGO_URL) -> restore ($NEW_MONGO_URL) ..."
docker run --rm --network secure-net mongo:7 sh -c \
  "mongodump --uri='$OLD_MONGO_URL' --archive --gzip | mongorestore --uri='$NEW_MONGO_URL' --archive --gzip --drop"

echo "✅ migration done — verify collection counts, then deploy the full stack."
