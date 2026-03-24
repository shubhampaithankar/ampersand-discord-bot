import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import { botAuthor, successEmbed } from "../../services/discord/embed.builder";
import { validateMusicContext } from "../../services/discord/guild.player";

export default class StopInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("stops the bot from playing and disconnect"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const ctx = await validateMusicContext(this.client, interaction);
      if (!ctx) return;

      await interaction.editReply({
        embeds: [
          successEmbed({
            author: botAuthor(this.client),
            description: "⏹ Stopped playing and disconnected",
            footer: interaction.member!.user.username,
          }),
        ],
      });
      ctx.player.destroy();
    } catch (error: any) {
      console.log("There was an error in Stop command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
