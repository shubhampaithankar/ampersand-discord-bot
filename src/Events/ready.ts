import { BaseEvent } from '../Classes'
import Client from '../Client'

export default class ReadyEvent extends BaseEvent {
    constructor (client: Client) {
        super(client, 'ready')
    }
    async run() {
        console.log(`Bot Online: ${this.client.user?.tag}`)
    }
}