# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun --watch app.ts        # development (hot-reload)
NODE_ENV=PROD bun run app.ts  # production
docker compose up -d         # docker
```

No test suite is configured.

## Environment Variables

```
DISCORD_CLIENT_ID  DISCORD_CLIENT_NAME  DISCORD_TOKEN  DISCORD_PERMISSION_INTEGER
MONGO_URL  REDIS_URL  REDIS_USERNAME  REDIS_PASSWORD
LAVALINK_HOST  LAVALINK_PORT  LAVALINK_PASSWORD
SPOTIFY_CLIENT_ID  SPOTIFY_CLIENT_SECRET
NODE_ENV
```

## Architecture

**Entry point:** `app.ts` → `BaseClient` → `Loader.init()` → `client.login(token)`

### Loader (`src/loader.ts`)

Recursively imports files from `src/events/`, `src/musicEvents/`, `src/interactions/`. The default export must extend `MainEvent`, `MainMusicEvent`, or `MainInteraction` to be registered. Event names must match filenames.

### Interaction routing (`src/events/interaction/interactionCreate.ts`)

guild check → command lookup (name or alias) → `checkPermissions(bot, member)` → cooldown (default 2s) → for Music category, verify channel in DB → `command.run()`

### Permission service (`src/services/discord.permissions.ts`)

- `checkPermissions(bot, member, permissions, channel?)` — checks **both** bot and member
- `checkSinglePermissions(member, permissions, channel?)` — checks one
- `formatMissingPermissions(missing, member, label)` — formats error string

### Collector service (`src/services/interaction.collector.ts`)

- `buildCustomIds(interaction, ...actions)` — generates unique per-invocation custom IDs
- `createPaginator(interaction, pages, customIds, buttonRow, opts?)` — single persistent collector with closure-tracked page state; use for paginated embeds
- `createButtonHandler(channel, handlers, filter, time, onEnd?)` — one-shot button handler mapping customIds to async functions

### Data layer

- **MongoDB** — `src/libs/mongo.ts`. Models in `src/models/` (`Guild`, `Music`, `JTC`, `Lockdown`), each with a `service.ts`.
- **Redis** — `src/libs/redis.ts`. Used only for JTC channel set caching via `src/services/jtc.redis.ts`.

### Music

Poru (Lavalink) + `poru-spotify`. Player retrieval/creation via `Utils.getMusicPlayer()`. Music commands require the invoking channel to be registered in the `Music` model.

## Adding a New Slash Command

1. Create a file under `src/interactions/<category>/`
2. Default-export a class extending `MainInteraction`
3. Pass a `SlashCommandBuilder` as `data`, set `category` if it's a Music command
4. Implement `async run(interaction)`
5. For interactions with buttons/selects, use `createButtonHandler` or `createPaginator` from `src/services/interaction.collector.ts` — always pass a `time` limit to collectors
