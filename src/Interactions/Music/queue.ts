import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'

export default class QueueInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            category: 'Music',
            data: new SlashCommandBuilder()
                .setName('queue')
                .setDescription('shows the current queue')
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        try {
            const guild = this.client.guilds.cache.get(interaction.guildId!)
            if (!guild) return
    
            const member = guild.members.cache.get(interaction.member!.user.id)
            if (!member) return
      
            const player = await this.client.utils.getMusicPlayer(guild.id)
            if (!player) {
                await interaction.reply('No player found in any voice channels')
                return
            }
    
            const { channel } = member.voice
            if (!channel) {
                await interaction.reply('You need to join the voice channel')
                return
            }
    
            if (player.isConnected) {
                if (player.voiceChannel !== channel.id) {
                    await interaction.reply('You\'re not in the same voice channel')
                    return
                }
                const tracks = player.queue
                if (!tracks.size) {
                    // no tracks in q
                    return
                }

                if (tracks.size <= 10) {
                    // send it in channel
                }
                player.queue.clear()
                await interaction.reply('Cleared the current queue')
                return
            }
        } catch (error: any) {
            console.log('There was an error in ClearQueue command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }

    }
}