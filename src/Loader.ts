import Client from './Client'
import { Guild, Routes } from 'discord.js'
import mongoose from 'mongoose'
import { readdirSync, lstatSync } from 'fs'
import path from 'path'

import { MainCommand, MainEvent, MainInteraction } from './Classes'

export default class Loader {
    client: Client

    constructor (client: Client) {
        this.client = client
    }

    init = async () => {
        try {
            await this.connectToDB()
            console.log(`Connected to database: ${this.client.database?.databaseName}`)
    
            // await this.loadCommandHandler('./Commands')
    
            await this.loadInteractionHandler('./Interactions') 
            const interactions = await this.client.interactions.map(({ name, description, type }) => ({ name, description, type }))
            await this.client.rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
                body: interactions
            })
    
            await this.loadEventHandler('./Events')
            await this.initJTC()
        } catch (error) {
            console.log('Loader Error:\n', error)
        }
    }

    loadCommandHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const cmdFile of files) {
                const stat = await lstatSync(path.join(filePath, cmdFile))
                if (stat.isDirectory()) this.loadCommandHandler(path.join(dir, cmdFile))
                if (cmdFile.endsWith('.ts')) {
                    const { name } = path.parse(cmdFile)
                    const Command = await import(path.join(filePath, cmdFile))
                    if (Command.prototype instanceof MainCommand) {
                        const command = new Command(this.client, name)
                        this.client.commands.set(command.name.toLowerCase(), command)
                        if (command.aliases.length) {
                            command.aliases.forEach((alias: string) => {
                                this.client.aliases.set(alias, command.name.toLowerCase())
                            })
                        }
                    }
                }
            }   
        } catch (error) {
            console.log('There was en error loading commands:\n',error)
        }
    }

    loadInteractionHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const intFile of files) {
                const stat = await lstatSync(path.join(filePath, intFile))
                if (stat.isDirectory()) this.loadInteractionHandler(path.join(dir, intFile))
                if (intFile.endsWith('.ts')) {
                    const { name } = path.parse(intFile)
                    const Interaction = await import(path.join(filePath, intFile))
                    if (Interaction.default?.prototype instanceof MainInteraction) {
                        // const interaction = (({ name, type, description }) => ({ name, type, description }))(new Interaction.default(this.client, name)) as MainInteraction
                        const interaction = new Interaction.default(this.client, name) as MainInteraction
                        this.client.interactions.set(interaction.name.toLowerCase(), interaction)
                    }
                }
            }
        } catch (error) {
            console.log('There was en error loading interactions:\n',error)
        }
    }

    loadEventHandler = async (dir: string) => {
        try {
            const filePath = path.join(__dirname, dir)
            const files = await readdirSync(filePath)
            for (const eventFile of files) {
                const stat = await lstatSync(path.join(filePath, eventFile))
                if (stat.isDirectory()) this.loadEventHandler(path.join(dir, eventFile))
                if (eventFile.endsWith('.ts')) {
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

    connectToDB = async () => {
        try {
            const mongo = await mongoose.connect(process.env.MONGO_URL!)
            this.client.database = mongo.connection.db
        } catch (error) {
            console.log('There was en error while connecting to database:\n',error)
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
}