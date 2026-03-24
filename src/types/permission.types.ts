import type { GuildBasedChannel, GuildMember, PermissionResolvable } from "discord.js";

export type CheckPermissionsParams = {
  bot: GuildMember;
  member: GuildMember;
  permissions: PermissionResolvable;
  channel?: GuildBasedChannel;
};

export type CheckSinglePermissionsParams = {
  member: GuildMember;
  permissions: PermissionResolvable;
  channel?: GuildBasedChannel;
};

export type FormatMissingPermissionsParams = {
  missing: string[];
  member: GuildMember;
  label?: "bot" | "member";
};

export type PermissionCheckResult = {
  isAllowed: boolean;
  missingPermissions: string[];
};

export type DualPermissionCheckResult = {
  /** True only when both bot and member pass */
  isAllowed: boolean;
  botAllowed: boolean;
  memberAllowed: boolean;
  missingBotPermissions: string[];
  missingMemberPermissions: string[];
};

/** A single permission overwrite entry saved before a lockdown */
export type SavedOverwrite = {
  id: string;
  type: 0 | 1; // 0 = role, 1 = member
  allow: string; // BigInt as string
  deny: string;  // BigInt as string
};

/** All overwrites for one channel, captured before a lockdown */
export type ChannelSnapshot = {
  channelId: string;
  overwrites: SavedOverwrite[];
};
