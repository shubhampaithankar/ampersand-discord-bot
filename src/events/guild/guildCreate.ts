import { Events, Guild } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { GuildService } from "@/models/guild";
import { reportError } from "@/services/error.reporter";
import { addBotGuild, cacheGuildExists } from "@/services/redis/guild.redis";

// Emitted whenever the client joins a guild.
export default class GuildCreateEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.GuildCreate);
  }
  async run(guild: Guild) {
    try {
      await onJoin(guild);
    } catch (error) {
      await reportError({
        source: "event.guildCreate",
        error,
        context: { guildId: guild.id, guildName: guild.name },
      });
    }
  }
}

const onJoin = async (guild: Guild) => {
  const payload = {
    guildId: guild.id,
    name: guild.name,
    ownerId: guild.ownerId,
    joinedAt: [guild.joinedAt],
  };

  await GuildService.createGuild(payload);
  await addBotGuild(guild.id);
  await cacheGuildExists(guild.id, true);
};
