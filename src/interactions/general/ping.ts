import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { ctxFromInteraction, reportError } from "@/services/error.reporter";

export default class PingInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      cooldown: 5,
      data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("responds with a message indicating the latency"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    try {
      const reply = await interaction.reply("Pinging...");
      await reply.edit(
        `Pong! \nLatency is ${reply.createdTimestamp - interaction.createdTimestamp}ms. \nAPI Latency is ${Math.round(this.client.ws.ping)}ms`,
      );
    } catch (error: any) {
      await reportError({
        source: "interaction.ping",
        error,
        context: ctxFromInteraction(interaction),
      });
      await interaction.reply(`There was an error \`${error.message}\``);
      return;
    }
  };
}
