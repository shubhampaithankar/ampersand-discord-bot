import { Events } from "discord.js";
import { MainEvent } from "../classes";
import Client from "../client";

export default class RawEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.Raw);
  }

  async run(data: any) {
    if (this.client.poru) {
      switch (data.t) {
        case "VOICE_SERVER_UPDATE":
        case "VOICE_STATE_UPDATE":
          this.client.poru.updateVoiceState(data.d);
          break;
        // Handle other raw events here
      }
    }
  }
}
