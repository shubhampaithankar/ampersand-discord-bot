import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { botAuthor, successEmbed } from "@/services/discord/embed.builder";
import { validateMusicContext } from "@/services/discord/guild.player";
import { ctxFromInteraction, reportError } from "@/services/error.reporter";

const MODE_LABELS = { NONE: "Off", TRACK: "Track", QUEUE: "Queue" } as const;
const MODE_ICONS = { NONE: "➡️", TRACK: "🔂", QUEUE: "🔁" } as const;

export default class LoopInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("sets the loop mode for the player")
        .addStringOption((option) =>
          option
            .setName("mode")
            .setDescription("loop mode to set")
            .setRequired(true)
            .addChoices(
              { name: "Off", value: "NONE" },
              { name: "Track", value: "TRACK" },
              { name: "Queue", value: "QUEUE" },
            ),
        ) as SlashCommandBuilder,
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const ctx = await validateMusicContext(this.client, interaction);
      if (!ctx) return;

      if (!ctx.player.currentTrack) {
        await interaction.editReply("There is no music playing");
        return;
      }

      const mode = interaction.options.getString("mode", true) as "NONE" | "TRACK" | "QUEUE";
      ctx.player.setLoop(mode);

      await interaction.editReply({
        embeds: [
          successEmbed({
            author: botAuthor(this.client),
            description: `${MODE_ICONS[mode]} Loop set to **${MODE_LABELS[mode]}**`,
            footer: interaction.member!.user.username,
          }),
        ],
      });
    } catch (error: any) {
      await reportError({
        source: "interaction.loop",
        error,
        context: ctxFromInteraction(interaction),
      });
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
