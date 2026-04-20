import { TextChannel } from "discord.js";
import { Player, Track } from "poru";
import { MainMusicEvent } from "../../classes";

export default class TrackStartEvent extends MainMusicEvent {
  async run(player: Player, track: Track) {
    const timeout = player.get("queueEndTimeout") as NodeJS.Timeout | null;
    if (timeout) {
      clearTimeout(timeout);
      player.set("queueEndTimeout", null);
    }

    const channel = this.client.channels.cache.get(player.textChannel!) as TextChannel;

    if (!channel) return;

    channel.send(`Now playing: \`${track.info.title}\`, requested by \`${track.info.requester}\`.`);
  }
}
