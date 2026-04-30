import { ActivityType, PresenceData } from "discord.js";
import type BaseClient from "@/client";

const ROTATION_INTERVAL_MS = 60_000;

const buildPresences = (client: BaseClient): PresenceData[] => [
  {
    status: "dnd",
    activities: [{ name: `${client.guilds.cache.size} Guilds`, type: ActivityType.Competing }],
  },
  {
    status: "dnd",
    activities: [{ name: "/play to start", type: ActivityType.Listening }],
  },
  {
    status: "dnd",
    activities: [{ name: "/invite", type: ActivityType.Watching }],
  },
];

let index = 0;

const apply = (client: BaseClient) => {
  if (!client.user) return;
  const list = buildPresences(client);
  client.user.setPresence(list[index % list.length]!);
  index++;
};

export const startPresenceRotation = (client: BaseClient) => {
  apply(client);
  setInterval(() => apply(client), ROTATION_INTERVAL_MS);
  client.on("shardResume", () => apply(client));
};
