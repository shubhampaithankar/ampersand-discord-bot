import Client from '../../Client'
import { MainInteraction } from '../../Classes'
import { BaseGuildTextChannel, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export default class PurgeInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            permissions: [
                'ManageMessages',
                'ManageThreads',
            ],
            data: new SlashCommandBuilder()
                .setName('purge')
                .setDescription('deletes a number of messages from the channel')
                .addNumberOption(
                    (option) => 
                        option
                            .setName('number')
                            .setDescription('number of messages')
                            .setRequired(true)
                            .setMaxValue(100)
                            .setMinValue(5)
                )
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        const deferReply = await interaction.deferReply().catch(err => {})
        try {
            const channel = interaction.channel as BaseGuildTextChannel
            const number = interaction.options.getNumber('number')! 

            const { messages } = channel
            const messagesToDelete = await messages.fetch({ limit: number, before: deferReply?.id, cache: true })

            const deletedMessages = await channel.bulkDelete(messagesToDelete, true)
            
            await interaction.editReply(`Purged ${deletedMessages.size} messages in the channel.`)
            return
        } catch (error: any) {
            console.log('There was an error in Purge command: ', error)
            await interaction.editReply(`There was an error \`${error.message}\``)
            return
        }
    }
}