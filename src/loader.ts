import path from "path";
import Client from "./client";

import { Routes, ShardingManager } from "discord.js";
import { readdirSync, lstatSync } from "fs";

import {
  MainEvent,
  MainInteraction,
  MainShardEvent,
  MainMusicEvent,
} from "./classes";
import { connectToMongo } from "./libs/mongo";
import { connectToRedis } from "./libs/redis";
import { createPoru } from "./libs/poru";

export default class Loader {
  client: Client;
  fileExtention: string;

  constructor(client: Client) {
    this.client = client;
    this.fileExtention = ".ts";
  }

  init = async () => {
    try {
      this.client.mongo = await connectToMongo();
      this.client.redis = await connectToRedis();

      await this.loadEventHandler("./events");
      console.log(`Loaded ${this.client.events.size} Event(s)`);

      this.client.poru = createPoru(this.client);
      if (this.client.poru) await this.loadMusicEventHandler("./musicEvents");
      console.log(`Loaded ${this.client.musicEvents.size} Music Event(s)`);

      // this.loadShardManager()
      // if (this.client.manager) await this.loadShardEventHandler('./shardEvents')
      // console.log(`Loaded ${this.client.musicEvents.size} Sharding Event(s)`)

      await this.loadInteractionHandler("./interactions");
      const interactions = await this.client.interactions.map(
        (interaction) => interaction.data,
      );
      await this.client.rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
        {
          body: interactions,
        },
      );
      console.log(`Loaded ${this.client.interactions.size} Interaction(s)`);
    } catch (error) {
      console.log("Loader Error:\n", error);
    }
  };

  loadShardManager = async () => {
    try {
      this.client.manager = new ShardingManager("./client.ts", {
        token: process.env.DISCORD_TOKEN!,
        respawn: true,
        totalShards: "auto",
      });
    } catch (error) {
      console.log("There was en error loading sahrding manager:\n", error);
    }
  };

  loadInteractionHandler = async (dir: string) => {
    try {
      const filePath = path.join(__dirname, dir);
      const files = await readdirSync(filePath);
      for (const intFile of files) {
        const stat = await lstatSync(path.join(filePath, intFile));
        if (stat.isDirectory())
          await this.loadInteractionHandler(path.join(dir, intFile)); // Await recursive call
        if (intFile.endsWith(this.fileExtention)) {
          const name = path.parse(intFile).name.toLowerCase();
          const Interaction = await import(path.join(filePath, intFile));
          if (Interaction.default?.prototype instanceof MainInteraction) {
            const interaction = new Interaction.default(
              this.client,
              name,
            ) as MainInteraction;
            this.client.interactions.set(name, interaction);
            interaction.aliases?.forEach((entry) =>
              this.client.aliases.set(entry, interaction),
            );
          }
        }
      }
    } catch (error) {
      console.log("There was an error loading interactions:\n", error);
    }
  };

  loadEventHandler = async (dir: string) => {
    try {
      const filePath = path.join(__dirname, dir);
      const files = await readdirSync(filePath);
      for (const eventFile of files) {
        const stat = await lstatSync(path.join(filePath, eventFile));
        if (stat.isDirectory())
          await this.loadEventHandler(path.join(dir, eventFile));
        if (eventFile.endsWith(this.fileExtention)) {
          const { name } = path.parse(eventFile);
          const Event = await import(path.join(filePath, eventFile));
          if (Event.default?.prototype instanceof MainEvent) {
            const event = new Event.default(this.client, name);
            event.emitter[event.type](name, (...args: any[]) =>
              event.run(...args),
            );
            this.client.events.set(name, event);
          }
        }
      }
    } catch (error) {
      console.log("There was en error loading events:\n", error);
    }
  };

  loadMusicEventHandler = async (dir: string) => {
    try {
      const filePath = path.join(__dirname, dir);
      const files = await readdirSync(filePath);
      for (const eventFile of files) {
        const stat = await lstatSync(path.join(filePath, eventFile));
        if (stat.isDirectory())
          await this.loadMusicEventHandler(path.join(dir, eventFile));
        if (eventFile.endsWith(this.fileExtention)) {
          const { name } = path.parse(eventFile);
          const Event = await import(path.join(filePath, eventFile));
          if (Event.default?.prototype instanceof MainMusicEvent) {
            const event = new Event.default(this.client, name);
            event.emitter[event.type](name, (...args: any[]) =>
              event.run(...args),
            );
            this.client.musicEvents.set(name, event);
          }
        }
      }
    } catch (error) {
      console.log("There was en error loading music events:\n", error);
    }
  };

  loadShardEventHandler = async (dir: string) => {
    try {
      const filePath = path.join(__dirname, dir);
      const files = await readdirSync(filePath);
      for (const eventFile of files) {
        const stat = await lstatSync(path.join(filePath, eventFile));
        if (stat.isDirectory())
          await this.loadShardEventHandler(path.join(dir, eventFile));
        if (eventFile.endsWith(this.fileExtention)) {
          const { name } = path.parse(eventFile);
          const Event = await import(path.join(filePath, eventFile));
          if (Event.default?.prototype instanceof MainShardEvent) {
            const event = new Event.default(this.client, name);
            event.emitter[event.type](name, (...args: any[]) =>
              event.run(...args),
            );
            this.client.shardEvents.set(name, event);
          }
        }
      }
    } catch (error) {
      console.log("There was en error loading events:\n", error);
    }
  };
}
