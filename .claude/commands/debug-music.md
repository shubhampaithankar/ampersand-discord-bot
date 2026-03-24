# Debug Music Pipeline

Investigate music-related issues in this bot.

## Arguments

`$ARGUMENTS` — optional description of the issue (e.g. `player not connecting`, `queue not advancing`)

## Steps

1. **Read the issue context** from `$ARGUMENTS`

2. **Check the relevant files** based on the issue:

   | Issue                     | Files to check                                                                               |
   | ------------------------- | -------------------------------------------------------------------------------------------- |
   | Player not connecting     | `src/interactions/music/play.ts`, `src/libs/poru.ts`, `src/services/discord/guild.player.ts` |
   | Queue not advancing       | `src/musicEvents/track/trackStart.ts`, `src/musicEvents/queueEnd.ts`                         |
   | Commands failing silently | `src/events/interaction/interactionCreate.ts` (music category check)                         |
   | Bot not disconnecting     | `src/events/voiceStateUpdate.ts`, `src/musicEvents/queueEnd.ts`                              |
   | nowPlaying wrong position | `src/interactions/music/nowPlaying.ts` (`player.position`)                                   |

3. **Check music channel validation** — `verifyMusicCommand` in `interactionCreate.ts` requires the channel to be in `guild.music.channelIds`. If a command silently fails, this is often why.

4. **Check Poru config** — `src/libs/poru.ts`:
   - Lavalink node config (host, port, password)
   - `defaultPlatform: "ytmsearch"`
   - Spotify plugin is disabled (`SPOTIFY_ENABLED = false`)

5. **Key music flow:**
   - `/play` → `getMusicPlayer({ create: true })` → `player.resolve()` → `player.queue.add()` → `player.play()`
   - `trackStart` music event fires → sends now-playing embed to text channel
   - `queueEnd` music event → 3-minute timeout → `player.destroy()`
   - `voiceStateUpdate` → if bot left alone in channel → `player.destroy()`

6. **Report findings** with specific file:line references
