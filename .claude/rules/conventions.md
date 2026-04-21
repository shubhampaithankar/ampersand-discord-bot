# Conventions

## Handler Template

```ts
run = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  try {
    // ... logic → interaction.editReply({ embeds: [...] })
  } catch (error: any) {
    console.log("There was an error in <Name> command: ", error);
    await interaction.editReply(`There was an error \`${error.message}\``);
  }
};
```

Button/select handler inside a collector: `await i.deferUpdate()` **first**, always.

## Ephemeral

`flags: MessageFlags.Ephemeral` ✅ · `ephemeral: true` ❌ (deprecated)

## Builder Wrappers — Never Construct Raw

Never `new EmbedBuilder/ButtonBuilder/ActionRowBuilder/{Channel,String,Role,User}SelectMenuBuilder/ModalBuilder/TextInputBuilder`.

Use: `infoEmbed/successEmbed/errorEmbed/warnEmbed/musicEmbed`, `buildButton`, `buildRow`, `toggleButton`, `build{Channel,String,Role,User}SelectRow`, `buildModal`, `buildTextInput`.

## Collectors

- `createButtonHandler` — persistent panel (omit `max`) or confirm (`max: 1`)
- `createPaginator` — prev/next/cancel pages
- `createChainedCollector` — multi-step flows
- `buildCustomIds({ interaction, actions })` — never hardcode. `actions` = `readonly string[]` OR `as const` object (preferred: pass module's `*_ACTIONS` constant)

**Timing rule:** never read DB state inside `onEnd` that was written inside `collect` — Discord fires `end` without awaiting the async `collect`. Do reads + re-renders inside the handler body after `await`-ing the DB op. `onEnd` only for cleanup.

## Action Constants

customId action strings live in `src/models/<domain>/<domain>.constants.ts` as `as const` objects (SCREAMING_SNAKE → camelCase values), exported via barrel. Modal input customIds in the same file. Pass the object to `buildCustomIds`; access via `ids.<action>` or `ids[ACTIONS.KEY]`. Paginator `prevPage/nextPage/cancel` stays inline.

## Imports

- Always `@/*` alias. Never relative `../../...`.
- Models via barrel: `import { XService, X_ACTIONS } from "@/models/x"` — never `"@/models/x/x.service"`.
- Env vars via `@/constants`.

## Batch Async

For independent async ops over an array, use `mapInChunks` from `@/services/general.utils` — never serial `for...await`:

```ts
await mapInChunks(items, 5, async (item) => work(item));
```

`fn` should `.catch()` per-item if partial failure is acceptable. Size: 5 for Discord API, higher for DB/Redis.

## MongoDB

Dot-notation `$set` only — never replace a subdoc:

```ts
{ $set: { "autoGamble.enabled": true } }     // ✅
{ $set: { autoGamble: { enabled: true } } }  // ❌ wipes siblings
```

## Naming

camelCase vars · PascalCase classes/types · `<Name>Interaction` / `<Name>Event` · event filenames **must equal** the Discord.js/Poru event name exactly.

## Function Parameters

Destructured options object for any function with >2 params. Exception: variadic rest + simple 2-param fns.

## Adding a Slash Command

1. `src/interactions/<category>/<name>.ts` — default-export class extending `MainInteraction`
2. `category: "Music"` for music commands (triggers channel check)
3. `deferReply()` first, `editReply()` throughout, try/catch wrapping
4. Autocomplete: `.setAutocomplete(true)` + `autocomplete = async (i: AutocompleteInteraction) => { await i.respond([{ name, value }]) }` method. Routing dispatches before guild/perm/cooldown.
5. Import models via barrel (`@/models/x`), never service file directly.

## Adding an Event / Music Event

`src/events/<subdir>/<EventName>.ts` or `src/musicEvents/<subdir>/<eventName>.ts` — filename **must equal** the event name. Default-export class extending `MainEvent` / `MainMusicEvent`.
