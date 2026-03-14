import { Events, Message } from 'discord.js'
import { MainEvent } from '../../classes'
import Client from '../../client'

export default class MessageCreate extends MainEvent {
    constructor (client: Client) {
        super(client, Events.MessageCreate)
    }
    async run(message: Message) {
        // console.log(message.content)
    }
}