import type { GetMusicPlayerParams } from "../types/guild.player.types";

export const getMusicPlayer = ({
  client,
  guildId,
  voiceChannel,
  textChannel,
  create,
}: GetMusicPlayerParams) => {
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
