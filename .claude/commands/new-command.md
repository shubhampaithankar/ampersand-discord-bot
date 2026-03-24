# New Slash Command

Scaffold a new slash command.

## Arguments

`$ARGUMENTS` — `<category> <name> [description]`

Examples: `music volume Sets the player volume`, `managing warn Warns a user`

## Steps

1. Read a similar existing command in the same category first to match patterns.

2. Create `src/interactions/<category>/<name>.ts`:

```ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import { botAuthor, infoEmbed } from "../../services/discord/embed.builder";

export default class <Name>Interaction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "<Category>",
      data: new SlashCommandBuilder()
        .setName("<name>")
        .setDescription("<description>"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      await interaction.editReply({ embeds: [infoEmbed({
        author: botAuthor(this.client),
        description: "...",
        footer: interaction.member!.user.username,
      })] });
    } catch (error: any) {
      console.log("There was an error in <Name> command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
```

3. Follow conventions in `.claude/rules/conventions.md` — especially builder wrappers, deferReply, and collector patterns.
