import type { GuildChannel } from "discord.js";
import Client from "@/client";
import { type ChannelSnapshot, LockdownService } from "@/models/lockdown";

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

export const recoverLockdowns = async (client: Client) => {
  const activeLockdowns = await LockdownService.getAllActiveLockdowns();
  if (!activeLockdowns?.length) return;

  const now = Date.now();

  for (const lockdown of activeLockdowns) {
    if (!lockdown.expiresAt) continue;

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
