import Client from "../../../client";
import { MainInteraction } from "../../../classes";
import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import * as MusicService from "../../../models/music/music.service";
import { getError } from "../../../services/general.utils";

export default class AddMusicChannelInteraction extends MainInteraction {
  guildMusicData: any;
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Modules",
      permissions: ["ManageGuild"],
      data: new SlashCommandBuilder()
        .setName("addmusicchannel")
        .setDescription("adds a text channel to music module"),
    });
    this.guildMusicData = null;
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    try {
      const guildMusicData = await MusicService.getMusic(interaction.guildId!);
      this.guildMusicData = guildMusicData;

      const customId = `${interaction.channelId}_${interaction.id}_addMusicChannel`;

      const channelOptions = new ChannelSelectMenuBuilder()
        .setChannelTypes(ChannelType.GuildText)
        .setCustomId(customId);

      const selectMenu =
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          channelOptions,
        );

      await interaction.reply({
        content: "Please select a channel for the music module",
        components: [selectMenu],
      });

      this.collector = interaction.channel!.createMessageComponentCollector({
        componentType: ComponentType.ChannelSelect,
        max: 1,
        time: 1000 * 60 * 15,
        filter: (i) =>
          i.customId === customId && i.user.id === interaction.user.id,
      });

      await this.followUp(interaction, guildMusicData?.enabled);
    } catch (error: any) {
      console.log("There was an error in AddMusicChannel command: ", error);
      await interaction.reply(`There was an error \`${error.message}\``);
      return;
    }
  };

  followUp = async (
    prevInteraction: ChatInputCommandInteraction,
    value: any,
  ) => {
    try {
      const collector = this.collector!;

      collector.on(
        "collect",
        async (interaction: ChannelSelectMenuInteraction) => {
          if (!interaction.channels) return; // Check for missing channels

          if (interaction.channels.size === 0) {
            await prevInteraction.editReply({
              content: "Please select a channel",
              components: [],
            });
            return;
          }

          const channel = interaction.channels.first() as TextChannel;
          if (channel && interaction.guildId) {
            const updateQuery = {
              $addToSet: { channelIds: channel.id },
            };
            await MusicService.updateMusic(interaction.guildId, updateQuery);
            await prevInteraction.editReply({
              content: `Added \`${channel.name}\` to Music Commands Input Channel`,
              components: [],
            });
            return;
          }
        },
      );
    } catch (error: any) {
      const message = getError(error);
      console.log(
        "There was an error in addMusicChannel followUp command: ",
        error,
      );
      await prevInteraction.editReply({
        content: `There was an error \`${message}\``,
        components: [],
      });
      return;
    }
  };
}
