import { Shard } from "discord.js";
import { MainShardEvent } from "@/classes";
import Client from "@/client";

export default class ShardCreateEvent extends MainShardEvent {
  constructor(client: Client) {
    super(client, "shardCreate");
  }
  async run(shard: Shard) {
    // console.log(message.content)
  }
}
