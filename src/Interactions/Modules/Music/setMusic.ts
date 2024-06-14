import Client from '../../../Client'
import { MainInteraction } from '../../../Classes'
import { APIButtonComponent, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, TextChannel } from 'discord.js'
import { getMusic, updateMusic } from '../../../Database/databaseUtils'

export default class SetMusicInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            permissions: [
                'ManageGuild'
            ],
            category: 'Modules',
            data: new SlashCommandBuilder()
                .setName('setmusic')
                .setDescription('enable / disable music module'),
        })
    }
  
    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        await interaction.deferReply().catch(() => {})
        try {
            const guildMusicData = await getMusic(interaction.guild!)
            const isEnabled = guildMusicData && guildMusicData.enabled
  
            const name = isEnabled ? 'Disable' : 'Enable'
            const description = isEnabled
                ? 'Disable the music module. Currently: `Enabled`'
                : 'Enable the music module. Currently: `Disabled`'
            const style = isEnabled ? ButtonStyle.Danger : ButtonStyle.Success
  
            const customId = `${interaction.channelId}_${interaction.id}_onModule${name}`
  
            const button = new ButtonBuilder()
                .setLabel(name)
                .setStyle(style)
                .setCustomId(customId)
  
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(button)
  
            await interaction.editReply({
                content: description,
                components: [row],
            })

            this.collector = interaction.channel!.createMessageComponentCollector({
                componentType: ComponentType.Button,
                max: 1,
                filter: (i) => i.customId === customId && i.user.id === interaction.user.id
            })
  
            await this.followUp(interaction, name)

        } catch (error: any) {
            console.log('There was an error in SetMusic command: ', error)
            await interaction.editReply(`There was an error \`${error.message}\``)
            return
        }
    }
  
    followUp = async (prevInteraction: any, name?: string) => {
        try {
            const collector = this.collector!

            collector.on('collect', async (interaction: any) => {
                const type = interaction.customId.split('_')[2]

                switch (type) {
                    case `onModule${name}`: {
                        const inter = interaction as ButtonInteraction
                        const prevInter = prevInteraction as ChatInputCommandInteraction
      
                        if (name === 'Enable') {
    
                            const customId = `${inter.channelId}_${inter.id}_onChannelSelect`
      
                            const channelOptions = new ChannelSelectMenuBuilder()
                                .setChannelTypes(ChannelType.GuildText)
                                .setCustomId(customId)
      
                            const selectMenu = new ActionRowBuilder<ChannelSelectMenuBuilder>()
                                .addComponents(channelOptions)
    
                            // Prevent the button from being clicked once user clicks enable
                            try {
                                const buttonId = `${prevInter.channelId}_${prevInter.id}_onModule${name}`
                                const buttonComponent = inter.message.components[0].components.find(component => component.customId === buttonId)
        
                                if (buttonComponent) {
                                    const row = new ActionRowBuilder<ButtonBuilder>()
                                        .addComponents(ButtonBuilder.from(buttonComponent as APIButtonComponent).setDisabled(true))
            
                                    await prevInter.editReply({
                                        components: [row]
                                    })
                                }
                            
                            } catch (error: any) {
                                console.log('There was an error in SetMusic command follow-up: ', error)
                                await prevInter.editReply({
                                    content: `There was an error \`${error.message}\``,
                                    components: []
                                }) 
                                return
                            }

                            await inter.deferUpdate()
    
                            await prevInter.editReply({
                                content: 'Please select a channel for the music module',
                                components: [selectMenu],
                            })

                            this.collector = inter.channel!.createMessageComponentCollector({
                                componentType: ComponentType.ChannelSelect,
                                max: 1,
                                filter: (i) => i.customId === customId && i.user.id === inter.user.id
                            })

                            await this.followUp(prevInter)

                            return
    
                        } else {
                            if (inter.guildId) {
                                try {
                                    await updateMusic(false, inter.guildId) // Add error handling
                                    await prevInter.editReply({
                                        content: `Disabled **Music module** for \`${inter.guild!.name}\``,
                                        components: [],
                                    })
                                    return
                                } catch (error: any) {
                                    console.error('Error disabling music:', error)
                                    await prevInter.editReply({
                                        content: `There was an error \`${error.message}\``,
                                        components: []
                                    })
                                    return
                                }
                            }
                        }
                        break
                    }
                    case 'onChannelSelect': {
                        const inter = interaction as ChannelSelectMenuInteraction
                        const prevInter = prevInteraction as ButtonInteraction

                        if (!inter.channels) throw new Error('No channels found')

                        if (inter.channels.size === 0) {
                            await prevInter.editReply({
                                content: 'Please select a channel',
                                components: [],
                            })
                            return
                        }
      
                        const channel = inter.channels.first() as TextChannel
                        if (channel && inter.guildId) {
                            try {
                                await updateMusic(true, inter.guildId)
                                await prevInter.editReply({
                                    content: `Enabled **Music module** and successfully set \`${channel.name}\` as Music Commands Input Channel`,
                                    components: [],
                                })
                                return
                            } catch (error: any) {
                                console.error('Error enabling music:', error)
                                await prevInter.editReply({
                                    content: `There was an error \`${error.message}\``,
                                    components: []
                                })
                                return
                            }
                        }
                        break
                    }
                    default: {
                        collector.stop()
                        throw new Error('Invalid input. Please try again.')
                    }
                }
            })

            collector.on('end', () => {})

            return
        } catch (error: any) {
            console.log('There was an error in SetMusic command follow-up: ', error)
            await prevInteraction.editReply({
                content: `There was an error \`${error.message}\``,
                components: []
            }) 
            return
        }
    }
}
  