import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export default class InviteInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            data: new SlashCommandBuilder()
                .setName('invite')
                .setDescription('sends an invite link for the bot'),



        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        const URI = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=${process.env.DISCORD_PERMISSION_INTEGER}&scope=bot`
        interaction.reply(URI)
    }
}