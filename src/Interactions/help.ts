import Client from '../Client'
import { Interaction } from 'discord.js'
import { BaseInteraction } from '../Classes'

export default class HelpInteraction extends BaseInteraction {
    constructor(client: Client) {
        super(client, 'help', {
            name: 'help',
            description: 'shows help menu',
            type: 1,
            options: null
        })
    }

    async run(interaction: Interaction, ...args: string[]) {
        console.log('Hello world')
    }
}