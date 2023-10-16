import Client from '../Client'
import { Interaction } from 'discord.js'
import { BaseInteraction } from '../Classes'

export default class HelpInteraction extends BaseInteraction {
    constructor(client: Client) {
        super(client, 'setjtc', {
            name: 'setjtc',
            description: 'Sets a voice channel into a join to create voice channel',
            type: 1,
            options: null
        })
    }

    async run(interaction: Interaction) {
        
    }
}