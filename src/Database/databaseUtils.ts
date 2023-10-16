import { Guild } from 'discord.js'
import { guildSchema } from '../Database/Schemas/'

export const getGuildData = async (guild: Guild) => {
    try {
        const data = await guildSchema.findById(guild.id)
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
                joinedAt: Date.now,
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