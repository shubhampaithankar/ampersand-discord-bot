import { getRedis } from "@/libs/redis";
import type { SetCooldownParams } from "@/types/cooldown.types";

const cooldownKey = (commandName: string, userId: string) => `cooldown:${commandName}:${userId}`;

export const setCooldown = async ({ commandName, userId, ttlSeconds }: SetCooldownParams) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(cooldownKey(commandName, userId), "1", "EX", ttlSeconds);
};

/** Returns remaining cooldown in milliseconds, or 0 if not on cooldown. */
export const getRemainingCooldown = async (
  commandName: string,
  userId: string,
): Promise<number> => {
  const redis = getRedis();
  if (!redis) return 0;
  const ttl = await redis.pttl(cooldownKey(commandName, userId));
  return ttl > 0 ? ttl : 0;
};
