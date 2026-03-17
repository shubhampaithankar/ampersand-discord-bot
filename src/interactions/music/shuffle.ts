import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import { getMusicPlayer } from "../../services/guild.player";

export default class ShuffleInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("shuffles the queue"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const guild = this.client.guilds.cache.get(interaction.guildId!);
      if (!guild) return;

      const member = guild.members.cache.get(interaction.member!.user.id);
      if (!member) return;

      const player = getMusicPlayer({ client: this.client, guildId: guild.id });
      if (!player || !player.isConnected) {
        await interaction.editReply("No player found in any voice channels");
        return;
      }

      const { channel } = member.voice;
      if (!channel) {
        await interaction.editReply("You need to join the voice channel");
        return;
      }

      if (player.voiceChannel !== channel.id) {
        await interaction.editReply("You're not in the same voice channel");
        return;
      }
      if (!player.currentTrack) {
        await interaction.editReply("There is no music playing");
        return;
      }

      player.queue.shuffle();
      await interaction.editReply("Shuffled the queue");
      return;
    } catch (error: any) {
      console.log("There was an error in Shuffle command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
      return;
    }
  };
}
