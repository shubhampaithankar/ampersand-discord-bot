import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'

export default class StopInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            category: 'Music',
            data: new SlashCommandBuilder()
                .setName('stop')
                .setDescription('stops the bot from playing and disconnect')
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
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
            await interaction.reply('You need to join a voice channel')
            return
        }

        if (player.isConnected) {
            if (player.voiceChannel !== channel.id) {
                await interaction.reply('You\'re not in the same voice channel')
            }
            await interaction.reply('Stopped playing')
            player.destroy()
        }
    }
}