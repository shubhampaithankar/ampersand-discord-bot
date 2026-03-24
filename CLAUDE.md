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

**Entry point:** `app.ts` → `new Client()` → `client.initialize()` → `loader.init()` → `client.login(token)`

### Loader (`src/loader.ts`)

On `initialize()`:
1. Connects to MongoDB and Redis
2. Recursively loads `src/events/` → registers as `MainEvent` or `MainShardEvent`
3. Creates Poru music client, loads `src/musicEvents/` → registers as `MainMusicEvent`
4. Recursively loads `src/interactions/` → registers as `MainInteraction`, registers all slash commands globally via Discord REST

The default export of each file must extend the correct base class. Event names must match filenames.

### Classes (`src/classes.ts`)

- **`MainInteraction`** — base for slash commands. Fields: `client`, `type`, `enabled?`, `aliases?`, `category?`, `cooldown?`, `permissions?`, `bot?` (set at runtime), `data`. Methods: `run(interaction)`, `reject({ interaction, message })`. Note: `followUp` and `collector` exist but are deprecated — use collector service instead.
- **`MainEvent`** — base for Discord.js events. Fields: `client`, `name`, `type` (`"once"` | `"on"`). Method: `run(...args)`.
- **`MainMusicEvent`** — base for Poru music events. Same shape as `MainEvent`.
- **`MainShardEvent`** — base for shard manager events. Same shape as `MainEvent`.

### Interaction routing (`src/events/interaction/interactionCreate.ts`)

1. Guild check — return if not in guild
2. Resolve bot and member from guild cache
3. Resolve command name — `interaction.message?.interaction?.commandName` (button/select follow-up) OR `interaction.commandName` (slash command)
4. Command lookup — by name, then by alias
5. Assign `command.bot = bot`
6. Permission check — `checkPermissions({ bot, member, permissions })` — rejects with formatted message if bot or member is missing perms
7. Cooldown check — **skipped for button/select interactions** (`interaction.customId` present) — `getRemainingCooldown(commandName, userId)` — rejects if > 0
8. Music category check — `verifyMusicCommand(guildId, channelId)` — checks music enabled + channel in `channelIds`
9. Set cooldown — `setCooldown({ commandName, userId, ttlSeconds: command.cooldown ?? 2 })`
10. Execute — `command.run(interaction)`

### Voice state update (`src/events/voiceStateUpdate.ts`)

Two parallel operations on every voice state change:
- **Player disconnect** — if user left a channel and bot was the only other member → `player.destroy()`
- **Join-To-Create** — if JTC enabled for guild and user joined the JTC trigger channel → create a new voice channel named `"{username}'s Channel"`, move user in, add to Redis set. On channel leave → if channel empty and in Redis set → delete channel, remove from set.

### Permission service (`src/services/discord.permissions.ts`)

- `checkPermissions({ bot, member, permissions, channel? })` — checks **both** bot and member; returns `DualPermissionCheckResult`
- `checkSinglePermissions({ member, permissions, channel? })` — checks one; returns `PermissionCheckResult`
- `formatMissingPermissions({ missing, member, label? })` — formats error string

### Collector service (`src/services/interaction.collector.ts`)

- `buildCustomIds(interaction, ...actions)` — generates unique per-invocation custom IDs anchored to `channelId_interactionId_action`
- `createPaginator({ interaction, pages, customIds, buttonRow, time?, userId? })` — persistent collector with closure-tracked page state; returns `null` if ≤1 page
- `createButtonHandler({ channel, handlers, filter, time, max?, onEnd? })` — maps customIds to async handlers. Omit `max` for persistent panel; pass `max: 1` for one-shot (confirm dialogs)
- `createChainedCollector({ channel, step })` — multi-step component collector; each step's handler returns the next step config or `null` to terminate

**Timing rule:** Never rely on `onEnd` to read DB state written inside `collect`. Discord.js fires `end` without awaiting the async `collect` handler. Always call `showPanel()` / re-fetch inside the `handler` body after `await`-ing the DB op; use `onEnd` only for cleanup (e.g. removing buttons on timeout).

### Embed builder (`src/services/embed.builder.ts`)

- `buildEmbed(opts?)`, `infoEmbed`, `successEmbed`, `errorEmbed`, `warnEmbed`, `musicEmbed` — typed color wrappers
- `botAuthor(client)` — standard bot author object for embed headers

Never construct `EmbedBuilder` directly — always use these wrappers.

### Button builder (`src/services/button.builder.ts`)

- `buildButton({ label, style, customId?, url?, disabled?, emoji? })` — creates a `ButtonBuilder`
- `buildRow(...buttons)` — wraps buttons into an `ActionRowBuilder<ButtonBuilder>`
- `toggleButton(enabled, customId)` — green "Enable" / red "Disable" shortcut

Never construct `ButtonBuilder` or `ActionRowBuilder<ButtonBuilder>` directly — always use these.

### Music player service (`src/services/guild.player.ts`)

- `getMusicPlayer({ client, guildId, voiceChannel?, textChannel?, create? })` — gets existing Poru player or creates one if `create: true` and voice/text channels provided
- `validateMusicContext(client, interaction)` — validates guild, member, active player, voice channel membership; returns `MusicContext | null` (error already sent on null). Use in every music command that requires an active player.

