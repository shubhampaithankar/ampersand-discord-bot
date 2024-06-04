import { MainMusicEvent } from '../../Classes'
import { Player } from 'poru'

export default class PlayerUpdateEvent extends MainMusicEvent{
    async run(player: Player) {
    }
}