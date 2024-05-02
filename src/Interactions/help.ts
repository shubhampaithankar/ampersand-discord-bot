import Client from '../Client'
import { MainInteraction } from '../Classes'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export default class HelpInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            data: new SlashCommandBuilder()
                .setName('help')
                .setDescription('shows help menu')
                .addStringOption((option) => option.setName('command').setDescription('help regarding the command').setRequired(false)),
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            console.log(interaction.options.getString('command'))
            interaction.reply('Hello World')
        } catch (error) {
            console.log(error)
        }
    }
}