import { Node } from 'erela.js'
import { MainMusicEvent } from '../../Classes'
import Client from '../../Client'

export default class NodeConnectEvent extends MainMusicEvent {
    constructor(client: Client) {
        super(client, 'nodeConnect')
    }

    async run(node: Node) {
        try {
            console.log(`Manager connected: ${node.connected}`)
        } catch (error) {
            console.log(error)
        }
    }
}
