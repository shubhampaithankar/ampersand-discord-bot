import type { GuildChannel } from "discord.js";
import Client from "../../client";
import * as LockdownService from "./lockdown.service";
import type { ChannelSnapshot } from "../../types/permission.types";

/**
 * Restores all channel permission overwrites from a saved snapshot
 * and marks the lockdown as disabled in the database.
 */
export const restoreGuildLockdown = async ({
  client,
  guildId,
  channels,
}: {
  client: Client;
  guildId: string;
  channels: ChannelSnapshot[];
}) => {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  for (const snapshot of channels) {
    const channel = guild.channels.cache.get(snapshot.channelId) as GuildChannel | undefined;
    if (!channel || !("permissionOverwrites" in channel)) continue;

    await channel.permissionOverwrites
      .set(
        snapshot.overwrites.map((ow) => ({
          id: ow.id,
          type: ow.type,
          allow: BigInt(ow.allow),
          deny: BigInt(ow.deny),
        })),
      )
      .catch(() => {});
  }

  await LockdownService.updateLockdown(guildId, {
    enabled: false,
    channels: [],
    expiresAt: null,
  });
};

/**
 * On bot startup, checks all active lockdowns and:
 * - Restores immediately if expiresAt has already passed
 * - Schedules a restore for the remaining time if expiresAt is in the future
 * - Leaves manual lockdowns (no expiresAt) untouched
 */
export const recoverLockdowns = async (client: Client) => {
  const activeLockdowns = await LockdownService.getAllActiveLockdowns();
  if (!activeLockdowns?.length) return;

  const now = Date.now();

  for (const lockdown of activeLockdowns) {
    if (!lockdown.expiresAt) continue; // manual removal — skip

    const expiresAt = new Date(lockdown.expiresAt).getTime();

    if (expiresAt <= now) {
      console.log(`[Lockdown] Auto-restoring expired lockdown for guild ${lockdown.guildId}`);
      await restoreGuildLockdown({
        client,
        guildId: lockdown.guildId,
        channels: lockdown.channels,
      });
    } else {
      const remaining = expiresAt - now;
      console.log(
        `[Lockdown] Scheduling restore for guild ${lockdown.guildId} in ${Math.round(remaining / 60000)}m`,
      );
      setTimeout(
        () =>
          restoreGuildLockdown({ client, guildId: lockdown.guildId, channels: lockdown.channels }),
        remaining,
      );
    }
  }
};
