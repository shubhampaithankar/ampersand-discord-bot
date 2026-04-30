import {
  ButtonStyle,
  ChatInputCommandInteraction,
  GuildChannel,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { type ChannelSnapshot, LOCKDOWN_ACTIONS, LockdownService } from "@/models/lockdown";
import { buildButton, buildRow } from "@/services/discord/button.builder";
import { botAuthor, errorEmbed } from "@/services/discord/embed.builder";
import { buildCustomIds, createButtonHandler } from "@/services/discord/interaction.collector";
import { restoreGuildLockdown } from "@/services/discord/lockdown.restore";
import { ctxFromInteraction, reportError } from "@/services/error.reporter";
import { mapInChunks } from "@/services/general.utils";

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
      const { everyone } = guild.roles;

      const guildLockdown = await LockdownService.getLockdown(guild.id);
      const isEnabled = !!guildLockdown?.enabled;

      const buildEmbed = (locked: boolean) =>
        errorEmbed({
          author: botAuthor(this.client),
          title: `Lockdown ${locked ? "Enabled" : "Disabled"}`,
          description: `Server \`${guild.name}\` is now **${locked ? "locked down" : "unlocked"}**.${locked ? "\n\nUse **Remove Lockdown** below or run **/lockdown** again to unlock." : ""}`,
          footer: interaction.member!.user.username,
          timestamp: true,
        });

      // ── Disable path ────────────────────────────────────────────────────────
      if (isEnabled) {
        await restoreGuildLockdown({
          client: this.client,
          guildId: guild.id,
          channels: (guildLockdown as any).channels ?? [],
        });
        await interaction.editReply({
          embeds: [buildEmbed(false)],
          components: [],
        });
        return;
      }

      // ── Enable path ─────────────────────────────────────────────────────────
      // Capture every role/user overwrite on every channel, then replace with
      // a single @everyone deny overwrite to lock the channel.
      const lockableChannels = [...guild.channels.cache.values()].filter(
        (c) => !c.isThread() && "permissionOverwrites" in c,
      ) as GuildChannel[];

      const channelSnapshots: ChannelSnapshot[] = await mapInChunks(
        lockableChannels,
        5,
        async (ch) => {
          const overwrites = ch.permissionOverwrites.cache.map((ow) => ({
            id: ow.id,
            type: ow.type as 0 | 1,
            allow: ow.allow.bitfield.toString(),
            deny: ow.deny.bitfield.toString(),
          }));

          await ch.permissionOverwrites
            .set([{ id: everyone.id, type: 0, deny: ["Connect", "SendMessages"] }])
            .catch(() => {});

          return { channelId: ch.id, overwrites };
        },
      );

      await LockdownService.updateLockdown(guild.id, {
        enabled: true,
        lockedAt: new Date(),
        expiresAt: null,
        channels: channelSnapshots,
      });

      const ids = buildCustomIds({ interaction, actions: LOCKDOWN_ACTIONS });

      const row = buildRow(
        buildButton({
          label: "Remove Lockdown",
          style: ButtonStyle.Danger,
          customId: ids[LOCKDOWN_ACTIONS.REMOVE],
        }),
        buildButton({
          label: "Schedule Remove (6h)",
          style: ButtonStyle.Secondary,
          customId: ids[LOCKDOWN_ACTIONS.REMOVE_AFTER_SCHEDULE],
        }),
      );

      await interaction.editReply({ embeds: [buildEmbed(true)], components: [row] });

      createButtonHandler({
        channel: interaction.channel!,
        handlers: {
          [ids[LOCKDOWN_ACTIONS.REMOVE]]: async (i) => {
            await i.deferUpdate();
            await restoreGuildLockdown({
              client: this.client,
              guildId: guild.id,
              channels: channelSnapshots,
            });
            await interaction.editReply({
              embeds: [buildEmbed(false)],
              components: [],
            });
          },
          [ids[LOCKDOWN_ACTIONS.REMOVE_AFTER_SCHEDULE]]: async (i) => {
            const expiresAt = new Date(Date.now() + 1e3 * 60 * 60 * 6);
            await LockdownService.updateLockdown(guild.id, { expiresAt });
            setTimeout(
              () =>
                restoreGuildLockdown({
                  client: this.client,
                  guildId: guild.id,
                  channels: channelSnapshots,
                }),
              1e3 * 60 * 60 * 6,
            );
            await i.reply({
              content: "Lockdown will be removed in 6 hours.",
              flags: MessageFlags.Ephemeral,
            });
          },
        },
        filter: (i) =>
          [ids[LOCKDOWN_ACTIONS.REMOVE], ids[LOCKDOWN_ACTIONS.REMOVE_AFTER_SCHEDULE]].includes(
            i.customId,
          ) && i.user.id === interaction.user.id,
        max: 1,
        time: 1e3 * 60 * 60 * 12, // 12 hours
        onEnd: async () => {
          // Remove buttons when the collector expires (either button was clicked
          // or 12h passed with no interaction). The embed content is already
          // updated by the handler if removeLockdown was used.
          await interaction.editReply({ components: [] }).catch(() => {});
        },
      });
    } catch (error: any) {
      await reportError({
        source: "interaction.lockdown",
        error,
        context: ctxFromInteraction(interaction),
      });
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
