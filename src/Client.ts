import { Client, Collection, ShardingManager } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Poru } from 'poru'

import { MainEvent, MainInteraction, MainShardEvent, MainMusicEvent } from './Classes'
import Loader from './Loader'
import Utils from './Utils'
import { Connection } from 'mysql2/promise'

export default class BaseClient extends Client {
    interactions: Collection<string, MainInteraction>
    aliases: Collection<string, MainInteraction>
    cooldowns: Collection<string, Map<string, number>>
    events: Collection<string, MainEvent>
    shardEvents: Collection<string, MainShardEvent>
    musicEvents: Collection<string, MainMusicEvent>
    

    database: Connection | null = null
    // music: Manager | null = null
    music: Poru | null = null
    manager: ShardingManager | null = null

    loader = new Loader(this)
    utils = new Utils(this)

    rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!) 

    startTime: number
    
    jtcChannels: Collection<string, Set<string>>

    constructor () {
        super({
            intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'GuildMessageReactions','GuildVoiceStates', 'MessageContent', 'DirectMessageTyping', 'DirectMessageReactions'],
            shards: 'auto'
        })
        this.interactions = new Collection()
        this.aliases = new Collection()
        this.cooldowns = new Collection()
        this.events = new Collection()
        this.musicEvents = new Collection()
        this.shardEvents = new Collection()
        this.jtcChannels = new Collection()


        this.startTime = Date.now()
    }

    async initialize () {
        try {
            await this.loader.init()
            
            await super.login(process.env.DISCORD_TOKEN)
        } catch (error) {
            console.log(error)
        }
    }
}