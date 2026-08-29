# Todos

Open items from the 2026-08-28 healthcheck work. Format: Issue | Severity | Effort | Status.

| Issue | Severity | Effort | Status |
|---|---|---|---|
| Gateway healthcheck read TCP, not shard state. Two established `162.159.x:443` sockets exist (gateway + REST/CDN), so a shard cycling `Connecting -> close -> Connecting` kept a socket up and read healthy. | High | S | **Done** 2026-08-29 — `app.ts` serves shard state on `HEALTH_PORT`; healthcheck wgets it |
| `ports: "3000:3000"` + `EXPOSE 3000` were dead — nothing bound a listener. | Low | XS | **Done** 2026-08-29 — the port now carries the probe |
| `loader.ts` runs the global slash-command PUT before `super.login()`, so a TCP probe could read healthy during boot before any gateway connect. | Low | S | **Done** 2026-08-29 — probe reports 503 until `Status.Ready`, regardless of sockets |
| IPv6 blind spot: probe read `/proc/net/tcp` only. | Low | XS | **Moot** 2026-08-29 — probe is now HTTP on loopback, no `/proc` parsing |
| Stale `mcp__plugin_code-review-graph_*` entries in `.claude/settings.local.json` + dead `.code-review-graph/` dir. | Trivial | XS | **Done** 2026-08-29 — 7 entries removed, dir deleted (both untracked/gitignored) |
| Detection latency ~5 min, not the 60s `interval` suggests: `start_period: 120s` + 5 x `interval: 60s`, plus autoheal's poll. | Info | — | Accepted |

## Known limits of the current probe

- Reports the **local** shard's `Status.Ready`. `shards: "auto"` means multi-shard is possible; a single dead shard among several would not show. Fine at current guild count, revisit if sharding actually kicks in.
- `Bun.serve` binds at boot. If it throws (port taken), `app.ts` catches and logs, and the container then reports unhealthy from `start_period` onward — noisy but correct-ish. Not worth guarding until it happens.
