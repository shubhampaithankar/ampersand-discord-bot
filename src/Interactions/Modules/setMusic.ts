import Client from '../../Client'
import { MainInteraction } from '../../Classes'
import { ChannelSelectMenuComponentData, ChannelType, ChatInputCommandInteraction, ComponentType, SlashCommandBooleanOption, SlashCommandBuilder } from 'discord.js'
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

            const name = guildMusicData && guildMusicData.enabled ? 'disable' : 'enable'
            const description = guildMusicData && guildMusicData.enabled ? 'Disable the music module' : 'Enable the music module'

            const data = new SlashCommandBuilder()
                .setName('music-module')
                .setDescription('Enable or disable the music module for your guild.')
                .addBooleanOption(option =>
                    option.setName(name)
                        .setDescription(description)
                        .setRequired(true)
                )

        } catch (error) {
            console.log(error)
        }
    }

    async followUp(interaction: any, ...args: string[]): Promise<void> {
        
    }
}