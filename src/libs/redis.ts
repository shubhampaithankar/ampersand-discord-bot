import Redis from "ioredis";

let redis: Redis | null = null;

export const getRedis = () => redis;

export const connectToRedis = async () => {
  redis = new Redis(process.env.REDIS_URL!, {
    lazyConnect: true,
    port: 7700,
    retryStrategy: (times) => Math.min(times * 500, 5000),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  });
  await redis.connect();
  console.log("Connected to Redis");
  return redis;
};
