import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction } from 'discord.js'

export default class HelpInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, 'help', {
            name: 'help',
            description: 'shows help menu',
            type: 1,
            options: null
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        interaction.reply('Hello World')
    }
}