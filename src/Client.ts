import { Client, Collection } from 'discord.js'
import { REST } from '@discordjs/rest'
import mongoose from 'mongoose'
import Loader from './Loader'

export default class BaseClient extends Client {
    interactions: Collection<any, any>
    commands: Collection<any, any>
    aliases: Collection<any, any>
    events: Collection<any, any>
    
    database: mongoose.mongo.Db | null = null
    loader = new Loader(this)
    rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!)

    constructor () {
        super(
            {
                intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'GuildMessageReactions','GuildVoiceStates', 'MessageContent', 'DirectMessageTyping', 'DirectMessageReactions'],
            }
        )
        this.interactions = new Collection()
        this.commands = new Collection()
        this.aliases = new Collection()
        this.events = new Collection()
    }

    async initialize () {
        super.login(process.env.DISCORD_TOKEN)
        await this.loader.init()
    }
}