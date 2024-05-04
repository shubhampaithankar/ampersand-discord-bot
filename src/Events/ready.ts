import { Events } from 'discord.js'
import { MainEvent } from '../Classes'
import Client from '../Client'

export default class ReadyEvent extends MainEvent {
    constructor (client: Client) {
        super(client, Events.ClientReady)
    }
    run = async () => {
        console.log('online')
    }
}