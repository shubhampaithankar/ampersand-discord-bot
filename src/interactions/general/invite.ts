import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { DISCORD_CLIENT_ID } from "@/constants";
import { ctxFromInteraction, reportError } from "@/services/error.reporter";

export default class InviteInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("sends an invite link for the bot"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    try {
      const URI = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&scope=bot`;
      await interaction.reply(URI);
    } catch (error: any) {
      await reportError({
        source: "interaction.invite",
        error,
        context: ctxFromInteraction(interaction),
      });
      await interaction.reply(`There was an error \`${error.message}\``);
      return;
    }
  };
}
