# Ampersand Discord Bot

> Follow global rules at @~/.claude/CLAUDE.md. They govern HOW to work here - tool routing (ctx_*/rtk over native Read/Grep/Bash), inline-by-default with subagent delegation + intent-based model routing (code exec -> Sonnet, bulk -> Haiku, reasoning/review -> Opus), ponytail build discipline, caveman tone, memory, and commit conventions. This file only adds project-specific facts and overrides; it never relaxes or contradicts a global rule.

## Stack

- Runtime: Bun (never npm/pnpm/yarn) · TypeScript 5.x
- Discord: discord.js v14 + @discordjs/rest v2
- Music: Poru v5 (Lavalink). Spotify URLs resolved **client-side** via `spotify-url-info` (public oEmbed, no auth) → each track re-searched on Lavalink's YouTube Music source. **Spotify is never an audio source** — only track name + artist are scraped; playback is always from YouTube. (The Lavalink `application.yml` ships the `lavasrc` Spotify plugin and reads `SPOTIFY_CLIENT_*`, but the bot never sends Spotify URLs to Lavalink, so both stay inert.)
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

## Environment Variables

All env read via `@/constants` — never `process.env.*` in app code.

```
DISCORD_CLIENT_ID  DISCORD_CLIENT_NAME  DISCORD_TOKEN  DISCORD_PERMISSION_INTEGER
MONGO_URL  REDIS_URL  REDIS_USERNAME  REDIS_PASSWORD
LAVALINK_HOST  LAVALINK_PORT  LAVALINK_PASSWORD
SPOTIFY_CLIENT_ID  SPOTIFY_CLIENT_SECRET  NODE_ENV
ERROR_WEBHOOK_URL  (optional — webhook for error reporter; falls back to console)
```

## Module Aliases

`tsconfig.json`: `@/*` → `src/*`. All static imports use `@/...`; relative `../../...` forbidden. Dynamic imports in `src/loader.ts` still use `path.join(__dirname, ...)` — filesystem walk only, aliases apply to static imports.

## Architecture

@.claude/rules/architecture.md

## Language Rules

@.claude/rules/lang.md

## Key Files

- `app.ts` · `src/loader.ts` (auto-discovers events/interactions/music events, not alias-aware)
- `src/classes.ts` — `MainInteraction/MainEvent/MainMusicEvent/MainShardEvent`
- `src/client.ts` — `BaseClient` extending `Client`
- `src/constants.ts` — env var source of truth
- `src/services/general.utils.ts` — `capitalizeString`, `getError`, `formatDuration`, `sleepFor`, `escapeRegex`, `mapInChunks` (bounded-parallel batch async)
- `src/services/error.reporter.ts` — `reportError({ source, error, context? })` + `ctxFromInteraction`/`ctxFromPlayer` helpers; webhook + dedup + rate-limit, falls back to console if `ERROR_WEBHOOK_URL` unset
- `src/services/process.handlers.ts` — `registerProcessHandlers()` for `unhandledRejection` + `uncaughtException` (called from `app.ts`)
- `src/services/music/spotify.resolver.ts` — Spotify metadata scrape → YT Music re-search
- `src/services/music/now.playing.panel.ts` — persistent self-editing now-playing embed + emoji-only control buttons (`upsertPanel`/`clearPanel`), 5s live ticker, per-player action lock
- `src/services/discord/` — `embed/button/select/modal.builder` (never raw), `interaction.collector` (`buildCustomIds` accepts array OR `as const` object), `guild.player`, `counter.access`, `lockdown.restore` (parallelised), `presence` (rotating bot status)
- `src/models/<domain>/<domain>.constants.ts` — action/modal customId constants

## Conventions

@.claude/rules/conventions.md

## Project Slash Commands

Live in `.claude/commands/`, on top of the user-scope ones. Prefer these over hand-rolling the same flow:

`/new-command` (slash command scaffold) · `/new-event` (event or music-event scaffold) · `/new-module` (`/init` panel module) · `/debug-music` (Lavalink / Poru pipeline triage) · `/review` (current diff) · `/pr`

No project agents or hooks — user-scope ones apply unchanged (code writes → `sonnet-executor`, research → `opus-researcher`/`Explore`, PreToolUse still blocks native `Read`/`Grep`/`Glob`).

## Do NOT

- `npm` / `pnpm` / `yarn`
- `ephemeral: true` — use `flags: MessageFlags.Ephemeral`
- Construct `EmbedBuilder / ButtonBuilder / {Channel,String,Role,User}SelectMenuBuilder / ModalBuilder / TextInputBuilder / ActionRowBuilder` directly
- `$set: { subdoc: fullObject }` — dot-notation keys only
- Skip `deferReply()` at start of `run()`
- Read DB state inside `onEnd` that was written inside `collect`
- Use `any`
- Put non-`{schema,model,service,types,constants,index}.ts` files under `src/models/**`
- Import `src/models/<x>/<y>.service.ts` directly — use barrel (`@/models/x`)
- Use relative imports — always `@/*`
- `process.env.*` — import from `@/constants`
- Serial `await` over an array — use `mapInChunks` from `@/services/general.utils`

## MCP Plugins

> `code-review-graph` and `bun-docs-mcp` are **gone** — do not call `mcp__plugin_code-review-graph_*` or bun-docs tools. Stale allow-entries for them still sit in `.claude/settings.local.json`, and `.code-review-graph/` at the repo root is a dead artifact.

| Server | Use |
|---|---|
| **graphify** | Call structure: `query_graph`, `get_neighbors`, `get_pr_impact`, `god_nodes`. This repo has real call edges (loader -> classes -> interactions/events), so per @~/.claude/rules/code-graph.md ask the graph before grepping the tree. Re-extract after refactors that move files. |
| **context7** | Any discord.js / Poru / Mongoose / ioredis / Bun question — `resolve-library-id` then `query-docs`. Never answer library API questions from memory; discord.js v14 and Poru v5 both moved fast. |
| **github** | PRs, checks, issues; `pull_request_review_write`, `create_pull_request` (check `.github/PULL_REQUEST_TEMPLATE` first) |

## On Compaction, Preserve

- Current branch + in-progress feature context
- Unresolved TypeScript / runtime issues
- Pending schema changes or new env vars
