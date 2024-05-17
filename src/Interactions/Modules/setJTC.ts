import Client from '../../Client'
import { MainInteraction } from '../../Classes'
import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, VoiceChannel } from 'discord.js'
import { updateJTC } from '../../Database/databaseUtils'

export default class SetJTC extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            permissions: [
                'ManageGuild'
            ],
            category: 'Modules',
            data: new SlashCommandBuilder()
                .setName('setjtc')
                .setDescription('shows jtc menu')
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            const customId = `${interaction.channelId}_${interaction.id}_setJTC`
            const channelOptions = new ChannelSelectMenuBuilder()
                .setCustomId(customId)
                .setChannelTypes(ChannelType.GuildVoice)

            const selectMenu = new ActionRowBuilder<ChannelSelectMenuBuilder>()
                .addComponents(channelOptions)

            await interaction.reply({
                components: [selectMenu]
            })

            const collected = await this.client.utils.createInteractionCollector(interaction, ComponentType.ChannelSelect, 1, customId) as ChannelSelectMenuInteraction
            if (collected) return await this.followUp(collected, interaction)

        } catch (error: any) {
            console.log('There was an error in SetJTC command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }
    }
    
    async followUp(interaction: ChannelSelectMenuInteraction, prevInteraction: ChatInputCommandInteraction) {
        try {
            if (!interaction.channels) return

            if (interaction.channels.size <= 0) {
                await interaction.reply('Please select a channel')
                return
            }
            const channel = interaction.channels.first() as VoiceChannel
            if (channel) {
                await updateJTC(channel, true)
                await prevInteraction.editReply({
                    content: `Enabled **Join To Create** module and successfully set \`${channel.name}\` as join to create Channel`,
                    components: []
                })
            }
        } catch (error: any) {
            console.log('There was an error in SetJTC command: ', error)
            await prevInteraction.editReply({
                content: `There was an error \`${error.message}\``,
                components: []
            }) 
            return
        }
    }
}