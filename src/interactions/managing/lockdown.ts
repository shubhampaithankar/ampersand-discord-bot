import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Collection,
  GuildChannel,
  SlashCommandBuilder,
} from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import * as LockdownService from "../../models/lockdown/lockdown.service";
import {
  buildCustomIds,
  createButtonHandler,
} from "../../services/interaction.collector";

export default class LockdownInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      permissions: ["Administrator"],
      data: new SlashCommandBuilder()
        .setName("lockdown")
        .setDescription("locks all the channels from being used"),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply().catch((err) => console.log(err.message));
    try {
      const guild = interaction.guild!;
      const channels = guild.channels.cache as Collection<string, GuildChannel>;
      const { everyone } = guild.roles;

      const guildLockdown = await LockdownService.getLockdown(guild.id);
      const isEnabled = !!guildLockdown && guildLockdown.enabled;

      // Capture original permissions before locking (used by restore handlers below)
      const originalPermissions = new Map<
        string,
        { Connect: boolean; SendMessages: boolean }
      >();

      try {
        for (const channel of channels.values()) {
          if (!isEnabled) {
            const perms = channel.permissionsFor(everyone).serialize();
            originalPermissions.set(channel.id, {
              Connect: perms.Connect,
              SendMessages: perms.SendMessages,
            });
            await channel.permissionOverwrites.edit(everyone, {
              Connect: false,
              SendMessages: false,
            });
          } else {
            await channel.permissionOverwrites.edit(everyone, {
              Connect: guildLockdown.originalPermissions.get(channel.id)
                ?.Connect,
              SendMessages: guildLockdown.originalPermissions.get(channel.id)
                ?.SendMessages,
            });
          }
        }

        await LockdownService.updateLockdown(
          guild.id,
          !isEnabled
            ? { enabled: true, originalPermissions }
            : { enabled: false, originalPermissions: null },
        );
      } catch (error) {
        throw error;
      }

      const embed = await this.client.utils.createMessageEmbed({
        author: {
          name: this.client.user!.displayName,
          iconURL: this.client.user?.avatarURL() || undefined,
        },
        color: "Red",
        title: "Lockdown Command",
        description: `**Lockdown ${!isEnabled ? "Enabled" : "Disabled"}** for server: \`${guild.name}\`\n${!isEnabled ? "\nClick on **Remove Lockdown** button to remove it\n**OR**\nUse command **/lockdown** again" : ""}`,
        timestamp: Date.now(),
        footer: { text: interaction.member!.user.username },
      });

      if (!embed) throw new Error("Unable to create embed");

      const ids = buildCustomIds(
        interaction,
        "removeLockdown",
        "removeLockdownAfterSchedule",
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Remove Lockdown")
          .setStyle(ButtonStyle.Danger)
          .setCustomId(ids.removeLockdown),
        new ButtonBuilder()
          .setLabel("Schedule Remove (6h)")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(ids.removeLockdownAfterSchedule),
      );

      await interaction.editReply({
        embeds: [embed],
        components: !isEnabled ? [row] : [],
      });

      // If lockdown was already active and we just disabled it, we're done
      if (isEnabled) return;

      // Restore channel permissions and update the database
      const restoreLockdown = async () => {
        for (const channel of channels.values()) {
          const saved = originalPermissions.get(channel.id);
          await channel.permissionOverwrites.edit(everyone, {
            Connect: saved?.Connect,
            SendMessages: saved?.SendMessages,
          });
        }
        await LockdownService.updateLockdown(guild.id, {
          enabled: false,
          originalPermissions: null,
        });
      };

      const buildEndEmbed = () =>
        this.client.utils.createMessageEmbed({
          author: {
            name: this.client.user!.displayName,
            iconURL: this.client.user?.avatarURL() || undefined,
          },
          color: "Red",
          title: "Lockdown Command",
          description: `**Lockdown Disabled** for server: \`${guild.name}\``,
          timestamp: Date.now(),
          footer: { text: interaction.member!.user.username },
        });

      createButtonHandler(
        interaction.channel!,
        {
          [ids.removeLockdown]: async (i) => {
            await i.deferUpdate();
            await restoreLockdown();
          },
          [ids.removeLockdownAfterSchedule]: async (i) => {
            setTimeout(restoreLockdown, 1e3 * 60 * 60 * 6); // 6 hours
            await i.reply({
              content: "Lockdown will be removed in 6 hours.",
              ephemeral: true,
            });
          },
        },
        (i) =>
          [ids.removeLockdown, ids.removeLockdownAfterSchedule].includes(
            i.customId,
          ) && i.user.id === interaction.user.id,
        1e3 * 60 * 60 * 12, // 12 hours
        async () => {
          const endEmbed = await buildEndEmbed();
          if (!endEmbed) return;
          await interaction.editReply({ embeds: [endEmbed], components: [] });
        },
      );
    } catch (error: any) {
      console.log("There was an error in Lockdown command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
