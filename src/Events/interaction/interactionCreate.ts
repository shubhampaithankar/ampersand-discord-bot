import { Interaction } from 'discord.js'
import { BaseEvent } from '../../Classes'
import Client from '../../Client'

export default class InteractionCreate extends BaseEvent {
    constructor (client: Client) {
        super(client, 'interactionCreate')
    }
    async run(interaction: Interaction) {
        if (interaction.isChatInputCommand()) {
            
        }
    }
}