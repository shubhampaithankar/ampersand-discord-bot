import { APIEmbedField, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { botAuthor, infoEmbed } from "@/services/discord/embed.builder";
import { capitalizeString } from "@/services/general.utils";
import { HelpInteractionType } from "@/types/interaction.types";

export default class HelpInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("shows help menu")
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription("help regarding the command / category")
            .setRequired(false),
        ),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const query = interaction.options.getString("query")?.toLowerCase();
      const fields: APIEmbedField[] = [];
      let title = "Help";

      const interactions: HelpInteractionType = {};
      this.client.interactions.forEach((interaction) => {
        const category = `${interaction.category?.toLowerCase()}`;
        if (!Object.prototype.hasOwnProperty.call(interactions, category)) {
          interactions[category] = [];
        }
        interactions[category].push(interaction.data as SlashCommandBuilder);
      });

      const categories = Array.from(
        new Set(Object.keys(interactions).map((item) => (item !== "" ? item : "misc"))),
      );

      if (!query) {
        categories.forEach((category) => {
          const commandsString = interactions[category !== "misc" ? category : ""]
            .map((item) => `\`${item.name}\``)
            .join(" ");
          fields.push({
            name: capitalizeString(category),
            value: commandsString,
          });
        });
      } else {
        const commands: string[] = [];
        Object.values(interactions).forEach((item) =>
          item.forEach((command) => commands.push(command.name.toLowerCase())),
        ) as unknown as string[];
        if (commands.includes(query)) {
          const command = Object.values(interactions)
            .flatMap((item) => item)
            .find((c) => c.name === query)!;
          fields.push(
            {
              name: "Name",
              value: `\`${command.name}\``,
              inline: true,
            },
            {
              name: "Description",
              value: `${command.description}`,
            },
          );
          const options = command.options.map((option) => `\`${option.toJSON().name}\``).join(", ");
          fields.push({
            name: "Params",
            value: options || "None",
          });
        } else if (categories.includes(query)) {
          const category = query === "misc" ? "" : query;
          const data = interactions[category];
          title = `${capitalizeString(query)} Category`;

          for (const command of data) {
            fields.push({
              name: command.name,
              value: `\`${command.description}\``,
            });
          }
        }
      }

      const embed = infoEmbed({
        author: botAuthor(this.client),
        title,
        fields,
        footer: interaction.member!.user.username,
        timestamp: true,
      });

      await interaction.editReply({ embeds: [embed] });
      return;
    } catch (error: any) {
      console.log("There was an error in Help command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
      return;
    }
  };
}
