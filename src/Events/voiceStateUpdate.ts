import { ChannelType, VoiceChannel, VoiceState } from 'discord.js'
import { MainEvent } from '../Classes'
import Client from '../Client'
import { getJTC } from '../Database/databaseUtils'

export default class VoiceStateUpdateEvent extends MainEvent {
    constructor (client: Client) {
        super(client, 'voiceStateUpdate', {
            once: false
        })
    }
    async run(oldState: VoiceState, newState: VoiceState) {
        try {
            if (newState.member?.guild === null) return
        } catch (error) {
            return
        }
        const { guild } = newState.member! || oldState.member!
        /** JOIN TO CREATE SYSTEM */
        try {
            const jtcData = await getJTC(guild)
            if (!jtcData) return // Check if guild has JTC data, if not return
            if (!jtcData.enabled) return // Check if JTC is enabled
            
            const guildJtc = this.client.jtcChannels.get(guild.id)
            if (oldState.channelId === jtcData.channelId) return // No action on leaving jtc channel

            // On joining the JTC channel
            if (newState.channelId === jtcData.channelId) {

                const jtcChannel = guild.channels.cache.get(jtcData.channelId) as VoiceChannel
                if (!jtcChannel) return

                let channel: VoiceChannel

                if (jtcChannel.parent) {
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
                        if (channel && newState.member) {
                            if (guildJtc) {
                                await newState.member.voice.setChannel(channel)
                                guildJtc.add(channel.id)
                                this.client.jtcChannels.set(guild.id, guildJtc)
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

            // On leaving channel created by jtc module
            if (oldState.channelId && guildJtc && guildJtc.has(oldState.channelId)) {
                try {            
                    const channel = guild.channels.cache.get(oldState.channelId) as VoiceChannel
                    if (channel && channel.members.size === 0) {
                        setTimeout(async () => {
                            await channel.delete()
                            if (guildJtc.has(channel.id)) {
                                guildJtc.delete(channel.id)
                                this.client.jtcChannels.set(guild.id, guildJtc)
                            }
                        }, 200)
                    }
                } catch (error) {
                    console.log(error)
                    return
                }
            }
        } catch (error) {
            console.log(error)
        }
    }
}