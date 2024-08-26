import Client from '../../Client'
import { MainInteraction } from '../../Classes'
import { ChatInputCommandInteraction, SlashCommandBuilder, VoiceChannel } from 'discord.js'
import { getJTCChannels, updateJTCChannels } from '../../Database/databaseUtils'

export default class ClearJTC extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            permissions: [
                'ManageGuild'
            ],
            category: 'Modules',
            data: new SlashCommandBuilder()
                .setName('clearjtc')
                .setDescription('clear\'s all channels created by jtc system')
        })
    }

    async run(interaction: ChatInputCommandInteraction, ...args: string[]) {
        try {
            const { guild } = interaction
            const JTCChannels = await getJTCChannels(guild!)

            if (!JTCChannels) {
                await interaction.reply({
                    content: `No **JTC Created Channels** found for guild: \`${guild!.name}\``
                })
                return
            }

            for (const JTCChannel of JTCChannels.channelId) {
                const channel = guild?.channels.cache.get(JTCChannel) as VoiceChannel
                if (channel) {
                    await channel.delete()
                    await updateJTCChannels(channel, false)
                }
            }

            await interaction.reply({
                content: `Successfully cleared **JTC Created Channels** for ${guild!.name}`
            })

        } catch (error: any) {
            console.log('There was an error in ClearJTC command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }
    }
    
    // async followUp(interaction: ChannelSelectMenuInteraction, prevInteraction: ChatInputCommandInteraction) {
    // }
}