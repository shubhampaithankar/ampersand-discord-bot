import { Poru } from "poru";
import { Spotify } from "poru-spotify";
import type BaseClient from "../client";

export const createPoru = (client: BaseClient) =>
  new Poru(
    client,
    [
      {
        host: `${process.env.LAVALINK_HOST!}`,
        port: Number(process.env.LAVALINK_PORT),
        password: `${process.env.LAVALINK_PASSWORD}`,
        secure: false,
        name: `${process.env.DISCORD_CLIENT_NAME}-discord-client`,
      },
    ],
    {
      library: "discord.js",
      defaultPlatform: "ytsearch",
      plugins: [
        new Spotify({
          clientID: `${process.env.SPOTIFY_CLIENT_ID}`,
          clientSecret: `${process.env.SPOTIFY_CLIENT_SECRET}`,
        }),
      ],
    },
  );
