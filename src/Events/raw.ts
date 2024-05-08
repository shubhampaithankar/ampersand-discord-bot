import { Events } from 'discord.js'
import { MainEvent } from '../Classes'
import Client from '../Client'

export default class RawEvent extends MainEvent {
    constructor (client: Client) {
        super(client, Events.Raw)
    }

    async run(data: any) {
        if (this.client.music) {
            // switch (data.t) {
            // case 'VOICE_SERVER_UPDATE':
            // case 'VOICE_STATE_UPDATE':
            //     this.client.music.updateVoiceState(data.d as VoiceState | VoiceServer | VoicePacket)
            //     break
            //     // Handle other raw events here
            // }
            
        }
    }
}