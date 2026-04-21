# Architecture

## Boot Sequence

`app.ts` → `new Client()` → `client.initialize()` → `loader.init()` → `client.login(token)`

### Loader (`src/loader.ts`)

`init()` in order:
1. `connectToMongo()` + `connectToRedis()`
2. Scan `src/events/` recursively → register `MainEvent` / `MainShardEvent` listeners
3. `createPoru()` → scan `src/musicEvents/` → register `MainMusicEvent` listeners
4. Scan `src/interactions/` → register `MainInteraction`, PUT all slash commands globally via REST

**Critical:** Event and music event filenames must match the Discord.js / Poru event name exactly — the loader uses the filename as the event key. Sharding infra exists but is commented out.

## Folder Structure

```
src/
  events/
    guild/              guildCreate, guildDelete
    interaction/        interactionCreate (routing pipeline)
    message/            messageCreate (autoGamble)
    clientReady.ts      cleanupJTCChannels + recoverLockdowns on startup
    voiceStateUpdate.ts JTC lifecycle + player disconnect
  interactions/
    counter/            counter (inc / dec / view / list — public)
    general/            help, invite, ping, uptime, gambletop
    managing/           lockdown, purge
    modules/            init (music / jtc / autogamble / counter config panels)
    music/              play, join, stop, skip, queue, clearQueue, loop, shuffle, nowPlaying
  musicEvents/
    node/               nodeConnect, nodeError
    player/             playerUpdate
    track/              trackStart
    queueEnd.ts         3-min idle disconnect
  libs/
    mongo.ts            connectToMongo()
    redis.ts            connectToRedis(), getRedis()
    poru.ts             createPoru() — Lavalink node config
  models/                            # domain slice per folder — only *.{schema,model,service,types}.ts + index.ts
    guild/
      guild.{schema,model,service,types}.ts + index.ts
      jtc/        jtc.{schema,service,types}.ts + index.ts      (subdoc of guild)
      music/      music.{schema,service,types}.ts + index.ts    (subdoc of guild)
      autoGamble/ autoGamble.{schema,service,types}.ts + index.ts (subdoc of guild)
    lockdown/     lockdown.{schema,model,service,types}.ts + index.ts
    counter/      counter.{schema,model,service,types}.ts + index.ts
  services/
    discord/            embed.builder, button.builder, select.builder, modal.builder,
                        interaction.collector, discord.permissions, guild.player,
                        counter.access, lockdown.restore
    redis/              cooldown.redis, jtc.redis, gamble.redis, guild.redis
    general.utils.ts
  types/                ButtonOpts, EmbedOpts, ModalOpts, MusicContext, etc.
```

## Interaction Routing Pipeline (`interactionCreate`)

0. **Autocomplete short-circuit** — if `interaction.isAutocomplete()`, look up the command and call its optional `autocomplete()` method. Skips guild/perm/cooldown checks (read-only lookup, 3s Discord deadline).
1. Guild check
2. Resolve bot member + invoking member from cache
3. Resolve command — `interaction.message?.interaction?.commandName` (button follow-up) OR `interaction.commandName`
4. Lookup by name → alias fallback
5. Assign `command.bot = bot`
6. `checkPermissions` — rejects with formatted message if missing
7. Cooldown check — **skipped for button/select** (`interaction.customId` present)
8. `verifyMusicCommand(guildId, channelId)` — checks `music.enabled` + `music.channelIds`
9. `setCooldown(...)`
10. `command.run(interaction)`

## Data Layer

### MongoDB — Guild document

Sub-documents: `music { enabled, channelIds[] }`, `jtc { enabled, channelId }`,
`autoGamble { enabled, channelIds[], chance, timeoutDuration }`

All updates use dot-notation `$set` to avoid wiping sibling fields:
```ts
{ $set: Object.fromEntries(Object.entries(query).map(([k, v]) => [`subdoc.${k}`, v])) }
```

### MongoDB — Lockdown document

`guildId`, `enabled`, `lockedAt`, `expiresAt?`, `channels[]` — permission snapshots store BigInt bitfields as strings.

### MongoDB — Counter document

`guildId`, `name` (lowercased), `value`, `actor { type, targetId? }`, `createdBy` — compound unique index on `{guildId, name}`. `actor.type` ∈ `everyone | role | user | admin`.

### Redis keys

| Pattern | Type | Purpose |
|---|---|---|
| `cooldown:{command}:{userId}` | string TTL | Command rate limiting |
| `jtc:{guildId}` | set | Active JTC-created channel IDs |
| `gamble:leaderboard:{guildId}` | sorted set | Timeout counts per user |

## Module Panel Pattern (`/init`)

Persistent `createButtonHandler` (no `max`) with a `showPanel()` closure that re-fetches DB + re-renders embed + buttons via `editReply`. On disable → `editReply({ content, embeds: [], components: [] })`. On enable with no config → prompt via `createChainedCollector`, then `showPanel()`.
