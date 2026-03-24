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
```

## Collector Patterns

- `createButtonHandler` — persistent panels (omit `max`) or one-shot confirms (`max: 1`)
- `createPaginator` — paginated embeds with prev/next/cancel buttons
- `createChainedCollector` — multi-step flows (e.g. button → channel select)
- `buildCustomIds({ interaction, actions })` — always use this for custom IDs, never hardcode

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

## Adding a New Event

1. `src/events/<subdir>/<EventName>.ts` — filename **must equal** the event name
2. Default-export class extending `MainEvent`, `super(client, Events.EventName)`

## Adding a New Music Event

1. `src/musicEvents/<subdir>/<eventName>.ts` — filename **must equal** Poru's event name
2. Default-export class extending `MainMusicEvent`
