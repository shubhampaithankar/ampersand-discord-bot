import path from 'path'
import Client from './Client'
import mongoose from 'mongoose'
import { createConnection } from 'mysql2/promise'

import { Guild, Routes, ShardingManager } from 'discord.js'
import { readdirSync, lstatSync } from 'fs'

import { Poru } from 'poru'
import { Spotify } from 'poru-spotify'

import { MainEvent, MainInteraction, MainShardEvent, MainMusicEvent } from './Classes'
import { initializeDatabase } from './Database/databaseUtils'

export default class Loader {
    client: Client
    fileExtention: string

    constructor (client: Client) {
        this.client = client
        this.fileExtention = process.env.NODE_ENV === 'DEV' ? '.ts' : '.js'
    }

    init = async () => {
        try {

            await this.connectToDB()
            console.log(`Connected to database: ${this.client.database?.config.database}`)
   
            await this.loadEventHandler('./Events')
            console.log(`Loaded ${this.client.events.size} Event(s)`)
            
            await this.loadMusic()
            if (this.client.music) await this.loadMusicEventHandler('./MusicEvents')
            console.log(`Loaded ${this.client.musicEvents.size} Music Event(s)`)

            // this.loadShardManager()
            // if (this.client.manager) await this.loadShardEventHandler('./ShardEvents')
            // console.log(`Loaded ${this.client.musicEvents.size} Sharding Event(s)`)
            
            await this.loadInteractionHandler('./Interactions')
            const interactions = await this.client.interactions.map(interaction => interaction.data)
            await this.client.rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
                body: interactions
            })
            console.log(`Loaded ${this.client.interactions.size} Interaction(s)`)

        } catch (error) {
            console.log('Loader Error:\n', error)
        }
    }

    initJTC = async () => {
        try {
            this.client.guilds.cache.forEach((guild: Guild) => {
                if (this.client.jtcChannels.has(guild.id)) return
                this.client.jtcChannels.set(guild.id, new Set([]))
            })
        } catch (error) {
            console.log(error)
        }
    }

    connectToDB = async () => {
        try {
            // todo: add mysql with mysql2 package connection to database
            const connection = await createConnection({
                host: process.env.DATABASE_HOST!, 
                user: process.env.DATABASE_USER!, 
                password: process.env.DATABASE_PASSWORD!, 
                database: process.env.DATABASE_NAME!,
                port: Number(process.env.DATABASE_PORT!),
            })
            this.client.database = connection
            initializeDatabase(this.client.database)
            // const mongo = await mongoose.connect(process.env.MONGO_URL!)
            // this.client.database = mongo.connection.db

        } catch (error) {
            console.log('There was en error while connecting to database:\n',error)
        }
    }

    loadMusic = async () => {
        try {
            this.client.music = new Poru(this.client, [{                
                host: `${process.env.LAVALINK_HOST!}`,
                port: Number(process.env.LAVALINK_PORT),
                password: `${process.env.LAVALINK_PASSWORD}`,
                secure: false,
                name: `${process.env.DISCORD_CLIENT_NAME}-discord-client`,
            }], {
                library: 'discord.js',
                defaultPlatform: 'ytsearch',
                plugins: [
                    // new Spotify({
                    //     clientID: `${process.env.SPOTIFY_CLIENT_ID}`,
                    //     clientSecret: `${process.env.SPOTIFY_CLIENT_SECRET}`,
                    // })
                ]
            })
        } catch (error) {
            console.log('There was en error loading Poru:\n',error)
        }
    }

    loadShardManager = async () => {
        try {
            this.client.manager = new ShardingManager('./Client.ts', {
                token: process.env.DISCORD_TOKEN!,
                respawn: true,
                totalShards: 'auto'
            })
        } catch (error) {
            console.log('There was en error loading sahrding manager:\n',error)    
        }
    }

    loadInteractionHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const intFile of files) {
                const stat = await lstatSync(path.join(filePath, intFile))
                if (stat.isDirectory()) await this.loadInteractionHandler(path.join(dir, intFile)) // Await recursive call
                if (intFile.endsWith(this.fileExtention)) {
                    const name = path.parse(intFile).name.toLowerCase()
                    const Interaction = await import(path.join(filePath, intFile))
                    if (Interaction.default?.prototype instanceof MainInteraction) {
                        const interaction = new Interaction.default(this.client, name) as MainInteraction
                        this.client.interactions.set(name, interaction)
                        interaction.aliases?.forEach(entry => this.client.aliases.set(entry, interaction))
                    }
                }
            }
        } catch (error) {
            console.log('There was an error loading interactions:\n', error)
        }
    }

    loadEventHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const eventFile of files) {
                const stat = await lstatSync(path.join(filePath, eventFile))
                if (stat.isDirectory()) await this.loadEventHandler(path.join(dir, eventFile))
                if (eventFile.endsWith(this.fileExtention)) {
                    const { name } = path.parse(eventFile)
                    const Event = await import(path.join(filePath, eventFile))
                    if (Event.default?.prototype instanceof MainEvent) {
                        const event = new Event.default(this.client, name)
                        event.emitter[event.type](name, (...args: any[]) => event.run(...args))
                        this.client.events.set(name, event)
                    }
                }
            }
        } catch (error) {
            console.log('There was en error loading events:\n',error)
        }
    }

    loadMusicEventHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const eventFile of files) {
                const stat = await lstatSync(path.join(filePath, eventFile))
                if (stat.isDirectory()) await this.loadMusicEventHandler(path.join(dir, eventFile))
                if (eventFile.endsWith(this.fileExtention)) {
                    const { name } = path.parse(eventFile)
                    const Event = await import(path.join(filePath, eventFile))
                    if (Event.default?.prototype instanceof MainMusicEvent) {
                        const event = new Event.default(this.client, name)
                        event.emitter[event.type](name, (...args: any[]) => event.run(...args))
                        this.client.musicEvents.set(name, event)
                    }
                }
            }
        } catch (error) {
            console.log('There was en error loading music events:\n',error)
        }
    }

    loadShardEventHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const eventFile of files) {
                const stat = await lstatSync(path.join(filePath, eventFile))
                if (stat.isDirectory()) await this.loadShardEventHandler(path.join(dir, eventFile))
                if (eventFile.endsWith(this.fileExtention)) {
                    const { name } = path.parse(eventFile)
                    const Event = await import(path.join(filePath, eventFile))
                    if (Event.default?.prototype instanceof MainShardEvent) {
                        const event = new Event.default(this.client, name)
                        event.emitter[event.type](name, (...args: any[]) => event.run(...args))
                        this.client.shardEvents.set(name, event)
                    }
                }
            }
        } catch (error) {
            console.log('There was en error loading events:\n',error)
        }
    }
}