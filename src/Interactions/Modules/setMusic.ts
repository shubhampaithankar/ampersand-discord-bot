import Client from '../../Client'
import { MainInteraction } from '../../Classes'
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuBuilder, ChannelSelectMenuComponentData, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, ComponentType, SlashCommandBooleanOption, SlashCommandBuilder } from 'discord.js'
import { musicSchema } from '../../Database/Schemas'

export default class SetMusicInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, 'setmusic', {
            name: 'setmusic',
            description: 'shows music module menu',
            type: 1,
            options: null,
            permissions: [
                'Administrator',
                'ManageGuild'
            ]
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            await interaction.deferReply()

            const guildMusicData = await musicSchema.findOne({ guildId: interaction.guildId })
            const isEnabled = guildMusicData && guildMusicData.enabled

            const name = isEnabled ? 'Disable' : 'Enable'
            const description = isEnabled ? 'Disable the music module. Currently: `Enabled`' : 'Enable the music module. Currently: `Disabled`'
            const style = isEnabled ? ButtonStyle.Danger : ButtonStyle.Success

            const button = new ButtonBuilder()
                .setLabel(name)
                .setStyle(style)
                .setCustomId(`${interaction.channelId}_${interaction.id}`)

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(button)

            await interaction.editReply({
                content: description,
                components: [row],
            })

            const collected = await this.client.utils.createInteractionCollector(interaction, ComponentType.Button, 1) as ButtonInteraction
            if (collected) await this.followUp(collected)

        } catch (error) {
            console.log(error)
        }
    }

    async followUp(interaction: any, ...args: string[]) {
        try {
            console.log(interaction)
            // const type = interaction.customId.split('_')[2]
            // console.log(type)
            const channelOptions = new ChannelSelectMenuBuilder()
                .setChannelTypes(ChannelType.GuildText)
                .setCustomId(`${interaction.channelId}_${interaction.id}_onChannelSelect`)
            
            const selectMenu = new ActionRowBuilder<ChannelSelectMenuBuilder>()
                .addComponents(channelOptions)

            await interaction.reply({
                components: [selectMenu]
            })
    
            const collected = await this.client.utils.createInteractionCollector(interaction, ComponentType.ChannelSelect, 1) as ChannelSelectMenuInteraction
            // if (collected) console.log(collected)
        } catch (error) {
            
        }
    }
}