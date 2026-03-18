import type BaseClient from "../client";

export type GetMusicPlayerParams = {
  client: BaseClient;
  guildId: string;
  voiceChannel?: string;
  textChannel?: string;
  create?: boolean;
};
