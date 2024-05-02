import { ChatInputCommandInteraction } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'

export default class StopInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, 'stop', {
            name: 'stop',
            description: 'stops music',
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
  
        const player = await this.client.utils.createMusicPlayer(guild.id, channel.id, interaction.channelId, false)
        if (!player) {
            await interaction.reply('No player found in any voice channels')
            return
        }

        if (player.state === 'CONNECTED') {
            if (player.voiceChannel !== channel.id) {
                await interaction.reply('You\'re not in the same voice channel')
            }
            player.destroy()
        }
    }
}