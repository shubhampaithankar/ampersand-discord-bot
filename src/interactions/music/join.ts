import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import { getMusicPlayer } from "../../services/guild.player";

export default class JoinInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder()
        .setName("join")
        .setDescription("joins the user's voice channel"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
    await interaction.deferReply();
    try {
      const guild = this.client.guilds.cache.get(interaction.guildId!);
      if (!guild) return;

      const member = guild.members.cache.get(interaction.member!.user.id);
      if (!member) return;

      const { channel } = member.voice;
      if (!channel) {
        await interaction.editReply("You need to join a voice channel");
        return;
      }

      const player = getMusicPlayer({
        client: this.client,
        guildId: guild.id,
        voiceChannel: channel.id,
        textChannel: interaction.channelId,
        create: true,
      });
      if (!player) {
        await interaction.editReply("Unable to create player");
        return;
      }

      if (player.isConnected) {
        if (player.voiceChannel !== channel.id) {
          await interaction.editReply(
            "There is a player already present in another voice channel",
          );
          return;
        }
      }

      player.connect();
      await interaction.editReply(`Joined **${channel.name}**`);
      return;
    } catch (error: any) {
      console.log("There was an error in Join command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
      return;
    }
  };
}
