import type BaseClient from "../client";

export const getMusicPlayer = ({
  client,
  guildId,
  voiceChannel,
  textChannel,
  create,
}: {
  client: BaseClient;
  guildId: string;
  voiceChannel?: string;
  textChannel?: string;
  create?: boolean;
}) => {
  if (!guildId || !client.poru) return null;

  let player = client.poru.get(guildId);

  if (!player && voiceChannel && textChannel && create) {
    player = client.poru.createConnection({
      guildId,
      voiceChannel,
      textChannel,
      deaf: true,
    });
  }

  return player ?? null;
};
