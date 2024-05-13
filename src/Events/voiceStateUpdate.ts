import { ChannelType, Events, Guild, TextChannel, VoiceChannel, VoiceState } from 'discord.js'
import { MainEvent } from '../Classes'
import Client from '../Client'
import { getJTC, getJTCChannel, updateJTCChannels } from '../Database/databaseUtils'
import BaseClient from '../Client'

export default class VoiceStateUpdateEvent extends MainEvent {
    constructor (client: Client) {
        super(client, Events.VoiceStateUpdate)
    }
    async run(oldState: VoiceState, newState: VoiceState) {
        if (newState.member?.guild === null) return
        const { guild } = newState.member! || oldState.member!
        
        handleJTC(this.client, guild, oldState, newState)
    }
}

/** JOIN TO CREATE SYSTEM */
const handleJTC = async (client: BaseClient, guild: Guild, oldState: VoiceState, newState: VoiceState) => {
    try {
        const bot = guild.members.cache.get(client.user!.id!)
        if (!bot) return

        const { isAllowed } = await client.utils.checkPermissions(bot, ['ManageChannels', 'ManageRoles', 'MoveMembers'], guild, true)
        if (!isAllowed) return

        const jtcData = await getJTC(guild)
        if (!jtcData || !jtcData.enabled) return // Check if JTC is enabled
        
        if (oldState.channelId === jtcData.channelId) return // No action on leaving jtc channel
        
        const guildJtc = client.jtcChannels.get(guild.id)
        
        // On joining the JTC channel
        try {
            if (newState.channelId === jtcData.channelId) {

                const jtcChannel = guild.channels.cache.get(jtcData.channelId) as VoiceChannel
                const { isAllowed: isJTCChannelAllowed } = await client.utils.checkPermissions(bot, 'ViewChannel', guild, true, jtcChannel)

                if (!jtcChannel || !isJTCChannelAllowed) return

                let channel: VoiceChannel
                
                if (jtcChannel.parent) {
                    
                    const { isAllowed: isParentAllowed } = await client.utils.checkPermissions(bot, 'ViewChannel', guild, true, jtcChannel.parent)
                    if (!isParentAllowed) return

                    channel = await jtcChannel.parent.children.create({
                        name: `${newState.member?.user.displayName}\`s Channel`,
                        type: ChannelType.GuildVoice
                    })
                } else {
                    channel = await guild.channels.create({
                        name: `${newState.member?.user.displayName}\`s Channel`,
                        type: ChannelType.GuildVoice
                    })
                }

                // Lock channel to prevent spam
                await jtcChannel.permissionOverwrites.edit(guild.roles.everyone, {
                    Connect: false
                })
  
                setTimeout(async () => {
                    try {
                        if (channel && newState.member && newState.member.voice) {
                            try {
                                await newState.member.voice.setChannel(channel)
                                await updateJTCChannels(channel, true)

                                if (!guildJtc) client.jtcChannels.set(guild.id, new Set([channel.id]))
                                else {
                                    guildJtc.add(channel.id)
                                    client.jtcChannels.set(guild.id, guildJtc)
                                }

                            } catch (err) {
                                console.log(err)
                            }
                        }
                    } catch (error) {
                        console.log(error)
                        return
                    }
                }, 200)

                setTimeout(async () => {
                    try {
                        if (!jtcChannel) return 
                        await jtcChannel.permissionOverwrites.edit(guild.roles.everyone, {
                            Connect: null
                        })
                    } catch (error) {
                        console.log(error)
                        return
                    }
                }, 5e3)
            }
        } catch (error) { console.log(error) }

        // On leaving channel created by jtc module
        try {
            if (oldState && oldState.channel) {
                const jtcChannel = await getJTCChannel(oldState.channel)
                const isJTCChannel = (guildJtc?.has(oldState.channel.id) || !!jtcChannel) 
                
                if (isJTCChannel) {
                    try {            
                        const channel = guild.channels.cache.get(oldState.channel.id) as VoiceChannel
                        if (channel && channel.members.size === 0) {
                            try {
                                await channel.delete()
                                if (jtcChannel) await updateJTCChannels(channel, false)
                                if (guildJtc?.has(channel.id)) {
                                    guildJtc?.delete(channel.id)
                                    client.jtcChannels.set(guild.id, guildJtc)
                                } 
                            } catch (err) {
                                console.log(err)
                            }
                        }
                    } catch (error) {
                        console.log(error)
                        return
                    }
                }
            }
        } catch (error) { console.log(error) }

    } catch (error) { console.log(error) }
}