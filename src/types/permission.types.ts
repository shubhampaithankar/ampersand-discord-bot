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
