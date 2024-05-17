import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'

export default class SkipInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            category: 'Music',
            data: new SlashCommandBuilder()
                .setName('join')
                .setDescription('joins the user\'s voice channel')
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        try {
            const guild = this.client.guilds.cache.get(interaction.guildId!)
            if (!guild) return
    
            const member = guild.members.cache.get(interaction.member!.user.id)
            if (!member) return
            
            const { channel } = member.voice
            if (!channel) {
                await interaction.reply('You need to join a voice channel')
                return
            }
      
            const player = await this.client.utils.getMusicPlayer(guild.id, channel.id, interaction.channelId, true)
            if (!player) {
                await interaction.reply('Unable to create player')
                return
            }
    
            if (player.isConnected) {
                if (player.voiceChannel !== channel.id) {
                    await interaction.reply('There is a player already present in another voice channel')
                    return
                }
            } 
    
            player.connect()
            await interaction.reply(`Joined **${channel.name}**`)
            return
        } catch (error: any) {
            console.log('There was an error in Join command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }

    }
}