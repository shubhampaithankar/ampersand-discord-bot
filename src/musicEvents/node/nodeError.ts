import { Node } from "poru";
import { MainMusicEvent } from "@/classes";
import Client from "@/client";
import { reportError } from "@/services/error.reporter";

export default class NodeErrorEvent extends MainMusicEvent {
  constructor(client: Client) {
    super(client, "nodeError");
  }

  async run(node: Node, error: any) {
    try {
      console.log(`Poru Error on Node: ${node.poru.userId}`);
      await reportError({ source: "musicEvent.nodeError", error });
    } catch (error) {
      await reportError({ source: "musicEvent.nodeError", error });
    }
  }
}
