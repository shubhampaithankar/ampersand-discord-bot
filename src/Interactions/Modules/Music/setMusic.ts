import Client from '../../../Client'
import { MainInteraction } from '../../../Classes'
import { APIButtonComponent, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, TextChannel } from 'discord.js'
import { musicSchema } from '../../../Database/Schemas'
import { updateMusic } from '../../../Database/databaseUtils'

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
  
    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            const guildMusicData = await musicSchema.findOne({ guildId: interaction.guildId })
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
  
            await interaction.reply({
                content: description,
                components: [row],
                ephemeral: true
            })
  
            const collected = await this.client.utils.createInteractionCollector(interaction, ComponentType.Button, 1, customId) as ButtonInteraction
            if (collected) return await this.followUp(collected, interaction, name)

        } catch (error: any) {
            console.log('There was an error in SetMusic command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }
    }
  
    async followUp(interaction: any, prevInteraction: any, name: string): Promise<any> {
        try {
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
                        
                        } catch (error) {
                            console.log(error)
                        }

                        await inter.reply({
                            content: 'Please select a channel for the music module',
                            components: [selectMenu],
                            ephemeral: true
                        })
  
                        const collected = await this.client.utils.createInteractionCollector(inter, ComponentType.ChannelSelect, 1, customId) as ChannelSelectMenuInteraction
                        if (collected) return await this.followUp(collected, interaction, name)

                    } else {
                        if (inter.guildId) {
                            try {
                                await updateMusic(false, inter.guildId) // Add error handling
                                return await prevInter.editReply({
                                    content: `Disabled **Music module** for \`${inter.guild!.name}\``,
                                    components: [],
                                })
                            } catch (error) {
                                console.error('Error disabling music:', error)
                            }
                        }
                    }
                    break
                }
                case 'onChannelSelect': {
                    const inter = interaction as ChannelSelectMenuInteraction
                    const prevInter = prevInteraction as ButtonInteraction
  
                    if (!inter.channels) return // Check for missing channels

                    if (inter.channels.size === 0) {
                        return await prevInter.editReply({
                            content: 'Please select a channel',
                            components: [],
                        })
                    }
  
                    const channel = inter.channels.first() as TextChannel
                    if (channel && inter.guildId) {
                        try {
                            await updateMusic(true, inter.guildId) // Add error handling
                            return await prevInter.editReply({
                                content: `Enabled **Music module** and successfully set \`${channel.name}\` as Music Commands Input Channel`,
                                components: [],
                            })
                        } catch (error) {
                            console.error('Error enabling music:', error)
                        // Handle error appropriately (e.g., log to remote service, display user message)
                        }
                    }
                    break
                }
                default: {
                    return
                }
            }
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
  