import { getRedis } from "../../libs/redis";
import type BaseClient from "../../client";

const jtcKey = (guildId: string) => `jtc:${guildId}`;

export const addToSet = async (guildId: string, channelId: string) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.sadd(jtcKey(guildId), channelId);
};

export const removeFromSet = async (guildId: string, channelId: string) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.srem(jtcKey(guildId), channelId);
};

export const isPresent = async (guildId: string, channelId: string) => {
  const redis = getRedis();
  if (!redis) return false;
  return (await redis.sismember(jtcKey(guildId), channelId)) === 1;
};

export const cleanupJTCChannels = async (client: BaseClient) => {
  const redis = getRedis();
  if (!redis) return;
  const keys = await redis.keys("jtc:*");
  let removed = 0;

  for (const key of keys) {
    const channelIds = await redis.smembers(key);
    const stale = channelIds.filter((id) => !client.channels.cache.has(id));

    if (stale.length > 0) {
      await redis.srem(key, ...stale);
      removed += stale.length;
    }
  }

  if (removed > 0)
    console.log(`Cleaned up ${removed} stale JTC channel(s) from Redis`);
};
