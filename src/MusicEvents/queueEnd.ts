import { Node, Player, Track } from 'poru'
import { MainMusicEvent } from '../Classes'
import Client from '../Client'
import { TextChannel } from 'discord.js'

export default class QueueEndEvent extends MainMusicEvent {
    constructor(client: Client) {
        super(client, 'queueEnd')
    }

    async run(player: Player, track: Track) {
        try {
            setTimeout(async () => {
                if (!player) return 
                
                const guildPlayer = await this.client.utils.getMusicPlayer(player.guildId)
                if (!guildPlayer) return

                if (guildPlayer.queue.size === 0 && !guildPlayer.loop && !player.currentTrack) {
                    guildPlayer.destroy()

                    const channel = this.client.channels.cache.get(player.textChannel) as TextChannel
                    if (!channel) return

                    await channel.send('Queue has ended')
                }
            }, 1e3 * 180)
        } catch (error) {
            console.log(error)
        }
    }
}
