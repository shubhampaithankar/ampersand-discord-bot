import { Node, Player, Track } from 'erela.js'
import { MainMusicEvent } from '../Classes'
import Client from '../Client'

export default class QueueEndEvent extends MainMusicEvent {
    constructor(client: Client) {
        super(client, 'queueEnd')
    }

    async run(player: Player, track: Track) {
        try {
        } catch (error) {
            console.log(error)
        }
    }
}
