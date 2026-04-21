import { getRedis } from "@/libs/redis";

const BOT_GUILDS_KEY = "bot:guilds";
const guildDbKey = (guildId: string) => `guild:db:${guildId}`;

// ── Bot guild membership ─────────────────────────────────────────────────────

/** Replaces the full guild set on boot. No-op if list is empty. */
export const seedBotGuilds = async (guildIds: string[]) => {
  const redis = getRedis();
  if (!redis || guildIds.length === 0) return;
  const pipeline = redis.pipeline();
  pipeline.del(BOT_GUILDS_KEY);
  pipeline.sadd(BOT_GUILDS_KEY, ...guildIds);
  await pipeline.exec();
};

export const addBotGuild = async (guildId: string) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.sadd(BOT_GUILDS_KEY, guildId);
};

export const removeBotGuild = async (guildId: string) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.srem(BOT_GUILDS_KEY, guildId);
};

/**
 * Returns false only when Redis confirms the guild is not in the set.
 * Falls back to true if Redis is unavailable so interactions still run.
 */
export const isBotInGuild = async (guildId: string): Promise<boolean> => {
  const redis = getRedis();
  if (!redis) return true;
  return (await redis.sismember(BOT_GUILDS_KEY, guildId)) === 1;
};

// ── Guild DB existence cache ─────────────────────────────────────────────────

/**
 * Cache whether a guild document exists in MongoDB.
 * Existing guilds: 1-hour TTL. Missing guilds: 5-minute TTL.
 */
export const cacheGuildExists = async (guildId: string, exists: boolean) => {
  const redis = getRedis();
  if (!redis) return;
  const ttl = exists ? 60 * 60 : 60 * 5;
  await redis.set(guildDbKey(guildId), exists ? "1" : "0", "EX", ttl);
};

/**
 * Returns true/false if cached, null on cache miss (DB check required).
 */
export const getCachedGuildExists = async (guildId: string): Promise<boolean | null> => {
  const redis = getRedis();
  if (!redis) return null;
  const val = await redis.get(guildDbKey(guildId));
  if (val === null) return null;
  return val === "1";
};

export const evictGuildCache = async (guildId: string) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(guildDbKey(guildId));
};
