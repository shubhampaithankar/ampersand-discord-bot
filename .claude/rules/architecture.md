# Architecture

## Boot Sequence

`app.ts` → `new Client()` → `client.initialize()` → `loader.init()` → `client.login(token)`

`init()` order: `connectToMongo` + `connectToRedis` → scan `src/events/` → `createPoru` + scan `src/musicEvents/` → scan `src/interactions/` + PUT slash commands globally.

**Critical:** event / music-event filenames must equal the Discord.js / Poru event name exactly — loader keys by filename. Sharding infra commented out.

## Folder Structure

```
src/
  events/                guildCreate, guildDelete, interactionCreate, messageCreate,
                         clientReady (cleanupJTC + recoverLockdowns), voiceStateUpdate (JTC)
  interactions/
    counter/ general/ managing/ modules/init (music/jtc/autogamble/counter panels) music/
  musicEvents/           node, player, track, queueEnd (3-min idle disconnect)
  libs/                  mongo, redis, poru
  models/                # domain slice — only *.{schema,model,service,types,constants}.ts + index.ts
    guild/               guild.*  + jtc/ music/ autoGamble/ (each subdoc of guild)
    lockdown/  counter/
  services/
    discord/             embed/button/select/modal.builder, interaction.collector,
                         discord.permissions, guild.player, counter.access, lockdown.restore
    music/               spotify.resolver (spotify-url-info → YouTube Music re-search)
    redis/               cooldown, jtc, gamble, guild
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

## Batch Pattern

`mapInChunks` in `@/services/general.utils` — use for any array of independent async ops. Current sites: `play.ts` (Spotify YT search), `lockdown.ts` (permissionOverwrites enable), `lockdown.restore.ts` (restore + `recoverLockdowns`). Size 5 for Discord routes, higher for DB/Redis.

## Module Panel (`/init`)

Persistent `createButtonHandler` (no `max`) + `showPanel()` closure re-fetches DB + re-renders via `editReply`. Disable → `editReply({ content, embeds: [], components: [] })`. Enable-with-no-config → `createChainedCollector` prompt then `showPanel()`.
