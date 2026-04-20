/** A single permission overwrite entry saved before a lockdown */
export type SavedOverwrite = {
  id: string;
  type: 0 | 1; // 0 = role, 1 = member
  allow: string; // BigInt as string
  deny: string; // BigInt as string
};

/** All overwrites for one channel, captured before a lockdown */
export type ChannelSnapshot = {
  channelId: string;
  overwrites: SavedOverwrite[];
};

export type LockdownData = {
  guildId: string;
  enabled: boolean;
  lockedAt: Date | null;
  expiresAt: Date | null;
  channels: ChannelSnapshot[];
};
