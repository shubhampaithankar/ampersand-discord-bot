import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../classes'
import Client from '../../client'

export default class LoopInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            category: 'Music',
            data: new SlashCommandBuilder()
                .setName('loop')
                .setDescription('sets the loop mode for the player')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('loop mode to set')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Off', value: 'NONE' },
                            { name: 'Track', value: 'TRACK' },
                            { name: 'Queue', value: 'QUEUE' },
                        )
                ) as SlashCommandBuilder
        })
    }

    run = async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply()
        try {
            const guild = this.client.guilds.cache.get(interaction.guildId!)
            if (!guild) return

            const member = guild.members.cache.get(interaction.member!.user.id)
            if (!member) return

            const player = await this.client.utils.getMusicPlayer(guild.id)
            if (!player || !player.isConnected) {
                await interaction.editReply('No player found in any voice channels')
                return
            }

            const { channel } = member.voice
            if (!channel) {
                await interaction.editReply('You need to join a voice channel')
                return
            }

            if (player.voiceChannel !== channel.id) {
                await interaction.editReply('You\'re not in the same voice channel')
                return
            }

            if (!player.currentTrack) {
                await interaction.editReply('There is no music playing')
                return
            }

            const mode = interaction.options.getString('mode', true) as 'NONE' | 'TRACK' | 'QUEUE'
            player.setLoop(mode)

            const modeLabels = { NONE: 'off', TRACK: 'track', QUEUE: 'queue' }
            await interaction.editReply(`Loop set to **${modeLabels[mode]}**`)

        } catch (error: any) {
            console.log('There was an error in Loop command: ', error)
            await interaction.editReply(`There was an error \`${error.message}\``)
        }
    }
}
