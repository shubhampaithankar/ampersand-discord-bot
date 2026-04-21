# Conventions

## Interaction Handler Template

Every `run()` follows this exact shape:

```ts
run = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  try {
    // ... logic
    await interaction.editReply({ embeds: [...] });
  } catch (error: any) {
    console.log("There was an error in <Name> command: ", error);
    await interaction.editReply(`There was an error \`${error.message}\``);
  }
};
```

Every button/select handler inside a collector:
```ts
async (i) => {
  await i.deferUpdate(); // always first
  // ...
}
```

## Ephemeral Replies

```ts
flags: MessageFlags.Ephemeral  // ✅ v14
ephemeral: true                // ❌ deprecated
```

## Builders — Always Use Wrappers

```ts
// ❌ Never
new EmbedBuilder().setTitle("...")
new ButtonBuilder().setLabel("...")
new ActionRowBuilder().addComponents(...)
new ChannelSelectMenuBuilder().setCustomId(...)
new StringSelectMenuBuilder().setCustomId(...)
new RoleSelectMenuBuilder().setCustomId(...)
new UserSelectMenuBuilder().setCustomId(...)
new ModalBuilder().setCustomId(...)
new TextInputBuilder().setLabel(...)

// ✅ Always
infoEmbed({ title: "..." })          // blue
successEmbed({ ... })                 // green
errorEmbed({ ... })                   // red
warnEmbed({ ... })                    // yellow
musicEmbed({ ... })                   // Spotify green
buildButton({ label, style, customId })
buildRow(btn1, btn2)
toggleButton(enabled, customId)       // green Enable / red Disable
buildChannelSelectRow({ customId, types, placeholder? })
buildStringSelectRow({ customId, options, placeholder? })
buildRoleSelectRow({ customId, placeholder? })
buildUserSelectRow({ customId, placeholder? })
buildModal({ customId, title, inputs: [{ customId, label, ... }] })
buildTextInput({ customId, label, style?, placeholder?, required?, minLength?, maxLength? })
```

## Collector Patterns

- `createButtonHandler` — persistent panels (omit `max`) or one-shot confirms (`max: 1`)
- `createPaginator` — paginated embeds with prev/next/cancel buttons
- `createChainedCollector` — multi-step flows (e.g. button → channel select)
- `buildCustomIds({ interaction, actions })` — always use this for custom IDs, never hardcode. `actions` accepts either a `readonly string[]` or an `as const` object (preferred — pass the module's `*_ACTIONS` constant)

## Action Constants

customId action strings live in `src/models/<domain>/<domain>.constants.ts` as `as const` objects (SCREAMING_SNAKE keys → camelCase string values), exported via the barrel `index.ts`. Modal input customIds go in the same file (e.g. `COUNTER_MODAL_INPUTS`). Paginator actions (`prevPage`/`nextPage`/`cancel`) stay inline — shared across too few call sites to justify centralising. Pass the constants object directly to `buildCustomIds`; access returned record with either `ids.<action>` (TS-verified via Record key) or `ids[ACTIONS.KEY]` (explicit — use for clarity in shared-string blocks).

**Timing rule:** never read DB state inside `onEnd` that was written inside `collect`.
Discord fires `end` without awaiting the async `collect` handler. Do all DB reads + re-renders
inside the handler body after `await`-ing the DB op. Use `onEnd` only for cleanup (remove buttons).

## MongoDB Updates

Always dot-notation `$set` — never replace the full subdocument:

```ts
// ✅ preserves sibling fields
{ $set: { "autoGamble.enabled": true } }

// ❌ wipes chance, timeoutDuration, channelIds
{ $set: { autoGamble: { enabled: true } } }
```

## Naming

- camelCase variables, PascalCase classes/types/interfaces
- Interaction class names: `<Name>Interaction`
- Event class names: `<Name>Event`
- Event filenames must equal the Discord.js/Poru event name exactly

## Function Parameters

Destructured options object for any function with >2 params — all services follow this.
Exception: variadic rest params and simple 2-param functions.

## Adding a New Slash Command

1. `src/interactions/<category>/<name>.ts`
2. Default-export class extending `MainInteraction`
3. Set `category: "Music"` for music commands (triggers channel check in routing)
4. `deferReply()` first, `editReply()` throughout, try/catch wrapping
5. For autocomplete on a string option: `.setAutocomplete(true)` on the option, then add `autocomplete = async (i: AutocompleteInteraction) => { await i.respond([{ name, value }]) }` as a method on the class. Routing dispatches it before guild/perm/cooldown checks.
6. Import models via the barrel: `import { XService } from "../../models/x"` — never `import * as XService from ".../x.service"`.

## Adding a New Event

1. `src/events/<subdir>/<EventName>.ts` — filename **must equal** the event name
2. Default-export class extending `MainEvent`, `super(client, Events.EventName)`

## Adding a New Music Event

1. `src/musicEvents/<subdir>/<eventName>.ts` — filename **must equal** Poru's event name
2. Default-export class extending `MainMusicEvent`
