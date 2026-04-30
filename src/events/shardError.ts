import { Events } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { reportError } from "@/services/error.reporter";

export default class ShardErrorEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.ShardError);
  }
  async run(error: Error, shardId: number) {
    await reportError({
      source: "discord.shardError",
      error,
      context: { extra: `shard=${shardId}` },
    });
  }
}