### General utilities (`src/services/general.utils.ts`)

- `capitalizeString(s)` — capitalizes first letter
- `getError(error)` — extracts message from `Error | string | unknown`
- `formatDuration(milliseconds)` — converts ms to `HH:MM:SS`
- `sleepFor(time)` — `Promise` that resolves after N ms

### Lockdown service (`src/services/lockdown.restore.ts`)

- `restoreGuildLockdown({ client, guildId, channels })` — restores all channel permission overwrites from a saved snapshot and clears the DB record
- `recoverLockdowns(client)` — called in `clientReady`; auto-restores expired scheduled lockdowns immediately; reschedules future ones via `setTimeout`. Manual lockdowns (no `expiresAt`) are left for admin to unlock via `/lockdown`.

### Data layer

- **MongoDB** — `src/libs/mongo.ts`. Two models:
  - `Guild` (`src/models/guild/`) — sub-documents: `music { enabled, channelIds[] }`, `jtc { enabled, channelId }`, `autoGamble { enabled, channelIds[] }`. Top-level fields: `guildId`, `name`, `ownerId`, `deleted`. Services: `guild.service` (CRUD), `music.service`, `jtc.service`, `autoGamble.service`.
  - `Lockdown` (`src/models/lockdown/`) — fields: `guildId`, `enabled`, `lockedAt`, `expiresAt`, `channels[]` (per-channel permission snapshots as BigInt strings). Service: `lockdown.service`.
  - All `findOneAndUpdate` calls use `{ $set: updateQuery }`.
- **Redis** — `src/libs/redis.ts`. Used for:
  - Command cooldowns — `src/services/cooldown.redis.ts` (`setCooldown({ commandName, userId, ttlSeconds })`, `getRemainingCooldown(commandName, userId)`)
  - JTC channel tracking — `src/services/jtc.redis.ts` (`addToSet`, `removeFromSet`, `isPresent`, `cleanupJTCChannels`)

### Music

Poru (Lavalink) + `poru-spotify`. Player managed via `getMusicPlayer` / `validateMusicContext` from `src/services/guild.player.ts`. Music commands require the invoking channel to be registered in `music.channelIds`. Music events live in `src/musicEvents/`.

### Events

- `clientReady` — logs startup, runs `cleanupJTCChannels` + `recoverLockdowns`, initializes Poru, sets presence
- `guildCreate` — creates Guild document in DB
- `guildDelete` — soft-deletes Guild document (`deleted: true`)
- `messageCreate` — handles auto-gamble (10% chance to timeout non-admin user for 30s in enabled channels; announces in `#general` or `#chat` if found)
- `interactionCreate` — full routing (see above)
- `voiceStateUpdate` — player cleanup + JTC (see above)

### Interactions

| Category | Commands |
|---|---|
| General | `help`, `invite`, `ping`, `uptime` |
| Managing | `lockdown`, `purge` |
| Modules | `init` (music / jtc / autogamble panels) |
| Music | `play`, `join`, `stop`, `skip`, `queue`, `clearQueue`, `loop`, `shuffle`, `nowPlaying` |

## Code Practices

### Function parameters
Use a destructured options object when a function has **more than 2 parameters**. All services follow this — see `src/types/` for the param types. Exception: variadic rest params (`...actions`) and 2-param functions are fine as positional.

### Ephemeral replies
Use `flags: MessageFlags.Ephemeral` — `ephemeral: true` is deprecated in discord.js v14.

### Interaction patterns
- `deferReply()` at the start of every `run()`, then `editReply()` throughout
- `deferUpdate()` at the start of every button/select handler inside a collector
- For sub-step flows within a panel (channel select after a button click), use `createChainedCollector` — the outer panel collector keeps running independently

### Module panel pattern (`/init`)
The `/init [module]` command (`src/interactions/modules/init.ts`) manages music, JTC, and autoGamble via a persistent `createButtonHandler` (no `max`) with a `showPanel()` closure that re-fetches DB state and re-renders the embed + buttons in-place.

- **Disable:** `editReply({ content: "...", embeds: [], components: [] })` — closes the panel entirely
- **Enable with existing channels:** enable directly + `showPanel()`
- **Enable with no channels:** show a channel select first, then enable + `showPanel()` after selection

### Lockdown permission capture
Lockdown saves **all** role and user `permissionOverwrites` per channel as BigInt strings (`allow`/`deny` bitfields), then replaces all overwrites with a single `@everyone deny Connect+SendMessages`. Restore uses `channel.permissionOverwrites.set(savedOverwrites)` to atomically reset to exact prior state.

## Adding a New Slash Command

1. Create a file under `src/interactions/<category>/`
2. Default-export a class extending `MainInteraction`
3. Pass a `SlashCommandBuilder` as `data`; set `category: "Music"` for music commands
4. Implement `async run(interaction)`
5. For buttons/selects use `createButtonHandler`, `createPaginator`, or `createChainedCollector` from `src/services/interaction.collector.ts` — always pass `time`
6. Use `buildButton` / `buildRow` / `toggleButton` from `src/services/button.builder.ts`
7. Use `errorEmbed` / `infoEmbed` / etc. from `src/services/embed.builder.ts`
