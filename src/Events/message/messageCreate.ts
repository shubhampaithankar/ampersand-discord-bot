import { Message } from 'discord.js'
import { MainEvent } from '../../Classes'
import Client from '../../Client'

export default class MessageCreate extends MainEvent {
    constructor (client: Client) {
        super(client, 'messageCreate')
    }
    async run(message: Message) {
        // console.log(message.content)
    }
}