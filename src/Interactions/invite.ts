import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction } from 'discord.js'

export default class InviteInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, 'invite', {
            name: 'invite',
            description: 'sends an invite link for the bot',
            type: 1,
            options: null,
            module: 'Miscellaneous'
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        const URI = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=${process.env.DISCORD_PERMISSION_INTEGER}&scope=bot`
        interaction.reply(URI)
    }
}