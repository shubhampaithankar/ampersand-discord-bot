import { Node } from "poru";
import { MainMusicEvent } from "@/classes";
import Client from "@/client";
import { reportError } from "@/services/error.reporter";

export default class NodeConnectEvent extends MainMusicEvent {
  constructor(client: Client) {
    super(client, "nodeConnect");
  }

  async run(node: Node) {
    try {
      console.log(`Node connected: ${node.options.name}`);
    } catch (error) {
      await reportError({ source: "musicEvent.nodeConnect", error });
    }
  }
}
