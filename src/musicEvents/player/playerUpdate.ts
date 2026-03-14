import { MainMusicEvent } from "../../classes";
import { Player } from "poru";

export default class PlayerUpdateEvent extends MainMusicEvent {
  async run(player: Player) {
    if (!player.isPlaying || !player.currentTrack) return;
    player.set("lastPosition", player.position);
  }
}
