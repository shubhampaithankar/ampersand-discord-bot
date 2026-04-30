import { Player } from "poru";
import { MainMusicEvent } from "@/classes";
import { upsertPanel } from "@/services/music/now.playing.panel";

export default class TrackStartEvent extends MainMusicEvent {
  async run(player: Player) {
    const timeout = player.get("queueEndTimeout") as NodeJS.Timeout | null;
    if (timeout) {
      clearTimeout(timeout);
      player.set("queueEndTimeout", null);
    }

    await upsertPanel({ client: this.client, player });
  }
}
