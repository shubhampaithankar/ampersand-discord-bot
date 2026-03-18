import type { Guild, GuildMember, VoiceState } from "discord.js";
import type BaseClient from "../client";

export type JtcData = {
  guildId: string;
  channelId: string;
  enabled: boolean;
};

export type HandleJTCParams = {
  client: BaseClient;
  guild: Guild;
  oldState: VoiceState;
  newState: VoiceState;
};

export type CreateJTCChannelParams = {
  guild: Guild;
  newState: VoiceState;
  jtcData: JtcData;
  bot: GuildMember;
  client: BaseClient;
};

export type DisconnectPlayerParams = {
  client: BaseClient;
  guild: Guild;
  oldState: VoiceState;
};
