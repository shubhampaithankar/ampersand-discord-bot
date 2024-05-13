import path from 'path'
import Client from './Client'
import mongoose from 'mongoose'
import { Guild, Routes, ShardingManager } from 'discord.js'
import { readdirSync, lstatSync } from 'fs'
import { Poru } from 'poru'

import { MainEvent, MainInteraction, MainShardEvent, MainMusicEvent } from './Classes'

export default class Loader {
    client: Client
    allowedFileExtensions = '.ts,.js'.split(',')

    constructor (client: Client) {
        this.client = client
    }

    init = async () => {
        try {
            await this.initJTC()

            await this.connectToDB()
            console.log(`Connected to database: ${this.client.database?.databaseName}`)

            await this.loadMusic()

            await this.loadEventHandler('./Events')
            console.log(`Loaded ${this.client.events.size} Event(s)`)

            await this.loadMusicEventHandler('./MusicEvents')
            console.log(`Loaded ${this.client.musicEvents.size} Music Event(s)`)

            // await this.loadShardEventHandler('./ShardEvents')
            // this.loadShardManager()
            
            await this.loadInteractionHandler('./Interactions')
            const interactions = await this.client.interactions.map(interaction => interaction.data)
            await this.client.rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
                body: interactions
            })
            console.log(`Loaded ${this.client.interactions.size} Interaction(s)`)

            // await this.loadCommandHandler('./Commands')
            
            await this.initJTC()


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
            const mongo = await mongoose.connect(process.env.MONGO_URL!)
            this.client.database = mongo.connection.db
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
                name: 'ampersand-discord-client',
            }], {
                library: 'discord.js',
                defaultPlatform: 'ytmsearch',
            })
        } catch (error) {
            console.log('There was en error loading Poru:\n',error)
        }
    }

    loadInteractionHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const intFile of files) {
                const stat = await lstatSync(path.join(filePath, intFile))
                if (stat.isDirectory()) await this.loadInteractionHandler(path.join(dir, intFile)) // Await recursive call
                if (this.allowedFileExtensions.some(ext => intFile.endsWith(ext))) {
                    const name = path.parse(intFile).name.toLowerCase()
                    const Interaction = await import(path.join(filePath, intFile))
                    if (Interaction.default?.prototype instanceof MainInteraction) {
                        const interaction = new Interaction.default(this.client, name) as MainInteraction
                        this.client.interactions.set(name, interaction)
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
                if (this.allowedFileExtensions.some(ext => eventFile.endsWith(ext))) {
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
                if (this.allowedFileExtensions.some(ext => eventFile.endsWith(ext))) {
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

    loadShardEventHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const eventFile of files) {
                const stat = await lstatSync(path.join(filePath, eventFile))
                if (stat.isDirectory()) await this.loadShardEventHandler(path.join(dir, eventFile))
                if (this.allowedFileExtensions.some(ext => eventFile.endsWith(ext))) {
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