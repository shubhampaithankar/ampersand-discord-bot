import { Events, Guild } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { GuildService } from "@/models/guild";
import { reportError } from "@/services/error.reporter";
import { evictGuildCache, removeBotGuild } from "@/services/redis/guild.redis";

// Emitted whenever a guild kicks the client or the guild is deleted/left.
export default class GuildDeleteEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.GuildDelete);
  }
  async run(guild: Guild) {
    try {
      await onLeave(guild);
    } catch (error) {
      await reportError({
        source: "event.guildDelete",
        error,
        context: { guildId: guild.id, guildName: guild.name },
      });
    }
  }
}

export const onLeave = async (guild: Guild) => {
  const guildData = await GuildService.getGuild(guild.id);
  await removeBotGuild(guild.id);
  await evictGuildCache(guild.id);
  if (!guildData) return;
  await GuildService.deleteGuild(guild.id);
};
