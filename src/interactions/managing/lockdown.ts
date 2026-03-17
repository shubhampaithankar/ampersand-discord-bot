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
import { botAuthor, errorEmbed } from "../../services/embed.builder";
import type { ChannelPermissionSet } from "../../types/permission.types";

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
      const originalPermissions = new Map<string, ChannelPermissionSet>();

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
              Connect: (guildLockdown.originalPermissions as any).get(channel.id)
                ?.Connect,
              SendMessages: (guildLockdown.originalPermissions as any).get(channel.id)
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

      const embed = errorEmbed({
        author: botAuthor(this.client),
        title: `Lockdown ${!isEnabled ? "Enabled" : "Disabled"}`,
        description: `Server \`${guild.name}\` is now **${!isEnabled ? "locked down" : "unlocked"}**.${!isEnabled ? "\n\nUse **Remove Lockdown** below or run **/lockdown** again to unlock." : ""}`,
        footer: interaction.member!.user.username,
        timestamp: true,
      });

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
        errorEmbed({
          author: botAuthor(this.client),
          title: "Lockdown Disabled",
          description: `Server \`${guild.name}\` has been unlocked.`,
          footer: interaction.member!.user.username,
          timestamp: true,
        });

      createButtonHandler({
        channel: interaction.channel!,
        handlers: {
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
        filter: (i) =>
          [ids.removeLockdown, ids.removeLockdownAfterSchedule].includes(
            i.customId,
          ) && i.user.id === interaction.user.id,
        time: 1e3 * 60 * 60 * 12, // 12 hours
        onEnd: async () => {
          await interaction.editReply({ embeds: [buildEndEmbed()], components: [] });
        },
      });
    } catch (error: any) {
      console.log("There was an error in Lockdown command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
