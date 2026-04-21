import type {
  CheckPermissionsParams,
  CheckSinglePermissionsParams,
  DualPermissionCheckResult,
  FormatMissingPermissionsParams,
  PermissionCheckResult,
} from "@/types/permission.types";

export const checkPermissions = ({
  bot,
  member,
  permissions,
  channel,
}: CheckPermissionsParams): DualPermissionCheckResult => {
  const botPerms = channel ? channel.permissionsFor(bot) : bot.permissions;
  const memberPerms = channel ? channel.permissionsFor(member) : member.permissions;

  const botAllowed = botPerms?.has(permissions, true) ?? false;
  const memberAllowed = memberPerms?.has(permissions, true) ?? false;

  return {
    isAllowed: botAllowed && memberAllowed,
    botAllowed,
    memberAllowed,
    missingBotPermissions: botPerms?.missing(permissions) ?? [],
    missingMemberPermissions: memberPerms?.missing(permissions) ?? [],
  };
};

export const checkSinglePermissions = ({
  member,
  permissions,
  channel,
}: CheckSinglePermissionsParams): PermissionCheckResult => {
  const perms = channel ? channel.permissionsFor(member) : member.permissions;

  return {
    isAllowed: perms?.has(permissions, true) ?? false,
    missingPermissions: perms?.missing(permissions) ?? [],
  };
};

export const formatMissingPermissions = ({
  missing,
  member,
  label = "member",
}: FormatMissingPermissionsParams): string => {
  const formatted = missing.map((p) => `\`${p}\``).join(", ");
  const who = label === "bot" ? "Bot" : `<@${member.user.id}>`;
  return `**Not enough permissions for ${who}. Missing:** ${formatted}`;
};
