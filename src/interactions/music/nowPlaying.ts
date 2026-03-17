import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../classes'
import Client from '../../client'

export default class NowPlayingInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            aliases: ['np'],
            category: 'Music',
            data: new SlashCommandBuilder()
                .setName('nowplaying')
                .setDescription('shows info on current track')
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
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
                await interaction.editReply('You need to join the voice channel')
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

            const { currentTrack } = player

            const embed = await this.client.utils.createMessageEmbed({
                author: {
                    name: this.client.user!.displayName,
                    iconURL: this.client.user?.avatarURL() || undefined
                },
                color: 'Blue',
                title: 'Now Playing Command',
                description: `**[${currentTrack.info.title}](${currentTrack.info.uri || ''})** - \`${this.client.utils.formatDuration(currentTrack.info.length)}\` • ${currentTrack.info.requester}
                `,
                footer: {
                    text: interaction.member!.user.username,
                },
                thumbnail: currentTrack.info.artworkUrl || undefined
            })

            await interaction.editReply({ embeds: [embed!]})
            return

        } catch (error: any) {
            console.log('There was an error in NowPlaying command: ', error)
            await interaction.editReply(`There was an error \`${error.message}\``)
            return
        }

    }
}