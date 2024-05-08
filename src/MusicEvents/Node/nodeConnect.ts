import { Node } from 'poru'
import { MainMusicEvent } from '../../Classes'
import Client from '../../Client'

export default class NodeConnectEvent extends MainMusicEvent {
    constructor(client: Client) {
        super(client, 'nodeConnect')
    }

    async run(node: Node) {
        try {
            console.log(`Node connected: ${node.options.name}`)
        } catch (error) {
            console.log(error)
        }
    }
}
