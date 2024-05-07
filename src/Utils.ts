import { EmbedBuilder } from 'discord.js'
import { capitalize } from 'lodash'
import BaseClient from './Client'
import { EmbedDataType, InteractionTypes } from './Types'

export default class Utils {
    client: BaseClient
    constructor (client: BaseClient) {
        this.client = client
    }

    createInteractionCollector = async (interaction: InteractionTypes, componentType: any, max: number, customId: string) => {
        try {
            const collector = interaction.channel?.createMessageComponentCollector({
                filter: i => i.customId === customId,
                componentType,
                max,
            })

            return new Promise((resolve, reject) => {
                if (!collector) {
                    console.error('Collector could not be created.')
                    return null
                }
    
                collector.on('collect', (collected: InteractionTypes) => {
                    resolve(collected)
                })
    
                collector.on('error', (error) => {
                    reject(error)
                })

                collector.on('end', () => {})
            })
        } catch (error) {
            console.error('Error in interaction collector:', error)
            return null
        }
    }

    createMessageEmbed = async (data: EmbedDataType) => {
        const embed = new EmbedBuilder()

        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                switch (key) {
                case 'author':
                    embed.setAuthor(data['author'])
                    break
                case 'title':
                    embed.setTitle(data['title']!)
                    break
                case 'description':
                    embed.setDescription(data['description']!)
                    break
                case 'color':
                    embed.setColor(data['color']!)
                    break
                case 'thumbnail':
                    embed.setThumbnail(data['thumbnail']!)
                    break
                case 'image':
                    embed.setImage(data['image']!)
                    break
                case 'footer':
                    embed.setFooter(data['footer']!)
                    break
                case 'fields':
                    embed.addFields(data['fields']!)
                    break
                case 'timestamp':
                    embed.setTimestamp(data['timestamp'])
                    break
                case 'url':
                    embed.setURL(data['url']!)
                    break
                default:
                    // console.warn(`Unknown property: ${key}`)
                }
            }
        })
    
        return embed
    }
      
    capitalizeString = (s: string) => s && s.length > 0 ? capitalize(s) : ''
}