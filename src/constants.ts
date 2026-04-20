import dotenv from "dotenv";

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV;

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const DISCORD_CLIENT_NAME = process.env.DISCORD_CLIENT_NAME;

export const MONGO_URL = process.env.MONGO_URL;

export const REDIS_URL = process.env.REDIS_URL;
export const REDIS_USERNAME = process.env.REDIS_USERNAME;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

export const LAVALINK_HOST = process.env.LAVALINK_HOST;
export const LAVALINK_PORT = process.env.LAVALINK_PORT;
export const LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD;

export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
