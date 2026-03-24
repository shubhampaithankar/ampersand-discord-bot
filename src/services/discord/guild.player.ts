import type { ChatInputCommandInteraction } from "discord.js";
import type BaseClient from "../../client";
import type { GetMusicPlayerParams, MusicContext } from "../../types/guild.player.types";

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

/**
 * Validate the standard preconditions for music commands that require an
 * existing, connected player (skip, stop, loop, shuffle, queue, nowPlaying).
 *
 * Returns the resolved context or null if validation failed (error already sent).
 */
export const validateMusicContext = async (
  client: BaseClient,
  interaction: ChatInputCommandInteraction,
): Promise<MusicContext | null> => {
  const guild = client.guilds.cache.get(interaction.guildId!);
  if (!guild) return null;

  const member = guild.members.cache.get(interaction.member!.user.id);
  if (!member) return null;

  const player = getMusicPlayer({ client, guildId: guild.id });
  if (!player || !player.isConnected) {
    await interaction.editReply("No player found in any voice channels");
    return null;
  }

  const { channel: voiceChannel } = member.voice;
  if (!voiceChannel) {
    await interaction.editReply("You need to join the voice channel");
    return null;
  }

  if (player.voiceChannel !== voiceChannel.id) {
    await interaction.editReply("You're not in the same voice channel");
    return null;
  }

  return { guild, member, player, voiceChannel };
};
