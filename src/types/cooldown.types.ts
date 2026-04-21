import type { GuildMember } from "discord.js";
import type { MainInteraction } from "@/classes";
import type { InteractionType } from "@/types/interaction.types";

export type SetCooldownParams = {
  commandName: string;
  userId: string;
  ttlSeconds: number;
};

export type HandleCooldownParams = {
  member: GuildMember;
  commandName: string;
  command: MainInteraction;
  interaction: InteractionType;
};
