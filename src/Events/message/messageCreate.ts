import { Message } from 'discord.js'
import { BaseEvent } from '../../Classes'
import Client from '../../Client'

export default class MessageCreate extends BaseEvent {
    constructor (client: Client) {
        super(client, 'messageCreate')
    }
    async run(message: Message) {
        console.log(message.content)
    }
}