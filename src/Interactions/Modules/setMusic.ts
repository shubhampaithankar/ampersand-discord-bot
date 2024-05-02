import Client from '../../Client'
import { MainInteraction } from '../../Classes'
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder, ChannelSelectMenuComponentData, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, SlashCommandBooleanOption, SlashCommandBuilder, TextChannel } from 'discord.js'
import { musicSchema } from '../../Database/Schemas'
import { updateMusic } from '../../Database/databaseUtils'

export default class SetMusicInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, 'setmusic', {
            name: 'setmusic',
            description: 'shows music module menu',
            type: 1,
            options: null,
            module: 'Module',
            permissions: [
                'Administrator',
                'ManageGuild'
            ]
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            const guildMusicData = await musicSchema.findOne({ guildId: interaction.guildId })
            const isEnabled = guildMusicData && guildMusicData.enabled

            const name = isEnabled ? 'Disable' : 'Enable'
            const description = isEnabled ? 'Disable the music module. Currently: `Enabled`' : 'Enable the music module. Currently: `Disabled`'
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
            })

            const collected = await this.client.utils.createInteractionCollector(interaction, ComponentType.Button, 1, customId) as ButtonInteraction
            if (collected) await this.followUp(collected, name)

        } catch (error) {
            console.log(error)
        }
    }

    async followUp(interaction: any, name: string) {
        try {
            const type = interaction.customId.split('_')[2]

            switch (type) {
            case `onModule${name}`: {
                const inter = interaction as ButtonInteraction
                if (name === 'Enable') {
                    const customId = `${inter.channelId}_${inter.id}_onChannelSelect`
                        
                    const channelOptions = new ChannelSelectMenuBuilder()
                        .setChannelTypes(ChannelType.GuildText)
                        .setCustomId(customId)
                        
                    const selectMenu = new ActionRowBuilder<ChannelSelectMenuBuilder>()
                        .addComponents(channelOptions)
                        
                    await inter.reply({ components: [selectMenu] })
                        
                    const collected = await this.client.utils.createInteractionCollector(inter, ComponentType.ChannelSelect, 1, customId) as ChannelSelectMenuInteraction
                    if (collected) await this.followUp(collected, name)
                } else {
                    if (inter.guildId) {
                        await updateMusic(false, inter.guildId)
                        await inter.reply({
                            content: 'Disabled ***Music module***'
                        })
                    }
                }
                break
            }
            case 'onChannelSelect': {
                const inter = interaction as ChannelSelectMenuInteraction
        
                if (!inter.channels) return
                    
                if (inter.channels.size <= 0) {
                    await inter.reply('Please select a channel')
                    break
                }
                    
                const channel = inter.channels.first() as TextChannel
                if (channel && inter.guildId) {
                    await updateMusic(true, inter.guildId)
                    await inter.reply(
                        `Enabled ***Music module*** and successfully set \`${channel.name}\` as **Music Commands Input** Channel`
                    )
                }
                break
            }
            default: return
            }


            
        } catch (error) {
            console.log(error)
        }
    }
}