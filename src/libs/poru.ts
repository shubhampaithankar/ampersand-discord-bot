import { Poru } from "poru";
import type BaseClient from "@/client";
import { DISCORD_CLIENT_NAME, LAVALINK_HOST, LAVALINK_PASSWORD, LAVALINK_PORT } from "@/constants";

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
      // ponytail: SoundCloud is the search source because YouTube playback is dead --
      // InnerTube now returns SABR-only responses (serverAbrStreamingUrl + empty format
      // arrays, verified against ANDROID_VR from the Lavalink host on 2026-09-07) and
      // youtube-source 1.18.x cannot consume SABR. YT *search* still resolves, so falling
      // back to it would queue tracks that silently fail at play time -- worse than no hit.
      // Ceiling: revisit when youtube-source ships SABR support, then flip this back.
      defaultPlatform: "scsearch",
    },
  );
