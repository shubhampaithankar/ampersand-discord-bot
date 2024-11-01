import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
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
            
            const { currentTrack } = player

            const tracks = player.queue.map((track, i) => `**${i + 1}.** - [${track.info.title}](${track.info.uri || ''}) - \`${this.client.utils.formatDuration(track.info.length)}\` • ${track.info.requester}`)
            const queueDuration = `${this.client.utils.formatDuration(player.queue.map(track => track.info.length).reduce((acc, curr) => acc + curr, 0))}`
            
            const pages: EmbedBuilder[] = []
            const pagesNumber = Math.ceil(player.queue.length / 10)
            
            for (let i = 0; i < pagesNumber; i++) {
                const str = tracks.slice(i * 10, i * 10 + 10).join('\n')
                const page = await this.client.utils.createMessageEmbed({
                    author: {
                        name: this.client.user!.username,
                        iconURL: this.client.user?.avatarURL() || undefined
                    },
                    color: 'Blue',
                    title: 'Queue Command',
                    description: `
                        **Now Playing:**\n[${currentTrack.info.title}](${currentTrack.info.uri || ''}) - \`${this.client.utils.formatDuration(currentTrack.info.length)}\` • ${currentTrack.info.requester}\n
                        ${str == '' ? ' Nothing' : '\n' + str}
                    `,
                    footer: {
                        text: `${pagesNumber > 0 ? `${i + 1} / ${pagesNumber}`: ''} • Total Duration ${queueDuration} • ${interaction.member!.user.username}`
                    }
                })
                if (!page) throw new Error('Unable to create page')
                pages.push(page)
            }
            
            const prevCustomId = `${interaction.channelId}_${interaction.id}_prevPage`
            const nextCustomId =`${interaction.channelId}_${interaction.id}_nextPage`
            const cancelCustomId =`${interaction.channelId}_${interaction.id}_cancel`

            const prevButton = this.createButton('Previous', ButtonStyle.Secondary, prevCustomId)
            const nextButton = this.createButton('Next', ButtonStyle.Secondary, nextCustomId)
            const cancelButton = this.createButton('Cancel', ButtonStyle.Secondary, cancelCustomId)
            

            const buttonRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(prevButton, nextButton, cancelButton)

            const moreThanOne = pagesNumber > 1

            await interaction.reply({ embeds: [pages[0]], components: moreThanOne ? [buttonRow] : undefined })

            if (!moreThanOne) return

            this.collector = interaction.channel!.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (i) => [prevCustomId, nextCustomId, cancelCustomId].includes(i.customId),
                max: 1,
                time: 1000 * 60 * 15
            })

            await this.followUp(interaction, pages, 0)
            
        } catch (error: any) {
            console.log('There was an error in Queue command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }

    }

    followUp = async (prevInteraction: ChatInputCommandInteraction, pages: EmbedBuilder[], currentPage: number) => {
        try {
            const collector = this.collector!

            collector.on('collect', async (interaction: ButtonInteraction) => {

                await interaction.deferUpdate()
                    
                const type = interaction.customId.split('_')[2]
                let pageNumber: number = 0
          
                const prevCustomId = `${prevInteraction.channelId}_${prevInteraction.id}_prevPage`
                const nextCustomId = `${prevInteraction.channelId}_${prevInteraction.id}_nextPage`
                const cancelCustomId =`${interaction.channelId}_${interaction.id}_cancel`
    
                const prevButton = this.createButton('Previous', ButtonStyle.Secondary, prevCustomId)
                const nextButton = this.createButton('Next', ButtonStyle.Secondary, nextCustomId)
                const cancelButton = this.createButton('Cancel', ButtonStyle.Secondary, cancelCustomId)
          
                const buttonRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(prevButton, nextButton, cancelButton)
                    
                switch (type) {
                    case 'prevPage': {
                        pageNumber = currentPage === 0 ? pages.length - 1 : currentPage - 1
                        await prevInteraction.editReply({ embeds: [pages[pageNumber]], components: [buttonRow] })

                        break
                    }
                    case 'nextPage': {
                        pageNumber = currentPage === pages.length - 1 ? 0 : currentPage + 1
                        await prevInteraction.editReply({ embeds: [pages[pageNumber]], components: [buttonRow] })

                        break
                    }
                    case 'cancel': break
                    default: throw new Error('Invalid button type')
                }
                
                this.collector = interaction.channel!.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    filter: (i) => [prevCustomId, nextCustomId, cancelCustomId].includes(i.customId),
                    time: 1000 * 60 * 15, 
                    max: 1
                })

                await this.followUp(prevInteraction, pages, pageNumber)
            })

            collector.on('end', async (collection, reason) => {
                this.collector = undefined

                const interaction = collection.first() as ButtonInteraction
                if (interaction && reason === 'cancel') await interaction.editReply({ components: [] })
            })


        } catch (error: any) {
        }
    }
    
    createButton = (label: string, style: ButtonStyle, customId: string) => new ButtonBuilder({label,style,customId})
}