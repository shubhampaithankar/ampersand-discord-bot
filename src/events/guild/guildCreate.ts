import { Events, Guild } from "discord.js";
import { MainEvent } from "../../classes";
import Client from "../../client";
import * as GuildService from "../../models/guild/guild.service";

// Emitted whenever the client joins a guild.
export default class GuildCreateEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.GuildCreate);
  }
  async run(guild: Guild) {
    await onJoin(guild);
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
};
