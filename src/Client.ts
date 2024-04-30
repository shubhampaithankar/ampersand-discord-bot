import { Client, Collection } from 'discord.js'
import { REST } from '@discordjs/rest'
import mongoose from 'mongoose'
import Loader from './Loader'
import { MainCommand, MainEvent, MainInteraction } from './Classes'
import { InteractionTypes } from './Types'

export default class BaseClient extends Client {
    interactions: Collection<string, MainInteraction>
    commands: Collection<string, MainCommand>
    aliases: Collection<string, MainCommand>
    events: Collection<string, MainEvent>
    
    database: mongoose.mongo.Db | null = null
    loader = new Loader(this)
    rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!)

    followUps: Collection<string, InteractionTypes>
    jtcChannels: Collection<string, Set<string>>

    constructor () {
        super({
            intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'GuildMessageReactions','GuildVoiceStates', 'MessageContent', 'DirectMessageTyping', 'DirectMessageReactions'],
        })
        this.interactions = new Collection()
        this.commands = new Collection()
        this.aliases = new Collection()
        this.events = new Collection()

        this.followUps = new Collection()
        this.jtcChannels = new Collection()
    }

    async initialize () {
        try {
            await super.login(process.env.DISCORD_TOKEN)

            await this.loader.init()

            console.log(`Bot Online: ${this.user?.tag}`)
            // console.log(`Loaded ${this.client.commands.size} Command(s)`)
            console.log(`Loaded ${this.interactions.size} Interaction(s)`)
            console.log(`Loaded ${this.events.size} Event(s)`)
        } catch (error) {
            console.log(error)
        }
    }
}