import { Events } from "discord.js";
import { MainEvent } from "../classes";
import Client from "../client";

export default class RawEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.Raw);
  }

  async run(data: any) {
    handlePoruWebsocket(data, this.client);
  }
}

const handlePoruWebsocket = (data: any, client: Client) => {
  try {
    if (!client.poru) return;

    switch (data.t) {
      case "VOICE_SERVER_UPDATE":
      case "VOICE_STATE_UPDATE":
        client.poru.packetUpdate(data);
        break;
      // Handle other raw events here
    }
  } catch (error) {
    console.error(error);
  }
};
