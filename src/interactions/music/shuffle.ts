import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { botAuthor, successEmbed } from "@/services/discord/embed.builder";
import { validateMusicContext } from "@/services/discord/guild.player";
import { ctxFromInteraction, reportError } from "@/services/error.reporter";

export default class ShuffleInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder().setName("shuffle").setDescription("shuffles the queue"),
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

      ctx.player.queue.shuffle();

      await interaction.editReply({
        embeds: [
          successEmbed({
            author: botAuthor(this.client),
            description: `🔀 Queue shuffled — **${ctx.player.queue.length}** track${ctx.player.queue.length !== 1 ? "s" : ""} reordered`,
            footer: interaction.member!.user.username,
          }),
        ],
      });
    } catch (error: any) {
      await reportError({
        source: "interaction.shuffle",
        error,
        context: ctxFromInteraction(interaction),
      });
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
