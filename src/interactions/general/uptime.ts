import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import moment from "moment";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { ctxFromInteraction, reportError } from "@/services/error.reporter";

export default class UptimeInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      data: new SlashCommandBuilder()
        .setName("uptime")
        .setDescription("how long the bot has been running since it was last started"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    try {
      const uptime = moment.duration(Date.now() - this.client.startTime);
      const formattedUptime = `${uptime.days()}d ${uptime.hours()}h ${uptime.minutes()}m ${uptime.seconds()}s`;

      await interaction.reply(`**Uptime:** \`${formattedUptime}\``);
    } catch (error: any) {
      await reportError({
        source: "interaction.uptime",
        error,
        context: ctxFromInteraction(interaction),
      });
      await interaction.reply(`There was an error \`${error.message}\``);
      return;
    }
  };
}
