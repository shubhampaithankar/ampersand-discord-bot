import { Poru } from "poru";
import type BaseClient from "@/client";
import {
  DISCORD_CLIENT_NAME,
  LAVALINK_HOST,
  LAVALINK_PASSWORD,
  LAVALINK_PORT,
} from "@/constants";

export const createPoru = (client: BaseClient) =>
  new Poru(
    client,
    [
      {
        host: `${LAVALINK_HOST!}`,
        port: Number(LAVALINK_PORT),
        password: `${LAVALINK_PASSWORD}`,
        secure: false,
        name: `${DISCORD_CLIENT_NAME}-poru-client`,
      },
    ],
    {
      library: "discord.js",
      defaultPlatform: "ytmsearch",
    },
  );
