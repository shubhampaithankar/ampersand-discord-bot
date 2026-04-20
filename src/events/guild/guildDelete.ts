import { Events, Guild } from "discord.js";
import { MainEvent } from "../../classes";
import Client from "../../client";
import { GuildService } from "../../models/guild";
import { removeBotGuild, evictGuildCache } from "../../services/redis/guild.redis";

// Emitted whenever a guild kicks the client or the guild is deleted/left.
export default class GuildDeleteEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.GuildDelete);
  }
  async run(guild: Guild) {
    await onLeave(guild);
  }
}

export const onLeave = async (guild: Guild) => {
  const guildData = await GuildService.getGuild(guild.id);
  await removeBotGuild(guild.id);
  await evictGuildCache(guild.id);
  if (!guildData) return;
  await GuildService.deleteGuild(guild.id);
};
