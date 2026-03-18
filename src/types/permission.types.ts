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

/** Original channel permission state captured before a lockdown */
export type ChannelPermissionSet = {
  Connect: boolean;
  SendMessages: boolean;
};
