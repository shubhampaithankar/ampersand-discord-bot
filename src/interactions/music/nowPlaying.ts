import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import { botAuthor, musicEmbed } from "../../services/embed.builder";
import { getMusicPlayer } from "../../services/guild.player";
import { formatDuration } from "../../services/general.utils";

export default class NowPlayingInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      aliases: ["np"],
      category: "Music",
      data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("shows info on current track"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
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

      const { currentTrack } = player;

      const embed = musicEmbed({
        author: botAuthor(this.client),
        title: "Now Playing",
        description: `**[${currentTrack.info.title}](${currentTrack.info.uri || ""})** — \`${formatDuration(currentTrack.info.length)}\` • ${currentTrack.info.requester}`,
        footer: interaction.member!.user.username,
        thumbnail: currentTrack.info.artworkUrl || undefined,
        timestamp: true,
      });

      await interaction.editReply({ embeds: [embed] });
      return;
    } catch (error: any) {
      console.log("There was an error in NowPlaying command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
      return;
    }
  };
}
