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
        try {
            const URI = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=8&scope=bot`
            await interaction.reply(URI)
        } catch (error: any) {
            console.log('There was an error in Invite command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }
    }
}