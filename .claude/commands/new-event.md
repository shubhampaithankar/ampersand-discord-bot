# New Event

Scaffold a Discord.js or Poru music event handler.

## Arguments

`$ARGUMENTS` — `<type> <eventName>`

- `type` = `discord` | `music`
- `eventName` = exact event name (e.g. `guildMemberAdd`, `trackEnd`)

## Steps

1. **Determine file path:**
   - `discord` → `src/events/<subdir>/<eventName>.ts`
   - `music` → `src/musicEvents/<subdir>/<eventName>.ts`

2. **Critical:** filename must exactly match the event name — the loader uses it as the event key.

3. **Discord event:**

```ts
import { Events } from "discord.js";
import { MainEvent } from "../../classes";
import Client from "../../client";

export default class <Name>Event extends MainEvent {
  constructor(client: Client) {
    super(client, Events.<Name>);
  }
  async run(/* typed args */) {
    try { } catch (error) { console.log(error); }
  }
}
```

4. **Music event:**

```ts
import { Player, Track } from "poru";
import { MainMusicEvent } from "../../classes";
import Client from "../../client";

export default class <Name>Event extends MainMusicEvent {
  constructor(client: Client) {
    super(client, "<eventName>");
  }
  async run(player: Player, track: Track) {
    try { } catch (error) { console.log(error); }
  }
}
```
