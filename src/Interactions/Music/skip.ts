import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'

export default class SkipInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            category: 'Music',
            data: new SlashCommandBuilder()
                .setName('skip')
                .setDescription('skips current track')
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        try {
            const guild = this.client.guilds.cache.get(interaction.guildId!)
            if (!guild) return
    
            const member = guild.members.cache.get(interaction.member!.user.id)
            if (!member) return
      
            const player = await this.client.utils.getMusicPlayer(guild.id)
            if (!player || !player.isConnected) {
                await interaction.reply('No player found in any voice channels')
                return
            }
    
            const { channel } = member.voice
            if (!channel) {
                await interaction.reply('You need to join the voice channel')
                return
            }
    
            if (player.voiceChannel !== channel.id) {
                await interaction.reply('You\'re not in the same voice channel')
                return
            }
            if (!player.currentTrack) {
                await interaction.reply('There is no music playing')
                return
            }
            player.stop()
            await interaction.reply(`Skipped current track: \`${player.currentTrack.info.title}\``)
            return

        } catch (error: any) {
            console.log('There was an error in Skip command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }

    }
}