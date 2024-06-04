import Client from '../../../Client'
import { MainInteraction } from '../../../Classes'
import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, TextChannel } from 'discord.js'
import { getMusic, updateMusic } from '../../../Database/databaseUtils'

export default class AddMusicChannelInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            category: 'Modules',
            permissions: [
                'ManageGuild'
            ],
            data: new SlashCommandBuilder()
                .setName('addmusicchannel')
                .setDescription('adds a text channel to music module'),
        })
    }
  
    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        try {
            const guildMusicData = await getMusic(interaction.guild!)

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

            const collected = await this.client.utils.createInteractionCollector(interaction, customId, ComponentType.ChannelSelect, undefined, 1) as ChannelSelectMenuInteraction
            if (collected) return await this.followUp(collected, interaction, guildMusicData?.enabled)

        } catch (error: any) {
            console.log('There was an error in AddMusicChannel command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }
    }
  
    followUp = async (interaction: ChannelSelectMenuInteraction, prevInteraction: ChatInputCommandInteraction, value: any) => {
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
                    await updateMusic(value || false, interaction.guildId, channel)
                    await prevInteraction.editReply({
                        content: `Added \`${channel.name}\` to Music Commands Input Channel`,
                        components: [],
                    })
                    return
                } catch (error: any) {
                    console.error('Error enabling music:', error)
                    await prevInteraction.editReply({
                        content: `There was an error \`${error.message}\``,
                        components: []
                    })
                    return
                }
            }
        } catch (error: any) {
            console.log('There was an error in AddMusicChannel command follow-up: ', error)
            await prevInteraction.editReply({
                content: `There was an error \`${error.message}\``,
                components: []
            })
            return
        }
    }
}
  