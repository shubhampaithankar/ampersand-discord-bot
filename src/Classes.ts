import Client from './Client'
import { ApplicationCommandDataResolvable, ChatInputCommandInteraction, InteractionCollector, PermissionResolvable, ShardingManager, SlashCommandBuilder } from 'discord.js'
import { InteractionConfig, InteractionTypes } from './Types'
import { Poru } from 'poru'

export class MainInteraction {
    client: Client
    type: number
    aliases?: string[]
    category?: string
    cooldown?: number
    permissions?: PermissionResolvable
    data: ApplicationCommandDataResolvable
    // collector: InteractionCollector // remove followUp function and add collector here

    constructor(client: Client, config: InteractionConfig) {
        this.client = client
        this.type = config.type
        this.category = config.category || ''
        this.aliases = config.aliases || []
        this.cooldown = config.cooldown
        this.permissions = config.permissions
        this.data = config.data
    }

    async run(interaction: InteractionTypes, ...args: string[]) {
        try {
            throw new Error(`Interaction ${this.data} doesn't provide a run method!`)
        } catch (error) {
            console.log(error)
        }
    }

    async followUp(interaction: any, prevInteraction?: InteractionTypes, ...args: any[]) {
        try {
            throw new Error(`Interaction ${this.data} doesn't provide a run method!`)
        } catch (error) {
            console.log(error)
        }
    }

    async reject(interaction: any, message: string) {
        try {
            await interaction.reply(message)
        } catch (error) {
            console.log(error)
        }
    }

}

export class MainEvent {
    client: Client
    name: string
    type: string
    emitter: Client
    constructor(client: Client, name: string, config: any = {}) {
        this.client = client
        this.name = name 
        this.type = (config && config.once) ? 'once' : 'on'
        this.emitter = this.client
    }
    async run(...args: any[]) {
        try {
            throw new Error(`The run method has not been implemented in ${this.name}`)
        } catch (error) {
            console.log(error)
        }
    }
}

export class MainShardEvent {
    client: Client
    name: string
    type: string
    emitter: ShardingManager | null
    constructor(client: Client, name: string, config: any = {}) {
        this.client = client
        this.name = name 
        this.type = (config && config.once) ? 'once' : 'on'
        this.emitter = this.client.manager
    }
    async run(...args: any[]) {
        try {
            throw new Error(`The run method has not been implemented in ${this.name}`)
        } catch (error) {
            console.log(error)
        } 
    }
}

export class MainMusicEvent {
    client: Client
    name: string
    type: string
    emitter: Poru | null
    constructor(client: Client, name: string, config: any = {}) {
        this.client = client
        this.name = name 
        this.type = (config && config.once) ? 'once' : 'on'
        this.emitter = client.music || null
    }
    async run(...args: any[]) {
        try {
            throw new Error(`The run method has not been implemented in ${this.name}`)
        } catch (error) {
            console.log(error)
        }
    }
}