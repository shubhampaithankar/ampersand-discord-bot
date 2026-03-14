import { Node } from "poru";
import { MainMusicEvent } from "../../classes";
import Client from "../../client";

export default class NodeErrorEvent extends MainMusicEvent {
  constructor(client: Client) {
    super(client, "nodeError");
  }

  async run(node: Node, error: any) {
    try {
      console.log(`Poru Error on Node: ${node.poru.userId}`);
      console.log(error);
    } catch (error) {
      console.log(error);
    }
  }
}
