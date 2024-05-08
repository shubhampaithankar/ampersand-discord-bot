import { Node, Player, Track } from 'poru'
import { MainMusicEvent } from '../Classes'
import Client from '../Client'

export default class QueueEndEvent extends MainMusicEvent {
    constructor(client: Client) {
        super(client, 'queueEnd')
    }

    async run(player: Player, track: Track) {
        try {
            if (player) {
                setTimeout(async () => {
                    const guildPlayer = await this.client.utils.getMusicPlayer(player.guildId)
                    if (!guildPlayer) return

                    if (guildPlayer.queue.size === 0 && !guildPlayer.loop && !player.currentTrack) guildPlayer.destroy()
                }, 1e3 * 180)
            }
        } catch (error) {
            console.log(error)
        }
    }
}
