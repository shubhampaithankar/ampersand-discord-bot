# Ampersand Discord Bot

## Stack

- Runtime: Bun (never npm/pnpm/yarn)
- Language: TypeScript 5.x
- Discord: discord.js v14 + @discordjs/rest v2
- Music: Poru v5 (Lavalink) + poru-spotify enabled (cast as `Plugin` — poru-spotify bundles poru@v4 internally, duplicate type identity)
- Database: MongoDB via Mongoose v7
- Cache: Redis via ioredis v5
- Container: Docker — `oven/bun:alpine` multi-stage

## Build & Run

```bash
bun --watch app.ts              # development (hot-reload)
NODE_ENV=PROD bun run app.ts    # production
docker compose up -d            # containerised
bun run format                  # biome format --write .
bun run lint                    # oxlint
bun run check                   # biome check --write + oxlint
```

No test suite configured. Formatter is Biome, linter is Oxlint (eslint + prettier removed).

## Environment Variables

All env vars read via `src/constants.ts` — never `process.env.*` directly in app code.

```
DISCORD_CLIENT_ID  DISCORD_CLIENT_NAME  DISCORD_TOKEN  DISCORD_PERMISSION_INTEGER
MONGO_URL  REDIS_URL  REDIS_USERNAME  REDIS_PASSWORD
LAVALINK_HOST  LAVALINK_PORT  LAVALINK_PASSWORD
SPOTIFY_CLIENT_ID  SPOTIFY_CLIENT_SECRET  NODE_ENV
```

## Architecture

@.claude/rules/architecture.md

## Key Files

- `app.ts` — entry point
- `src/loader.ts` — auto-discovers and registers all events, interactions, music events
- `src/classes.ts` — `MainInteraction`, `MainEvent`, `MainMusicEvent`, `MainShardEvent`
- `src/client.ts` — `BaseClient` extending discord.js `Client`
- `src/constants.ts` — single source of truth for env vars
- `src/services/discord/embed.builder.ts` — never use `EmbedBuilder` directly
- `src/services/discord/button.builder.ts` — never use `ButtonBuilder`/`ActionRowBuilder<ButtonBuilder>` directly
- `src/services/discord/select.builder.ts` — never use `ChannelSelectMenuBuilder`/`StringSelectMenuBuilder`/`RoleSelectMenuBuilder`/`UserSelectMenuBuilder`/`ActionRowBuilder<SelectMenu>` directly
- `src/services/discord/modal.builder.ts` — never use `ModalBuilder`/`TextInputBuilder` directly
- `src/services/discord/interaction.collector.ts` — all collector/paginator patterns
- `src/services/discord/guild.player.ts` — `getMusicPlayer`, `validateMusicContext`
- `src/services/discord/counter.access.ts` — `canActOnCounter`, `describeActor`
- `src/services/discord/lockdown.restore.ts` — `restoreGuildLockdown`, `recoverLockdowns`

## Conventions

@.claude/rules/conventions.md

## Do NOT

- Use `npm`, `pnpm`, or `yarn`
- Use `ephemeral: true` — use `flags: MessageFlags.Ephemeral`
- Construct `EmbedBuilder`, `ButtonBuilder`, `ChannelSelectMenuBuilder`, `StringSelectMenuBuilder`, `RoleSelectMenuBuilder`, `UserSelectMenuBuilder`, `ModalBuilder`, `TextInputBuilder`, or any `ActionRowBuilder` directly
- Use `$set: { subdoc: fullObject }` — use dot-notation keys to avoid wiping sibling fields
- Skip `deferReply()` at the start of any interaction `run()`
- Read DB state written inside `collect` from an `onEnd` callback
- Use `any` type
- Put anything except `*.schema.ts`, `*.model.ts`, `*.service.ts`, `*.types.ts`, `index.ts` under `src/models/**` — Discord side-effect code lives in `src/services/discord/`
- Import from `src/models/<x>/<y>.service.ts` directly — use the barrel: `import { XService } from "../../models/x"`
- Read `process.env.*` directly in app code — import from `src/constants.ts`

## MCP Plugins

| Plugin | When to use |
|---|---|
| **code-review-graph** | Before reviewing changes — `get_review_context_tool` + `get_impact_radius_tool`. Use `semantic_search_nodes_tool` to find classes/functions, `query_graph_tool` for call chains (`callers_of`, `callees_of`, `file_summary`). Run `build_or_update_graph_tool` after big refactors. |
| **bun-docs-mcp** (`SearchBun`) | Any question about Bun APIs, runtime behaviour, `bun test`, bundler, or `Bun.*` globals — search docs before guessing. |
| **mcp-server-github** | Creating PRs, viewing checks, managing issues. Use `pull_request_review_write` for code reviews, `create_pull_request` for PRs (check for `.github/PULL_REQUEST_TEMPLATE` first). |

## On Compaction, Preserve

- Current branch and in-progress feature context
- Unresolved TypeScript errors or runtime issues
- Pending schema changes or new env vars needed
