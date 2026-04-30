import {
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { buildButton, buildRow } from "@/services/discord/button.builder";
import { botAuthor, musicEmbed } from "@/services/discord/embed.builder";
import { validateMusicContext } from "@/services/discord/guild.player";
import { buildCustomIds, createPaginator } from "@/services/discord/interaction.collector";
import { ctxFromInteraction, reportError } from "@/services/error.reporter";
import { formatDuration } from "@/services/general.utils";

export default class QueueInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder().setName("queue").setDescription("shows the current queue"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const ctx = await validateMusicContext(this.client, interaction);
      if (!ctx) return;

      const { player } = ctx;
      const { currentTrack } = player;
      if (!currentTrack) {
        await interaction.editReply("There is no music playing");
        return;
      }

      const tracks = player.queue.map(
        (track, i) =>
          `**${i + 1}.** - [${track.info.title}](${track.info.uri || ""}) - \`${formatDuration(track.info.length)}\` • ${track.info.requester}`,
      );
      const queueDuration = formatDuration(
        player.queue.map((track) => track.info.length).reduce((acc, curr) => acc + curr, 0),
      );

      const pages: EmbedBuilder[] = [];
      const pagesNumber = Math.max(1, Math.ceil(player.queue.length / 10));

      for (let i = 0; i < pagesNumber; i++) {
        const str = tracks.slice(i * 10, i * 10 + 10).join("\n");
        const page = musicEmbed({
          author: botAuthor(this.client),
          title: "Queue",
          description: `**Now Playing:**\n[${currentTrack.info.title}](${currentTrack.info.uri || ""}) — \`${formatDuration(currentTrack.info.length)}\` • ${currentTrack.info.requester}\n\n${str === "" ? "*Nothing in queue*" : str}`,
          footer: `${i + 1} / ${pagesNumber} • Total Duration ${queueDuration} • ${interaction.member!.user.username}`,
        });
        pages.push(page);
      }

      const ids = buildCustomIds({
        interaction,
        actions: ["prevPage", "nextPage", "cancel"] as const,
      });

      const buttonRow = buildRow(
        buildButton({ label: "Previous", style: ButtonStyle.Secondary, customId: ids.prevPage }),
        buildButton({ label: "Next", style: ButtonStyle.Secondary, customId: ids.nextPage }),
        buildButton({ label: "Cancel", style: ButtonStyle.Secondary, customId: ids.cancel }),
      );

      const moreThanOne = pagesNumber > 1;
      await interaction.editReply({
        embeds: [pages[0]],
        components: moreThanOne ? [buttonRow] : undefined,
      });

      if (moreThanOne) {
        createPaginator({
          interaction,
          pages,
          customIds: { prev: ids.prevPage, next: ids.nextPage, cancel: ids.cancel },
          buttonRow,
        });
      }
    } catch (error: any) {
      await reportError({
        source: "interaction.queue",
        error,
        context: ctxFromInteraction(interaction),
      });
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
