import { Events } from 'discord.js'
import { MainEvent } from '../Classes'
import Client from '../Client'

export default class RawEvent extends MainEvent {
    constructor (client: Client) {
        super(client, Events.Raw)
    }

    async run(d: any) {
        if (this.client.music) this.client.music.updateVoiceState(d)
    }
}