import { TextChannel } from 'discord.js'
import { MainMusicEvent } from '../../Classes'
import { Player, Track } from 'poru'

export default class PlayerUpdateEvent extends MainMusicEvent{
    async run (player: Player) {
    }
}