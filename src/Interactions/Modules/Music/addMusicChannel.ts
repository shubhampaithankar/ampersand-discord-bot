import Client from '../../../Client'
import { MainInteraction } from '../../../Classes'
import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, TextChannel } from 'discord.js'
import { musicSchema } from '../../../Database/Schemas'
import { updateMusic } from '../../../Database/databaseUtils'

export default class AddMusicChannelInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            category: 'Modules',
            permissions: [
                'Administrator',
                'ManageGuild'
            ],
            data: new SlashCommandBuilder()
                .setName('addmusicchannel')
                .setDescription('adds a text channel to music module'),
        })
    }
  
    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            const guildMusicData = await musicSchema.findOne({ guildId: interaction.guildId })

            const customId = `${interaction.channelId}_${interaction.id}_addMusicChannel`
  
            const channelOptions = new ChannelSelectMenuBuilder()
                .setChannelTypes(ChannelType.GuildText)
                .setCustomId(customId)

            const selectMenu = new ActionRowBuilder<ChannelSelectMenuBuilder>()
                .addComponents(channelOptions)

            await interaction.reply({
                content: 'Please select a channel for the music module',
                components: [selectMenu],
                ephemeral: true
            })

            const collected = await this.client.utils.createInteractionCollector(interaction, ComponentType.ChannelSelect, 1, customId) as ChannelSelectMenuInteraction
            if (collected) return await this.followUp(collected, interaction, guildMusicData?.enabled)

        } catch (error) {
            console.log(error)
        }
    }
  
    async followUp(interaction: ChannelSelectMenuInteraction, prevInteraction: ChatInputCommandInteraction, value: any) {
        try {
            if (!interaction.channels) return // Check for missing channels

            if (interaction.channels.size === 0) {
                await prevInteraction.editReply({
                    content: 'Please select a channel',
                    components: [],
                })
                return
            }

            const channel = interaction.channels.first() as TextChannel
            if (channel && interaction.guildId) {
                try {
                    await updateMusic(value || false, interaction.guildId, channel) // Add error handling
                    await prevInteraction.editReply({
                        content: `Added \`${channel.name}\` to Music Commands Input Channel`,
                        components: [],
                    })
                    return
                } catch (error) {
                    console.error('Error enabling music:', error)
                    // Handle error appropriately (e.g., log to remote service, display user message)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }
}
  