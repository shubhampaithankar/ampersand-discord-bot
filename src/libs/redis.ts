import Redis from "ioredis";

import { REDIS_PASSWORD, REDIS_URL, REDIS_USERNAME } from "@/constants";

let redis: Redis | null = null;

export const getRedis = () => redis;

export const connectToRedis = async () => {
  redis = new Redis(REDIS_URL!, {
    lazyConnect: true,
    port: 7700,
    retryStrategy: (times) => Math.min(times * 500, 5000),
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
  });
  await redis.connect();
  console.log("Connected to Redis");
  return redis;
};
