import { Guild, VoiceChannel } from 'discord.js'
import { guildSchema, jtcSchema } from './Schemas'

export const getGuildData = async (guild: Guild) => {
    try {
        const data = await guildSchema.findOne({ id: guild.id })
        return data?.toObject() || null
    } catch (error) {
        console.log('Database Error: while finding guild data:\n', error)
    }
}

export const addGuildData = async (guild: Guild) => {
    try {
        const isGuildPresent = await getGuildData(guild)
        if (!isGuildPresent) {
            const guildData = await guildSchema.create({
                id: guild.id,
                isDeleted: false,
                joinedAt: Date.now(),
                name: guild.name,
                ownerId: guild.ownerId
            })
    
            await guildData.save()
        }
    } catch (error) {
        console.log('Database Error: while adding guild data:\n', error)
    }

}

export const updateGuildData = async (guild: Guild, data: any) => {
    try {
        await guildSchema.findOneAndUpdate({
            id: guild.id
        }, data)
    } catch (error) {
        console.log('Database Error: while updating guild data:\n', error)
    }
}

export const getJTC = async (guild: Guild) => {
    try {
        const data = await jtcSchema.findOne({ guildId: guild.id })
        return data?.toObject() || null
    } catch (error) {
        console.log('Database Error: while finding JTC data:\n', error)
    }
}

export const updateJTC = async (channel: VoiceChannel, value: boolean) => {
    try {
        await jtcSchema.findOneAndUpdate({
            guildId: channel.guildId,
        }, {
            channelId: channel.id,
            enabled: value
        }, {
            upsert: true
        })
    } catch (error) {
        console.log('Database Error: while updating JTC data:\n', error)
    }
}
