# Architecture

## Boot Sequence

`app.ts` → `new Client()` → `client.initialize()` → `loader.init()` → `client.login(token)`

`init()` order: `connectToMongo` + `connectToRedis` → scan `src/events/` → `createPoru` + scan `src/musicEvents/` → scan `src/interactions/` + PUT slash commands globally.

**Critical:** event / music-event filenames must equal the Discord.js / Poru event name exactly — loader keys by filename. Sharding infra commented out.

## Folder Structure

```
src/
  events/                guildCreate, guildDelete, interactionCreate, messageCreate,
                         clientReady (cleanupJTC + recoverLockdowns + presence rotation),
                         voiceStateUpdate (JTC + bot-disconnect cleanup), error, shardError, raw
  interactions/
    counter/ general/ managing/ modules/init (music/jtc/autogamble/counter panels) music/
  musicEvents/           node, player, track, queueEnd (3-min idle disconnect)
  libs/                  mongo, redis, poru
  models/                # domain slice — only *.{schema,model,service,types,constants}.ts + index.ts
    guild/               guild.*  + jtc/ music/ autoGamble/ (each subdoc of guild)
    lockdown/  counter/
  services/
    discord/             embed/button/select/modal.builder, interaction.collector,
                         discord.permissions, guild.player, counter.access, lockdown.restore,
                         presence (rotating bot status)
    music/               spotify.resolver, now.playing.panel (persistent NP embed + controls)
    redis/               cooldown, jtc, gamble, guild
    error.reporter.ts    reportError + ctxFromInteraction/ctxFromPlayer (webhook + dedup + ratecap)
    process.handlers.ts  registerProcessHandlers — unhandledRejection + uncaughtException
    general.utils.ts     capitalizeString, getError, formatDuration, sleepFor, escapeRegex, mapInChunks
  types/                 ButtonOpts, EmbedOpts, ModalOpts, MusicContext, etc.
```

## Module Aliases

`tsconfig.json`: `baseUrl: "."` + `paths: { "@/*": ["src/*"] }`. Bun resolves natively. Static imports use `@/*` only. Exception: `loader.ts` uses `path.join(__dirname, dir)` for dynamic filesystem walks.

## Interaction Routing (`interactionCreate`)

0. Autocomplete short-circuit — `interaction.isAutocomplete()` → call `command.autocomplete()` (skips guild/perm/cooldown)
1. Guild check → resolve bot + invoker member → resolve command (`message.interaction.commandName` button follow-up OR `commandName`) → name/alias lookup
2. Assign `command.bot` → `checkPermissions` → cooldown (**skipped for button/select** via `customId`) → `verifyMusicCommand` (music.enabled + channelIds) → `setCooldown` → `command.run`

## Data Layer

- **Guild** — subdocs `music { enabled, channelIds[] }`, `jtc { enabled, channelId }`, `autoGamble { enabled, channelIds[], chance, timeoutDuration }`. Updates use dot-notation `$set` to preserve siblings.
- **Lockdown** — `guildId, enabled, lockedAt, expiresAt?, channels[]`; bitfields stored as strings.
- **Counter** — `guildId, name (lowercased), value, actor { type, targetId? }, createdBy`. Compound unique index `{guildId, name}`. `actor.type` ∈ `everyone | role | user | admin`.

### Redis keys

| Pattern | Type | Purpose |
|---|---|---|
| `cooldown:{command}:{userId}` | string TTL | Rate limiting |
| `jtc:{guildId}` | set | Active JTC channel IDs |
| `gamble:leaderboard:{guildId}` | sorted set | Timeout counts per user |

## Music Pipeline

1. `/play <query>` → `getMusicPlayer` (creates Poru player, connects to VC)
2. Spotify URL → `resolveSpotifyUrl` (spotify-url-info oEmbed scrape, no auth) → `{name, artists}[]`
3. Sequential resolve until first YT Music hit → queue + `player.play()` (~1s start)
4. Rest via `mapInChunks(rest, 5, resolveYt)` in background — parallel batches, order preserved
5. Non-Spotify → single `player.resolve({ query })`; Lavalink picks source

### Now Playing Panel

Single self-editing message per player (`upsertPanel`/`clearPanel` from `@/services/music/now.playing.panel`). State stored on player via `set/get`: `npChannelId`, `npMessageId`, `npCollector`, `npTicker`, `npActionLock`. Lifecycle:

- `trackStart` → `upsertPanel` (edit-or-send + re-attach collector + ensure 5s ticker)
- `queueEnd` (3-min idle destroy) / `voiceStateUpdate` (bot disconnected) / Stop button → `clearPanel`
- `/nowplaying` → re-anchors panel to the invoking channel
- Ticker re-renders every 5s; no-ops while paused; auto-stops if Poru drops the player
- Action lock (`npActionLock`) prevents double-click duplicate state on PREVIOUS/SKIP/STOP/PAUSE; QUEUE exempt (read-only ephemeral)
- Buttons emoji-only, ordered Spotify-style (🔀 ⏮ ▶/⏸ ⏭ 🔁 | 📋 ⏹)

## Batch Pattern

`mapInChunks` in `@/services/general.utils` — use for any array of independent async ops. Current sites: `play.ts` (Spotify YT search), `lockdown.ts` (permissionOverwrites enable), `lockdown.restore.ts` (restore + `recoverLockdowns`). Size 5 for Discord routes, higher for DB/Redis.

## Module Panel (`/init`)

Persistent `createButtonHandler` (no `max`) + `showPanel()` closure re-fetches DB + re-renders via `editReply`. Disable → `editReply({ content, embeds: [], components: [] })`. Enable-with-no-config → `createChainedCollector` prompt then `showPanel()`.

## Error Boundary

Layered swallow-and-report:

- **Process-level** — `registerProcessHandlers()` from `@/services/process.handlers` registers `unhandledRejection` + `uncaughtException` in `app.ts`. Both report and keep running (no exit).
- **discord.js client-level** — `src/events/error.ts` + `shardError.ts` extend `MainEvent`, auto-loaded; report `Events.Error` and `Events.ShardError`.
- **Per-site** — interaction `run` catches, music event catches, voice helpers, timer callbacks, panel collector — all call `reportError` with rich source + context. See `conventions.md` for the source-label shape.
- **Boot path** — `loader.ts` and `client.initialize()` use plain `console.log`; failures are terminal-visible and the bot won't run anyway.

Reporter dedups same-error within 60s and rate-caps to 10 webhook posts/min. Falls back to console when `ERROR_WEBHOOK_URL` unset.
