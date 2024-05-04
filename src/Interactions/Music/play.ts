import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'
// import { SearchResult } from 'erela.js'
import { Response } from 'poru'

export default class PlayInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            data: new SlashCommandBuilder()
                .setName('play')
                .setDescription('plays music in user\'s voice channel')
                .addStringOption((option) => option.setName('song').setDescription('plays the song by name or url').setRequired(true))
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
  
        const player = await this.client.utils.getMusicPlayer(guild.id, channel.id, interaction.channelId, true)
        if (!player) return

        if (channel.id !== player.voiceChannel) {
            await interaction.reply('You\'re not in the same voice channel')
        }

        const search = interaction.options.getString('song') || ''
        if (!search.length) {
            // Handle the case where the search term is missing
            await interaction.reply('Please enter a search term or URL')
            return
        }

        if (!player.isConnected) player.connect()

        let res: Response | undefined
      
        try {
            res = await player.resolve({
                query: search, 
                requester: member.user.username
            })
            if (res.loadType === 'error') {
                if (!player.currentTrack) player.destroy()
                throw new Error('There was an error while resolving tracks')
            }
        } catch (err) {
            console.log(err)
            await interaction.reply('There was an error while searching')
        }

        if (!res) return

        console.log(res.loadType)
        switch (res.loadType) {
      
        case 'empty': {
            if (!player.currentTrack) player.destroy()
                
            await interaction.reply(`No results found for the term: **${search}**`)
            return
        }
        case 'track': {
            player.queue.add(res.tracks[0])
            if (!player.isPlaying && player.isConnected) player.play()
                  
            await interaction.reply(`Added \`${res.tracks[0].track}\` to the queue`)
            return
        }
        case 'playlist': {
            for (const track of res.tracks) player.queue.add(track)
      
            if (!player.isPlaying && player.isConnected && player.queue.size === res.tracks.length) player.play()
                
            await interaction.reply(`Queued playlist \`${res.playlistInfo.name}\` with ${res.tracks.length} tracks`)
            return
        }
        case 'search': {
            player.queue.add(res.tracks[0])
            if (!player.isPlaying && player.isConnected) player.play()
                  
            await interaction.reply(`Added \`${res.tracks[0].info.title}\` to the queue`)
            return
        }
        }
    }
}