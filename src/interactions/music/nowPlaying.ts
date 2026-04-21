import { ButtonStyle, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import { botAuthor, musicEmbed } from "../../services/discord/embed.builder";
import { buildButton, buildRow } from "../../services/discord/button.builder";
import { validateMusicContext } from "../../services/discord/guild.player";
import { formatDuration } from "../../services/general.utils";
import { buildCustomIds, createButtonHandler } from "../../services/discord/interaction.collector";

const BAR_LENGTH = 22;

const buildProgressBar = (position: number, duration: number): string => {
  const ratio = duration > 0 ? Math.max(0, Math.min(position / duration, 1)) : 0;
  const filled = Math.round(ratio * BAR_LENGTH);
  return "`" + "▰".repeat(filled) + "◉" + "▱".repeat(BAR_LENGTH - filled) + "`";
};

const LOOP_LABELS: Record<string, string> = {
  NONE: "Off",
  TRACK: "🔂 Track",
  QUEUE: "🔁 Queue",
};

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

      const buildEmbed = () => {
        const track = player.currentTrack!;
        const { title, uri, length, artworkUrl, author, requester } = track.info;
        const position = player.position ?? 0;
        const loopLabel = LOOP_LABELS[player.loop ?? "NONE"] ?? "Off";

        const description = [
          `### [${title}](${uri || ""})`,
          author ? `by **${author}**` : null,
          "",
          buildProgressBar(position, length),
          `\`${formatDuration(position)}\` **—** \`${formatDuration(length)}\``,
          "",
          `🔁 **Loop:** ${loopLabel}　　📋 **Queue:** ${player.queue.length} track${player.queue.length !== 1 ? "s" : ""}`,
          `👤 **Requested by:** ${requester}`,
        ]
          .filter((line) => line !== null)
          .join("\n");

        return musicEmbed({
          author: botAuthor(this.client),
          title: "Now Playing",
          description,
          thumbnail: artworkUrl || undefined,
          footer: interaction.member!.user.username,
          timestamp: true,
        });
      };

      const ids = buildCustomIds({
        interaction,
        actions: ["skip", "stop", "loop", "shuffle"] as const,
      });

      const buttonRow = buildRow(
        buildButton({ label: "⏭ Skip", style: ButtonStyle.Primary, customId: ids.skip }),
        buildButton({ label: "⏹ Stop", style: ButtonStyle.Danger, customId: ids.stop }),
        buildButton({ label: "🔁 Loop", style: ButtonStyle.Secondary, customId: ids.loop }),
        buildButton({ label: "🔀 Shuffle", style: ButtonStyle.Secondary, customId: ids.shuffle }),
      );

      await interaction.editReply({ embeds: [buildEmbed()], components: [buttonRow] });

      createButtonHandler({
        channel: interaction.channel!,
        handlers: {
          [ids.skip]: async (i) => {
            await i.deferUpdate();
            const title = player.currentTrack?.info.title ?? "Unknown";
            await player.skip();
            await interaction.editReply({
              content: `⏭ Skipped **${title}**`,
              embeds: [],
              components: [],
            });
          },
          [ids.stop]: async (i) => {
            await i.deferUpdate();
            await interaction.editReply({
              content: "⏹ Stopped playing and disconnected",
              embeds: [],
              components: [],
            });
            player.destroy();
          },
          [ids.loop]: async (i) => {
            await i.deferUpdate();
            const modes = ["NONE", "TRACK", "QUEUE"] as const;
            const current = modes.indexOf((player.loop ?? "NONE") as (typeof modes)[number]);
            player.setLoop(modes[(current + 1) % modes.length]);
            await interaction.editReply({ embeds: [buildEmbed()], components: [buttonRow] });
          },
          [ids.shuffle]: async (i) => {
            await i.deferUpdate();
            player.queue.shuffle();
            await interaction.editReply({ embeds: [buildEmbed()], components: [buttonRow] });
          },
        },
        filter: (i) => i.user.id === interaction.member!.user.id,
        time: 1000 * 60 * 5,
        onEnd: async () => {
          await interaction.editReply({ components: [] }).catch(() => {});
        },
      });
    } catch (error: any) {
      console.log("There was an error in NowPlaying command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
