import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { validateMusicContext } from "@/services/discord/guild.player";
import { upsertPanel } from "@/services/music/now.playing.panel";

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

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const ctx = await validateMusicContext(this.client, interaction);
      if (!ctx) return;

      const { player } = ctx;
      if (!player.currentTrack) {
        await interaction.editReply("There is no music playing");
        return;
      }

      await upsertPanel({ client: this.client, player, channelId: interaction.channelId });
      await interaction.editReply("📻 Anchored now-playing panel here.");
    } catch (error: any) {
      console.log("There was an error in NowPlaying command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
