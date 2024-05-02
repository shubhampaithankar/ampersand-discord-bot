import Client from '../../Client'
import { MainInteraction } from '../../Classes'
import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelSelectMenuComponentData, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, VoiceChannel } from 'discord.js'
import { updateJTC } from '../../Database/databaseUtils'

export default class SetJTC extends MainInteraction {
    constructor(client: Client) {
        super(client, 'setjtc', {
            name: 'setjtc',
            description: 'shows jtc menu',
            type: 1,
            options: null,
            permissions: [
                'Administrator'
            ]
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            const data: ChannelSelectMenuComponentData = {
                customId: `${interaction.channelId}_${interaction.id}`,
                type: ComponentType.ChannelSelect,
                channelTypes: [ChannelType.GuildVoice]
            }

            const selectMenu = new ActionRowBuilder<ChannelSelectMenuBuilder>()
                .addComponents(new ChannelSelectMenuBuilder(data))

            await interaction.reply({
                components: [selectMenu]
            })

            const collected = await this.client.utils.createInteractionCollector(interaction, ComponentType.ChannelSelect, 1) as ChannelSelectMenuInteraction
            if (collected) await this.followUp(collected)

        } catch (error) {
            console.log(error)
            await interaction.reply('There was an error, please try again later')
        }
    }
    
    async followUp(interaction: ChannelSelectMenuInteraction, ...args: string[]) {
        try {
            if (interaction.channels && interaction.channels?.size <= 0) {
                await interaction.reply('Please select a channel')
                return
            }
            const channel = interaction.channels?.first() as VoiceChannel
            if (channel) {
                await updateJTC(channel, true)
                await interaction.reply(`Enabled join to create module and successfully set ${channel.name} as \`Join to create\` Channel`)
            }
        } catch (error) {
            console.log(error)
            await interaction.reply('There was an error, please try again later') 
        }
    }
}