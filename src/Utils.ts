import { ChannelType, ComponentType, EmbedBuilder, Guild, GuildBasedChannel, GuildMember, InteractionCollector, MessageComponentType, PermissionResolvable, TextChannel } from 'discord.js'
import { capitalize } from 'lodash'
import BaseClient from './Client'
import { EmbedDataType, InteractionTypes } from './Types'
import moment from 'moment'

export default class Utils {
    client: BaseClient
    constructor (client: BaseClient) {
        this.client = client
    }

    createInteractionCollector = async (interaction: InteractionTypes, customId: string | string[], componentType: MessageComponentType, endCallback?: () => unknown, max?: number, time?: number) => {
        try {
            let collector: InteractionCollector<any> | undefined
            if (typeof customId === 'string') {
                collector = interaction.channel?.createMessageComponentCollector({
                    filter: i => i.customId === customId && i.user.id === interaction.user.id,
                    componentType,
                    max,
                    time: time || 60 * 1e3
                })
            } else if (Array.isArray(customId)) {
                collector = interaction.channel?.createMessageComponentCollector({
                    filter: i => customId.includes(i.customId) && i.user.id === interaction.user.id,
                    componentType,
                    max,
                    time: time || 60 * 1e3
                })
            } 

            return new Promise((resolve, reject) => {
                if (!collector) {
                    console.error('Collector could not be created.')
                    return null
                }
    
                collector.on('collect', (collected: InteractionTypes) => resolve(collected))
    
                collector.on('error', (error) => reject(error))

                collector.on('end', typeof endCallback === 'function' ? endCallback : () => {})
            })
        } catch (error) {
            console.error('Error in interaction collector:', error)
            return null
        }
    }

    createMessageEmbed = async (data: EmbedDataType) => {
        try {
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
        } catch (error) {
            console.error('Error in creating message embed:', error)
            return null
        }
    }
      
    checkPermissionsFor = async (member: GuildMember, permissions: PermissionResolvable, guild: Guild, sendGeneral: boolean, channel?: GuildBasedChannel) => {
        let isAllowed: boolean = true
        let missingPermissions: string[] = []
        try {

            const general = guild.channels.cache.find(channel => channel.type === ChannelType.GuildText && channel.name.toLowerCase() === 'general') as TextChannel
            const isGeneralAllowed = sendGeneral && general ? general.permissionsFor(member).has(['ViewChannel', 'SendMessages'], true) : false
    
            if (channel) {
                const channelPermissions = channel.permissionsFor(member)
                const isChannelAllowed = channelPermissions.has(permissions, true)
                
                if (!isChannelAllowed) {
                    missingPermissions = channelPermissions.missing(permissions)
                    if (isGeneralAllowed) {
                        await general.send(this.getMissingPermsString(missingPermissions, member))
                    }
                    isAllowed = false
                }

            } else {
                if (!member.permissions.has(permissions, true)) {
                    missingPermissions = member.permissions.missing(permissions)
                    if (isGeneralAllowed) {
                        await general.send(this.getMissingPermsString(missingPermissions, member))
                    }
                    isAllowed = false
                }
            }

            return { isAllowed, missingPermissions }
            
        } catch (error) {
            console.log('Error in chekcing permissions:', error)
            return { isAllowed, missingPermissions }
        }
    }
    
    capitalizeString = (s: string) => s && s.length > 0 ? capitalize(s) : ''

    getMissingPermsString = (missingPermissions: string[], member: GuildMember) => `**Not enough permissions. Missing:** ${missingPermissions.map(perm => `\`${perm}\``).join(', ')} for <@${member.user.id}>`

    getMusicPlayer = async (guildId: string, voiceChannel?: string, textChannel?: string, create?: boolean) => {
        try {
            if (!guildId) return null

            let player = this.client.music?.get(guildId)
    
            if (!player && voiceChannel && textChannel && create) {
                player = this.client.music?.createConnection({
                    guildId,
                    voiceChannel,
                    textChannel,
                    deaf: true,
                })
            }
            return player
        } catch (error) {
            console.error('Error in getting music player:', error)
            return null
        }
    }

    formatDuration = (milliseconds: number) => {
        try {
            const duration = moment.duration(milliseconds)
    
            let formattedDuration = ''
            if (duration.hours() > 0) {
                formattedDuration += duration.hours().toString().padStart(2, '0') + ':'
            }
            formattedDuration += duration.minutes().toString().padStart(2, '0') + ':' + duration.seconds().toString().padStart(2, '0')
        
            return formattedDuration
        } catch (error) {
            console.error('Error in formatting duration:', error)
            return ''
        }
    }
}