import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'

export default class PlayInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            data: new SlashCommandBuilder()
                .setName('play')
                .setDescription('plays music in user\'s voice channel')
        })
    }

    run = async (interaction: ChatInputCommandInteraction) => {
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
        if (!player) return

        if (channel.id !== player.voiceChannel) {
            await interaction.reply('You\'re not in the same voice channel')
        }

        const search = ''

        if (!search.length) {
            // Handle the case where the search term is missing
            await interaction.reply('Please enter a search term or URL')
            return
        }

        if (player.state !== 'CONNECTED') player.connect()

        let res
      
        try {
            res = await player.search(search, member.user.username)
            if (res.loadType === 'LOAD_FAILED') {
                if (!player.queue.current) player.destroy()
                throw res.exception
            }
        } catch (err: any) {
            await interaction.reply(`There was an error while searching: \`${err.message}\``)
        }

        if (!res) return
      
        switch (res.loadType) {
      
        case 'NO_MATCHES': {
            if (!player.queue.current) player.destroy()

            await interaction.reply(`No results found for the term: **${search}**`)
            break
        }
        case 'TRACK_LOADED': {
            player.queue.add(res.tracks[0])
            if (!player.playing && !player.paused && !player.queue.size) player.play()
                  
            await interaction.reply(`Added \`${res.tracks[0].title}\` to the queue`)
            break
        }
        case 'PLAYLIST_LOADED': {
            player.queue.add(res.tracks)
      
            if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play()
                
            await interaction.reply(`Queued playlist \`${res.playlist?.name}\` with ${res.tracks.length} tracks`)
            break
        }
        case 'SEARCH_RESULT': {
            player.queue.add(res['tracks'][0])
            if (!player.playing && !player.paused && !player.queue.size) player.play()
                  
            await interaction.reply(`Added \`${res['tracks'][0].title}\` to the queue`)
            break
        }
        }
    }
}