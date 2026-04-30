import { ActivityType, Events } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { recoverLockdowns } from "@/services/discord/lockdown.restore";
import { reportError } from "@/services/error.reporter";
import { seedBotGuilds } from "@/services/redis/guild.redis";
import { cleanupJTCChannels } from "@/services/redis/jtc.redis";

export default class ReadyEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.ClientReady, {
      once: true,
    });
  }
  run = async () => {
    try {
      console.log(`Bot Online: ${this.client.user?.tag}`);

      console.log(
        `Up Since: ${new Date(this.client.startTime).toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        })}`,
      );

      await seedBotGuilds([...this.client.guilds.cache.keys()]);
      await cleanupJTCChannels(this.client);
      await recoverLockdowns(this.client);

      if (this.client.manager)
        await this.client.manager.spawn({
          amount: "auto",
        });

      if (this.client.poru) await this.client.poru.init();

      this.client.user!.setPresence({
        status: "dnd",
        activities: [
          {
            name: `${this.client.guilds.cache.size} Guilds`,
            type: ActivityType.Competing,
          },
          {
            name: "/invite",
            type: ActivityType.Listening,
          },
        ],
      });
    } catch (error) {
      await reportError({ source: "event.clientReady", error });
    }
  };
}
