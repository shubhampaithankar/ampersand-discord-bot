import { Node } from 'poru'
import { MainMusicEvent } from '../../Classes'
import Client from '../../Client'

export default class NodeErrorEvent extends MainMusicEvent {
    constructor(client: Client) {
        super(client, 'nodeError')
    }

    async run(node: Node, error: any) {
        try {
            console.log(`Manager Error on Node: ${node.poru.userId}`)
            console.log(error)
        } catch (error) {
            console.log(error)
        }
    }
}
