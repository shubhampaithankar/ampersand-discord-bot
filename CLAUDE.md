# Ampersand Discord Bot

## Stack

- Runtime: Bun (never npm/pnpm/yarn) · TypeScript 5.x
- Discord: discord.js v14 + @discordjs/rest v2
- Music: Poru v5 (Lavalink). Spotify URLs resolved **client-side** via `spotify-url-info` (public oEmbed, no auth) → each track re-searched on Lavalink's YouTube Music source. poru-spotify + LavaSrc both abandoned (v4/v5 mismatch + premium-owner requirement).
- DB: MongoDB (Mongoose v7) · Cache: Redis (ioredis v5)
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
```

## Module Aliases

`tsconfig.json`: `@/*` → `src/*`. All static imports use `@/...`; relative `../../...` forbidden. Dynamic imports in `src/loader.ts` still use `path.join(__dirname, ...)` — filesystem walk only, aliases apply to static imports.

## Architecture

@.claude/rules/architecture.md

## Key Files

- `app.ts` · `src/loader.ts` (auto-discovers events/interactions/music events, not alias-aware)
- `src/classes.ts` — `MainInteraction/MainEvent/MainMusicEvent/MainShardEvent`
- `src/client.ts` — `BaseClient` extending `Client`
- `src/constants.ts` — env var source of truth
- `src/services/general.utils.ts` — `capitalizeString`, `getError`, `formatDuration`, `sleepFor`, `escapeRegex`, `mapInChunks` (bounded-parallel batch async)
- `src/services/music/spotify.resolver.ts` — Spotify metadata scrape → YT Music re-search
- `src/services/discord/` — `embed/button/select/modal.builder` (never raw), `interaction.collector` (`buildCustomIds` accepts array OR `as const` object), `guild.player`, `counter.access`, `lockdown.restore` (parallelised)
- `src/models/<domain>/<domain>.constants.ts` — action/modal customId constants

## Conventions

@.claude/rules/conventions.md

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

| Plugin | Use |
|---|---|
| **code-review-graph** | `get_review_context_tool` + `get_impact_radius_tool` before reviews; `semantic_search_nodes_tool` + `query_graph_tool` (`callers_of/callees_of/file_summary`) for lookups; `build_or_update_graph_tool` after big refactors |
| **bun-docs-mcp** | Bun APIs, `Bun.*` globals, bundler, `bun test` |
| **mcp-server-github** | PRs, checks, issues; `pull_request_review_write`, `create_pull_request` (check `.github/PULL_REQUEST_TEMPLATE` first) |

## On Compaction, Preserve

- Current branch + in-progress feature context
- Unresolved TypeScript / runtime issues
- Pending schema changes or new env vars
