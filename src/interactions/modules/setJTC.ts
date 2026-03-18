import Client from "../../client";
import { MainInteraction } from "../../classes";
import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  InteractionCollector,
  SlashCommandBuilder,
  VoiceChannel,
} from "discord.js";
import * as JTCService from "../../models/jtc/jtc.service";

export default class SetJTC extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      permissions: ["ManageGuild"],
      category: "Modules",
      data: new SlashCommandBuilder()
        .setName("setjtc")
        .setDescription("shows jtc menu"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    try {
      const customId = `${interaction.channelId}_${interaction.id}_setJTC`;
      const channelOptions = new ChannelSelectMenuBuilder()
        .setCustomId(customId)
        .setChannelTypes(ChannelType.GuildVoice);

      const selectMenu =
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          channelOptions,
        );

      await interaction.reply({
        components: [selectMenu],
      });

      this.collector = interaction.channel!.createMessageComponentCollector({
        componentType: ComponentType.ChannelSelect,
        max: 1,
        time: 1000 * 60 * 15,
        filter: (i) =>
          i.customId === customId && i.user.id === interaction.user.id,
      });

      await this.followUp(interaction);
    } catch (error: any) {
      console.log("There was an error in SetJTC command: ", error);
      await interaction.reply(`There was an error \`${error.message}\``);
      return;
    }
  };

  followUp = async (prevInteraction: ChatInputCommandInteraction) => {
    try {
      const collector = this.collector!;

      collector.on(
        "collect",
        async (interaction: ChannelSelectMenuInteraction) => {
          if (!interaction.channels) return;

          if (interaction.channels.size <= 0) {
            await prevInteraction.editReply({
              content: "Please select a channel",
              components: [],
            });
            return;
          }

          const channel = interaction.channels.first() as VoiceChannel;
          if (channel) {
            await channel.permissionOverwrites.edit(this.bot!, {
              ViewChannel: true,
            });

            const payload = {
              channelId: channel.id,
              enabled: true,
            };
            await JTCService.updateJTC(channel.guildId, payload);

            await prevInteraction.editReply({
              content: `Enabled **Join To Create** module and successfully set \`${channel.name}\` as join to create Channel`,
              components: [],
            });
          }
          return;
        },
      );
    } catch (error: any) {
      console.log("There was an error in SetJTC followUp: ", error);
      await prevInteraction.editReply({
        content: `There was an error \`${error.message}\``,
        components: [],
      });
      return;
    }
  };
}
