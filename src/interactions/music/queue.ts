import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import {
  buildCustomIds,
  createPaginator,
} from "../../services/interaction.collector";

export default class QueueInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("shows the current queue"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const guild = this.client.guilds.cache.get(interaction.guildId!);
      if (!guild) return;

      const member = guild.members.cache.get(interaction.member!.user.id);
      if (!member) return;

      const player = await this.client.utils.getMusicPlayer(guild.id);
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

      const { currentTrack } = player;
      if (!currentTrack) {
        await interaction.editReply("There is no music playing");
        return;
      }

      const tracks = player.queue.map(
        (track, i) =>
          `**${i + 1}.** - [${track.info.title}](${track.info.uri || ""}) - \`${this.client.utils.formatDuration(track.info.length)}\` • ${track.info.requester}`,
      );
      const queueDuration = this.client.utils.formatDuration(
        player.queue
          .map((track) => track.info.length)
          .reduce((acc, curr) => acc + curr, 0),
      );

      const pages: EmbedBuilder[] = [];
      const pagesNumber = Math.ceil(player.queue.length / 10);

      for (let i = 0; i < pagesNumber; i++) {
        const str = tracks.slice(i * 10, i * 10 + 10).join("\n");
        const page = await this.client.utils.createMessageEmbed({
          author: {
            name: this.client.user!.username,
            iconURL: this.client.user?.avatarURL() || undefined,
          },
          color: "Blue",
          title: "Queue Command",
          description: `
                        **Now Playing:**\n[${currentTrack.info.title}](${currentTrack.info.uri || ""}) - \`${this.client.utils.formatDuration(currentTrack.info.length)}\` • ${currentTrack.info.requester}\n
                        ${str === "" ? " Nothing" : "\n" + str}
                    `,
          footer: {
            text: `${pagesNumber > 0 ? `${i + 1} / ${pagesNumber}` : ""} • Total Duration ${queueDuration} • ${interaction.member!.user.username}`,
          },
        });
        if (!page) throw new Error("Unable to create page");
        pages.push(page);
      }

      const ids = buildCustomIds(interaction, "prevPage", "nextPage", "cancel");

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder({
          label: "Previous",
          style: ButtonStyle.Secondary,
          customId: ids.prevPage,
        }),
        new ButtonBuilder({
          label: "Next",
          style: ButtonStyle.Secondary,
          customId: ids.nextPage,
        }),
        new ButtonBuilder({
          label: "Cancel",
          style: ButtonStyle.Secondary,
          customId: ids.cancel,
        }),
      );

      const moreThanOne = pagesNumber > 1;
      await interaction.editReply({
        embeds: [pages[0]],
        components: moreThanOne ? [buttonRow] : undefined,
      });

      if (moreThanOne) {
        createPaginator(
          interaction,
          pages,
          { prev: ids.prevPage, next: ids.nextPage, cancel: ids.cancel },
          buttonRow,
        );
      }
    } catch (error: any) {
      console.log("There was an error in Queue command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
