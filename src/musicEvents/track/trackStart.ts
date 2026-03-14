import { TextChannel } from "discord.js";
import { MainMusicEvent } from "../../classes";
import { Player, Track } from "poru";

export default class TrackStartEvent extends MainMusicEvent {
  async run(player: Player, track: Track) {
    const timeout = player.get("queueEndTimeout");
    if (timeout) {
      clearTimeout(timeout);
      player.set("queueEndTimeout", null);
    }

    const channel = this.client.channels.cache.get(
      player.textChannel!,
    ) as TextChannel;
    if (channel) {
      channel.send(
        `Now playing: \`${track.info.title}\`, requested by \`${track.info.requester}\`.`,
      );
    }
  }
}
