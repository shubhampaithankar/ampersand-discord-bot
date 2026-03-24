import { getRedis } from "../../libs/redis";

const leaderboardKey = (guildId: string) => `gamble:leaderboard:${guildId}`;

export const incrementGambleScore = async (guildId: string, userId: string) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.zincrby(leaderboardKey(guildId), 1, userId);
};

export const getGambleLeaderboard = async (
  guildId: string,
  limit = 10,
): Promise<{ userId: string; score: number }[]> => {
  const redis = getRedis();
  if (!redis) return [];
  const results = await redis.zrevrange(
    leaderboardKey(guildId),
    0,
    limit - 1,
    "WITHSCORES",
  );
  const entries: { userId: string; score: number }[] = [];
  for (let i = 0; i < results.length; i += 2) {
    entries.push({ userId: results[i], score: parseInt(results[i + 1], 10) });
  }
  return entries;
};
