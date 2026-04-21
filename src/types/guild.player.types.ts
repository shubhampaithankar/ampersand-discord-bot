import type {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  VoiceBasedChannel,
} from "discord.js";
import type { Player } from "poru";
import type BaseClient from "@/client";

export type GetMusicPlayerParams = {
  client: BaseClient;
  guildId: string;
  voiceChannel?: string;
  textChannel?: string;
  create?: boolean;
};

export type MusicContext = {
  guild: Guild;
  member: GuildMember;
  player: Player;
  voiceChannel: VoiceBasedChannel;
};
