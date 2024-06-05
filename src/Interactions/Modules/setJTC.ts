import Client from '../../Client'
import { MainInteraction } from '../../Classes'
import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, InteractionCollector, SlashCommandBuilder, VoiceChannel } from 'discord.js'
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
                .setDescription('shows jtc menu'),
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
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

            this.collector = interaction.channel!.createMessageComponentCollector({
                componentType: ComponentType.ChannelSelect,
                max: 1,
                filter: (i) => i.customId === customId && i.user.id === interaction.user.id
            })

            await this.followUp(interaction)

        } catch (error: any) {
            console.log('There was an error in SetJTC command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }
    }

    followUp = async (prevInteraction: ChatInputCommandInteraction) => {
        try {

            const collector = this.collector!

            collector.on('collect', async (interaction: ChannelSelectMenuInteraction) => {
                if (!interaction.channels) return
        
                if (interaction.channels.size <= 0) {
                    await prevInteraction.editReply({
                        content: 'Please select a channel',
                        components: []
                    })
                    return
                }

                const bot = interaction.guild!.members.cache.get(this.client.user!.id)!
    
                const channel = interaction.channels.first() as VoiceChannel
                if (channel) {

                    await channel.permissionOverwrites.edit(bot, {
                        ViewChannel: true
                    })

                    await updateJTC(channel, true)
                    
                    await prevInteraction.editReply({
                        content: `Enabled **Join To Create** module and successfully set \`${channel.name}\` as join to create Channel`,
                        components: []
                    })
                }
                return
            })    

            collector.on('end', () => {})

        } catch (error: any) {
            console.log('There was an error in SetJTC followUp: ', error)
            await prevInteraction.editReply({
                content: `There was an error \`${error.message}\``,
                components: []
            }) 
            return
        }
    }
}