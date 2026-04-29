import {
  ApplicationCommandDataResolvable,
  CacheType,
  Collection,
  GuildMember,
  Interaction,
  Message,
  PermissionResolvable,
  RepliableInteraction,
  SlashCommandBuilder,
  VoiceChannel,
} from "discord.js";

export type InteractionConfig = {
  type: number;
  category?: string;
  aliases?: string[];
  cooldown?: number;
  permissions?: PermissionResolvable;
  bot?: GuildMember;
  data: ApplicationCommandDataResolvable;
};

export type InteractionType = Interaction<CacheType> & {
  commandName?: string;
  customId?: string;
  message?: Message;
  channels?: Collection<string, VoiceChannel>;
};

export type HelpInteractionType = {
  [category: string]: SlashCommandBuilder[];
};

export type EventConfig = {
  once?: boolean;
};

export type RejectPayload = {
  interaction: RepliableInteraction<CacheType>;
  message: string;
};
