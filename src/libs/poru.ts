import { Poru } from "poru";
import type { Plugin } from "poru";
import { Spotify } from "poru-spotify";
import type BaseClient from "../client";
import {
  DISCORD_CLIENT_NAME,
  LAVALINK_HOST,
  LAVALINK_PASSWORD,
  LAVALINK_PORT,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
} from "../constants";

export const createPoru = (client: BaseClient) =>
  new Poru(
    client,
    [
      {
        host: `${LAVALINK_HOST!}`,
        port: Number(LAVALINK_PORT),
        password: `${LAVALINK_PASSWORD}`,
        secure: false,
        name: `${DISCORD_CLIENT_NAME}-discord-client`,
      },
    ],
    {
      library: "discord.js",
      defaultPlatform: "ytmsearch",
      plugins: [
        new Spotify({
          clientID: `${SPOTIFY_CLIENT_ID}`,
          clientSecret: `${SPOTIFY_CLIENT_SECRET}`,
        }) as unknown as Plugin,
      ],
    },
  );
