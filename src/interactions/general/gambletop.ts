import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { botAuthor, infoEmbed } from "@/services/discord/embed.builder";
import { getGambleLeaderboard } from "@/services/redis/gamble.redis";

export default class GambletopInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      data: new SlashCommandBuilder()
        .setName("gambletop")
        .setDescription("shows the auto gamble timeout leaderboard"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const guild = interaction.guild!;
      const entries = await getGambleLeaderboard(guild.id, 10);

      if (entries.length === 0) {
        await interaction.editReply("No gamble data yet — no one has been timed out!");
        return;
      }

      const medals = ["🥇", "🥈", "🥉"];
      const description = entries
        .map(({ userId, score }, i) => {
          const member = guild.members.cache.get(userId);
          const name = member ? `<@${userId}>` : `\`${userId}\``;
          const prefix = medals[i] ?? `**${i + 1}.**`;
          return `${prefix} ${name} — **${score}** timeout${score !== 1 ? "s" : ""}`;
        })
        .join("\n");

      const embed = infoEmbed({
        author: botAuthor(this.client),
        title: "🎰 Gamble Leaderboard",
        description,
        footer: interaction.member!.user.username,
        timestamp: true,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      console.log("There was an error in Gambletop command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
