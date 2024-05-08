import { Node } from 'poru'
import { MainMusicEvent } from '../../Classes'
import Client from '../../Client'

export default class NodeErrorEvent extends MainMusicEvent {
    constructor(client: Client) {
        super(client, 'nodeError')
    }

    async run(node: Node, error: Error) {
        try {
            // console.log(`Manager Error on Node: ${node.options.identifier}`)
            // console.log(error.stack)
        } catch (error) {
            console.log(error)
        }
    }
}
