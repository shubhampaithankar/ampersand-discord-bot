import { Guild, TextChannel, VoiceBasedChannel, VoiceChannel } from 'discord.js'
import { guildSchema, jtcChannelsSchema, jtcSchema, lockdownSchema, musicSchema } from './Schemas'

import { Connection } from 'mysql2/promise'

export const getGuildData = async (guild: Guild) => {
    try {
        const data = await guildSchema.findOne({ id: guild.id })
        return data?.toObject() || null
    } catch (error) {
        console.log('Database Error: while finding guild data:\n', error)
        return null
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
        return null
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

export const getJTCChannel = async (channel: VoiceBasedChannel) => {
    try {
        const data = await jtcChannelsSchema.findOne({ 
            guildId: channel.guild.id,
            channelId: { $in: [channel.id] }
        })
        return data?.toObject() || null
    } catch (error) {
        console.log('Database Error: while finding music data:\n', error)
        return null
    }
}

export const updateJTCChannels = async (channel: VoiceChannel, add: boolean) => {
    try {
        const query = { guildId: channel.guildId }
        const update = add
            ? { $push: { channelId: channel.id } }
            : { $pull: { channelId: channel.id } }
    
        await jtcChannelsSchema.findOneAndUpdate(query, update, { upsert: true })
    } catch (error) {
        console.log('Database Error: while updating JTC channels data:\n', error)
    }
}

export const getMusic = async (guild: Guild) => {
    try {
        const data = await musicSchema.findOne({ guildId: guild.id })
        return data?.toObject() || null
    } catch (error) {
        console.log('Database Error: while finding music data:\n', error)
        return null
    }
}

export const updateMusic = async (value: boolean, guildId: string, channel?: TextChannel, remove?: boolean) => {
    try {
        if (channel) {
            await musicSchema.findOneAndUpdate({
                guildId: guildId,
            }, {
                $addToSet: {
                    channelIds: channel.id
                },
                enabled: value
            }, {
                upsert: true
            })
        } else {
            await musicSchema.findOneAndUpdate({
                guildId: guildId,
            }, {
                enabled: value
            }, {
                upsert: true
            })
        }
    } catch (error) {
        console.log('Database Error: while updating music data:\n', error)
    }
}

export const getLockdown = async (guild: Guild) => {
    try {
        const data = await lockdownSchema.findOne({ guildId: guild.id })
        return data?.toObject() || null
    } catch (error) {
        console.log('Database Error: while finding lockdown data:\n', error)
        return null
    }
}

export const updateLockdown = async (guild: Guild, value: boolean, originalPermissions?: any) => {
    try {

        await lockdownSchema.findOneAndUpdate({
            guildId: guild.id,
        }, {
            enabled: value,
            originalPermissions
        }, {
            upsert: true
        })
    } catch (error) {
        console.log('Database Error: while updating lockdown data:\n', error)
    }
}

export const initializeDatabase = async (connection: Connection) => {
    const createGuildsTable = `
      CREATE TABLE IF NOT EXISTS guilds (
        id VARCHAR(255) PRIMARY KEY,
        isDeleted BOOLEAN,
        joinedAt BIGINT,
        name VARCHAR(255),
        ownerId VARCHAR(255)
      );
    `
  
    const createJTCTable = `
      CREATE TABLE IF NOT EXISTS jtc (
        guildId VARCHAR(255),
        channelId VARCHAR(255),
        enabled BOOLEAN,
        PRIMARY KEY (guildId, channelId)
      );
    `
  
    const createJTCChannelsTable = `
      CREATE TABLE IF NOT EXISTS jtc_channels (
        guildId VARCHAR(255),
        channelIds VARCHAR(255)
      );
    `
  
    const createMusicTable = `
      CREATE TABLE IF NOT EXISTS music (
        guildId VARCHAR(255),
        channelIds VARCHAR(255),
        enabled BOOLEAN,
        PRIMARY KEY (guildId)
      );
    `
  
    const createLockdownTable = `
      CREATE TABLE IF NOT EXISTS lockdown (
        guildId VARCHAR(255),
        enabled BOOLEAN,
        originalPermissions JSON,
        PRIMARY KEY (guildId)
      );
    `
  
    try {
        await connection.query(createGuildsTable)
        await connection.query(createJTCTable)
        await connection.query(createJTCChannelsTable)
        await connection.query(createMusicTable)
        await connection.query(createLockdownTable)

        // console.log('Tables created successfully!')
    } catch (error) {
        console.error('Error creating tables:', error)
    }
}
