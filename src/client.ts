import { REST } from "@discordjs/rest";
import { Client, Collection, ShardingManager } from "discord.js";
import type Redis from "ioredis";
import mongoose from "mongoose";
import { Poru } from "poru";

import { MainEvent, MainInteraction, MainMusicEvent, MainShardEvent } from "@/classes";
import { DISCORD_TOKEN } from "@/constants";
import Loader from "@/loader";

export default class BaseClient extends Client {
  interactions: Collection<string, MainInteraction>;
  aliases: Collection<string, MainInteraction>;
  events: Collection<string, MainEvent>;
  shardEvents: Collection<string, MainShardEvent>;
  musicEvents: Collection<string, MainMusicEvent>;

  mongo: mongoose.mongo.Db | null = null;
  redis: Redis | null = null;
  poru: Poru | null = null;
  manager: ShardingManager | null = null;

  loader = new Loader(this);

  rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN!);

  startTime: number;

  constructor() {
    super({
      intents: [
        "Guilds",
        "GuildMembers",
        "GuildMessages",
        "GuildMessageReactions",
        "GuildVoiceStates",
        "MessageContent",
        "DirectMessageTyping",
        "DirectMessageReactions",
      ],
      shards: "auto",
    });
    this.interactions = new Collection();
    this.aliases = new Collection();
    this.events = new Collection();
    this.musicEvents = new Collection();
    this.shardEvents = new Collection();
    this.startTime = Date.now();
  }

  async initialize() {
    try {
      await this.loader.init();

      await super.login(DISCORD_TOKEN);
    } catch (error) {
      console.log(error);
    }
  }
}
