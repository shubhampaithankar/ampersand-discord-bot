# Ampersand Discord Bot

> Follow global rules at @~/.claude/CLAUDE.md. They govern HOW to work here - tool routing (ctx_*/rtk over native Read/Grep/Bash), inline-by-default with subagent delegation + intent-based model routing (code exec -> Sonnet, bulk -> Haiku, reasoning/review -> Opus), ponytail build discipline, caveman tone, memory, and commit conventions. This file only adds project-specific facts and overrides; it never relaxes or contradicts a global rule.

## Stack

- Runtime: Bun (never npm/pnpm/yarn) · TypeScript 5.x
- Discord: discord.js v14 + @discordjs/rest v2
- Music: Poru v5 (Lavalink). Spotify URLs resolved **client-side** via `spotify-url-info` (public oEmbed, no auth) → each track re-searched on Lavalink's **SoundCloud** source (`scsearch`). **Spotify is never an audio source** — only track name + artist are scraped. (`application.yml` ships the `lavasrc` Spotify plugin and reads `SPOTIFY_CLIENT_*`, but the bot never sends Spotify URLs to Lavalink, so both stay inert.)
- **YouTube playback is dead, deliberately unused.** InnerTube returns SABR-only responses (`serverAbrStreamingUrl`, empty format arrays — verified against ANDROID_VR from the Lavalink host 2026-09-07) and youtube-source 1.18.x cannot consume SABR. YT *search* still works, so never fall back to `ytsearch`/`ytmsearch`: it queues tracks that fail at play time. Revisit when youtube-source ships SABR support (`defaultPlatform` in `src/libs/poru.ts`, `source:` in `play.ts`, providers in `application.yml`).
- DB: MongoDB (Mongoose v7) · Cache: Valkey — Redis-protocol, via ioredis v5 (env vars keep REDIS_* names)
- Container: `oven/bun:alpine` multi-stage

## Build & Run

```bash
bun --watch app.ts              # dev (hot-reload)
NODE_ENV=PROD bun run app.ts    # prod
docker compose up -d            # containerised
bun run format                  # biome format --write .
bun run lint                    # oxlint
bun run check                   # biome check --write + oxlint
```

No test suite. Biome formats, Oxlint lints. eslint + prettier removed.

## Deploy

Push to `master` -> `.github/workflows/deploy.yml`: `bun install --frozen-lockfile` -> `bun run lint` -> `bunx tsc --noEmit` -> SSH (VPS `139.59.27.226:7222` frp tunnel -> mini-pc) -> `git reset --hard origin/master` + `docker compose --env-file .env up -d --build` -> `scripts/healthcheck.sh ampersand-discord-client 30`. Success/failure pinged by `scripts/notify.sh`.

- Merging a PR to master = live bot restart. Verify on the mini-pc (homelab MCP), not on CI's green tick.
- `scripts/healthcheck.sh` polls Docker's own health verdict (container healthcheck wgets `HEALTH_PORT`); `app.ts` serves 200 only when `client.ws.status === Status.Ready`. `Running == true` is not proof of life - that hid a 3-day outage.
- Lavalink side: `application.yml` + `plugins/*.jar` (lavasrc, youtube) live in this repo and ship with the compose stack.

## Environment Variables

All env read via `@/constants` — never `process.env.*` in app code.

```
DISCORD_CLIENT_ID  DISCORD_CLIENT_NAME  DISCORD_TOKEN  DISCORD_PERMISSION_INTEGER
MONGO_URL  REDIS_URL  REDIS_USERNAME  REDIS_PASSWORD
LAVALINK_HOST  LAVALINK_PORT  LAVALINK_PASSWORD
SPOTIFY_CLIENT_ID  SPOTIFY_CLIENT_SECRET  NODE_ENV
ERROR_WEBHOOK_URL  (optional — webhook for error reporter; falls back to console)
HEALTH_PORT        (optional — shard-state liveness probe port, default 3000; container healthcheck wgets it)
```

## Module Aliases

`tsconfig.json`: `@/*` → `src/*`. All static imports use `@/...`; relative `../../...` forbidden. Dynamic imports in `src/loader.ts` still use `path.join(__dirname, ...)` — filesystem walk only, aliases apply to static imports.

## Reference

@.claude/rules/architecture.md · @.claude/rules/lang.md · @.claude/rules/conventions.md

## Key Files

- `app.ts` — process handlers + `Bun.serve` liveness probe on `HEALTH_PORT` · `src/loader.ts` (auto-discovers events/interactions/music events, not alias-aware)
- `src/classes.ts` (`MainInteraction/MainEvent/MainMusicEvent/MainShardEvent`) · `src/client.ts` (`BaseClient`) · `src/constants.ts` (env source of truth)
- `src/services/general.utils.ts` — `capitalizeString`, `getError`, `formatDuration`, `sleepFor`, `escapeRegex`, `mapInChunks` (bounded-parallel batch async)
- `src/services/error.reporter.ts` — `reportError({ source, error, context? })` + `ctxFromInteraction`/`ctxFromPlayer` helpers; webhook + dedup + rate-limit, falls back to console if `ERROR_WEBHOOK_URL` unset
- `src/services/process.handlers.ts` — `registerProcessHandlers()` for `unhandledRejection` + `uncaughtException` (called from `app.ts`)
- `src/services/music/spotify.resolver.ts` — Spotify metadata scrape → YT Music re-search
- `src/services/music/now.playing.panel.ts` — persistent self-editing now-playing embed + emoji-only control buttons (`upsertPanel`/`clearPanel`), 5s live ticker, per-player action lock
- `src/services/discord/` — `embed/button/select/modal.builder` (never raw), `interaction.collector` (`buildCustomIds` accepts array OR `as const` object), `guild.player`, `counter.access`, `lockdown.restore` (parallelised), `presence` (rotating bot status)
- `src/models/<domain>/<domain>.constants.ts` — action/modal customId constants

## Project Slash Commands

In `.claude/commands/`, prefer over hand-rolling: `/new-command` · `/new-event` · `/new-module` (`/init` panel module) · `/debug-music` (Lavalink / Poru triage) · `/review` · `/pr`. No project agents or hooks — user-scope ones apply unchanged.

## Do NOT

- `npm` / `pnpm` / `yarn` · `any` · raw `process.env.*` · relative imports
- Put non-`{schema,model,service,types,constants,index}.ts` files under `src/models/**`
- Everything in `conventions.md` marked ❌ (raw builders, `ephemeral: true`, subdoc `$set`, skipped `deferReply`, `onEnd` DB reads, serial `await`, direct service imports)

## MCP Plugins

| Server | Use |
|---|---|
| **graphify** | Call structure: `query_graph`, `get_neighbors`, `get_pr_impact`, `god_nodes`. This repo has real call edges (loader -> classes -> interactions/events), so per @~/.claude/rules/code-graph.md ask the graph before grepping the tree. Re-extract after refactors that move files. |
| **context7** | Any discord.js / Poru / Mongoose / ioredis / Bun question — `resolve-library-id` then `query-docs`. Never answer library API questions from memory; discord.js v14 and Poru v5 both moved fast. |
| **github** | PRs, checks, issues; `pull_request_review_write`, `create_pull_request` (check `.github/PULL_REQUEST_TEMPLATE` first) |
| **homelab** | The deploy target. `homelab_status` / `homelab_sh` on the mini-pc to check containers + logs after a merge — this is how you verify a deploy, not the Actions run. |

## On Compaction, Preserve

- Current branch + in-progress feature context
- Unresolved TypeScript / runtime issues
- Pending schema changes or new env vars
