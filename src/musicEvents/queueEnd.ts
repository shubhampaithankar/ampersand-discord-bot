import { TextChannel } from "discord.js";
import { Player, Track } from "poru";
import { MainMusicEvent } from "../classes";
import Client from "../client";
import { getMusicPlayer } from "../services/guild.player";

export default class QueueEndEvent extends MainMusicEvent {
  constructor(client: Client) {
    super(client, "queueEnd");
  }

  async run(player: Player, track: Track) {
    try {
      const existing = player.get("queueEndTimeout") as NodeJS.Timeout | null;
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(async () => {
        try {
          const guildPlayer = getMusicPlayer({ client: this.client, guildId: player.guildId });
          if (!guildPlayer) return;

          if (
            guildPlayer.queue.size === 0 &&
            guildPlayer.loop === "NONE" &&
            !guildPlayer.currentTrack
          ) {
            const channel = this.client.channels.cache.get(
              player.textChannel,
            ) as TextChannel;
            if (channel)
              await channel.send("Queue has ended, disconnecting...");
            guildPlayer.destroy();
          }
        } catch (error) {
          console.log(error);
        }
      }, 1e3 * 180);

      player.set("queueEndTimeout", timeout);
    } catch (error) {
      console.log(error);
    }
  }
}
