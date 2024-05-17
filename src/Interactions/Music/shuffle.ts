import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'

export default class ShuffleInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            category: 'Music',
            data: new SlashCommandBuilder()
                .setName('shuffle')
                .setDescription('shuffles the queue')
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
                if (!player.currentTrack) {
                    await interaction.reply('There is no music playing')
                    return
                }
    
                // player.set(`beforeShuffle_${guild.id}`, player.queue.map(track => track))
                player.queue.shuffle()
                await interaction.reply('\'Shuffle the queue\'')
                return
            }
        } catch (error: any) {
            console.log('There was an error in Shuffle command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }

    }
}