import { Client, Collection } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Manager } from 'erela.js'
import mongoose from 'mongoose'

import { MainCommand, MainEvent, MainInteraction, MainMusicEvent } from './Classes'
import Loader from './Loader'
import Utils from './Utils'

export default class BaseClient extends Client {
    interactions: Collection<string, MainInteraction>
    commands: Collection<string, MainCommand>
    aliases: Collection<string, MainCommand>
    events: Collection<string, MainEvent>
    musicEvents: Collection<string, MainMusicEvent>
    
    
    database: mongoose.mongo.Db | null = null
    manager: Manager | null = null

    loader = new Loader(this)
    utils = new Utils(this)

    rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!) 
    
    jtcChannels: Collection<string, Set<string>>

    constructor () {
        super({
            intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'GuildMessageReactions','GuildVoiceStates', 'MessageContent', 'DirectMessageTyping', 'DirectMessageReactions'],
        })
        this.interactions = new Collection()
        this.commands = new Collection()
        this.aliases = new Collection()
        this.events = new Collection()
        this.musicEvents = new Collection()
        this.jtcChannels = new Collection()
    }

    async initialize () {
        try {
            await super.login(process.env.DISCORD_TOKEN)
            await this.loader.init()
            
            console.log(`Bot Online: ${this.user?.tag}`)
        } catch (error) {
            console.log(error)
        }
    }
}