import { Client, Collection, ShardingManager } from 'discord.js'
import { REST } from '@discordjs/rest'
// import { Manager } from 'erela.js'
import { Poru } from 'poru'
import mongoose from 'mongoose'

import { MainEvent, MainInteraction, MainShardEvent, MainMusicEvent } from './Classes'
import Loader from './Loader'
import Utils from './Utils'

export default class BaseClient extends Client {
    interactions: Collection<string, MainInteraction>
    events: Collection<string, MainEvent>
    shardEvents: Collection<string, MainShardEvent>
    musicEvents: Collection<string, MainMusicEvent>
    
    database: mongoose.mongo.Db | null = null
    // music: Manager | null = null
    music: Poru | null = null
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
        this.musicEvents = new Collection()
        this.shardEvents = new Collection()
        this.jtcChannels = new Collection()
    }

    async initialize () {
        try {
            await super.login(process.env.DISCORD_TOKEN)

            super.once('ready', async () => {
                console.log(`Bot Online: ${this.user?.tag}`)

                await this.loader.init()

                if (this.music) this.music.init(this)
            })

        } catch (error) {
            console.log(error)
        }
    }
}