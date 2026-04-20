import { type GuildMember, PermissionFlagsBits } from "discord.js";
import type { CounterActor } from "../../models/counter";

export const canActOnCounter = ({
  member,
  actor,
}: {
  member: GuildMember;
  actor: CounterActor;
}): boolean => {
  switch (actor.type) {
    case "everyone":
      return true;
    case "admin":
      return member.permissions.has(PermissionFlagsBits.ManageGuild);
    case "role":
      return !!actor.targetId && member.roles.cache.has(actor.targetId);
    case "user":
      return !!actor.targetId && member.id === actor.targetId;
    default:
      return false;
  }
};

export const describeActor = (actor: CounterActor): string => {
  switch (actor.type) {
    case "everyone":
      return "Everyone";
    case "admin":
      return "Server admins (ManageGuild)";
    case "role":
      return actor.targetId ? `<@&${actor.targetId}>` : "role (missing)";
    case "user":
      return actor.targetId ? `<@${actor.targetId}>` : "user (missing)";
    default:
      return "unknown";
  }
};
