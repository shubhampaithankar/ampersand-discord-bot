# Todos

Open items from the 2026-08-28 healthcheck work. Format: Issue | Severity | Effort | Status.

| Issue | Severity | Effort | Status |
|---|---|---|---|
| Gateway healthcheck reads TCP, not shard state. Two established `162.159.x:443` sockets exist (gateway + REST/CDN), so a shard cycling `Connecting -> close -> Connecting` keeps a socket up and reads healthy. Fix: bind `Bun.serve` on port 3000 returning 200/503 from `client.ws.status`, switch the healthcheck to `wget` it. | High | S | Open — needs bot code, was ruled out by the compose-only brief |
| `ports: "3000:3000"` + `EXPOSE 3000` are dead. Nothing in `app.ts` or `src/` binds a listener (`grep` for `Bun.serve\|createServer\|.listen\|express\|Hono` returns zero). Either use the port for the probe above or drop the mapping. | Low | XS | Open |
| `loader.ts` runs the global slash-command PUT (a `discord.com:443` connection) before `super.login()` in `src/client.ts:52-54`, so the healthcheck can read healthy during boot before any gateway connect. Masked today only by `start_period: 120s`. | Low | S | Open — resolved for free by the port-3000 probe |
| IPv6 blind spot: healthcheck reads `/proc/net/tcp` only. Dormant — `gateway.discord.gg` publishes no AAAA and the container shows 0 established tcp6 sockets. Would flip to permanently-unhealthy (autoheal restart loop) if that changes. Fix: `cat /proc/net/tcp /proc/net/tcp6 2>/dev/null \| awk ...`. | Low | XS | Open — monitor |
| Stale `mcp__plugin_code-review-graph_*` allow-entries in `.claude/settings.local.json`, and a dead `.code-review-graph/` dir at the repo root. That MCP server no longer exists. | Trivial | XS | Open |
| Detection latency is ~5 min, not the 60s the `interval` suggests: `start_period: 120s` + 5 x `interval: 60s` before `unhealthy`, plus autoheal's own poll. | Info | — | Accepted |
