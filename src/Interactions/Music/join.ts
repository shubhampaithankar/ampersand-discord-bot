import { ChatInputCommandInteraction } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'

export default class SkipInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, 'join', {
            name: 'join',
            description: 'joins a voice channel for music',
            type: 1,
            module: 'Music',
            options: null
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        const guild = this.client.guilds.cache.get(interaction.guildId!)
        if (!guild) return

        const member = guild.members.cache.get(interaction.member!.user.id)
        if (!member) return
        
        const { channel } = member.voice
        if (!channel) {
            await interaction.reply('You need to join a voice channel')
            return
        }
  
        const player = await this.client.utils.createMusicPlayer(guild.id, channel.id, interaction.channelId, true)

        if (player?.state === 'CONNECTED') {
            if (player?.voiceChannel !== channel.id) {
                await interaction.reply('There is a player present in a voice channel')
            }
        } else player?.connect()
    }
}