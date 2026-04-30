import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { botAuthor, successEmbed } from "@/services/discord/embed.builder";
import { validateMusicContext } from "@/services/discord/guild.player";
import { ctxFromInteraction, reportError } from "@/services/error.reporter";

export default class SkipInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder().setName("skip").setDescription("skips current track"),
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

      const { title } = ctx.player.currentTrack.info;
      await ctx.player.skip();

      await interaction.editReply({
        embeds: [
          successEmbed({
            author: botAuthor(this.client),
            description: `⏭ Skipped **${title}**`,
            footer: interaction.member!.user.username,
          }),
        ],
      });
    } catch (error: any) {
      await reportError({
        source: "interaction.skip",
        error,
        context: ctxFromInteraction(interaction),
      });
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
