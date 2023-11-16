import { MainEvent } from '../Classes'
import Client from '../Client'

export default class ReadyEvent extends MainEvent {
    constructor (client: Client) {
        super(client, 'ready', {
            once: true
        })
    }
    async run() {
        console.log(`Bot Online: ${this.client.user?.tag}`)
    }
}