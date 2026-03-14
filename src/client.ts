import { Client, Collection, ShardingManager } from "discord.js";
import { REST } from "@discordjs/rest";
import { Poru } from "poru";
import mongoose from "mongoose";
import type Redis from "ioredis";

import {
  MainEvent,
  MainInteraction,
  MainShardEvent,
  MainMusicEvent,
} from "./classes";
import Loader from "./loader";
import Utils from "./utils";

export default class BaseClient extends Client {
  interactions: Collection<string, MainInteraction>;
  aliases: Collection<string, MainInteraction>;
  cooldowns: Collection<string, Map<string, number>>;
  events: Collection<string, MainEvent>;
  shardEvents: Collection<string, MainShardEvent>;
  musicEvents: Collection<string, MainMusicEvent>;

  mongo: mongoose.mongo.Db | null = null;
  redis: Redis | null = null;
  poru: Poru | null = null;
  manager: ShardingManager | null = null;

  loader = new Loader(this);
  utils = new Utils(this);

  rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

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
    this.cooldowns = new Collection();
    this.events = new Collection();
    this.musicEvents = new Collection();
    this.shardEvents = new Collection();
    this.startTime = Date.now();
  }

  async initialize() {
    try {
      await this.loader.init();

      await super.login(process.env.DISCORD_TOKEN);
    } catch (error) {
      console.log(error);
    }
  }
}
