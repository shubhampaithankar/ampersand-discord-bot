import { Client, Collection, ShardingManager } from 'discord.js'
import { REST } from '@discordjs/rest'
import mongoose from 'mongoose'

import { MainEvent, MainInteraction, MainShardEvent } from './Classes'
import Loader from './Loader'
import Utils from './Utils'

export default class BaseClient extends Client {
    interactions: Collection<string, MainInteraction>
    events: Collection<string, MainEvent>
    shardEvents: Collection<string, MainShardEvent>
    
    database: mongoose.mongo.Db | null = null
    manager: ShardingManager | null = null

    loader = new Loader(this)
    utils = new Utils(this)

    rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!) 
    
    jtcChannels: Collection<string, Set<string>>

    constructor () {
        super({
            intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'GuildMessageReactions','GuildVoiceStates', 'MessageContent', 'DirectMessageTyping', 'DirectMessageReactions'],
            shards: 'auto'
        })
        this.interactions = new Collection()
        this.events = new Collection()
        this.shardEvents = new Collection()
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