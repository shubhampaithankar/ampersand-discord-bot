import Client from './Client'
import { Message, PermissionResolvable } from 'discord.js'
import { InteractionConfig, InteractionTypes } from './Types'
import { Manager } from 'erela.js'

export class MainCommand {
    client: Client
    name: any
    aliases: any
    cooldown: number
    description: any
    module: any
    usage: any

    constructor(client: Client, name: string, config: any = {}) {
        this.client = client
        this.name = config.name || name
        this.aliases = config.aliases || []
        this.cooldown = 3
        this.description = config.description || 'No description provided.'
        this.module = config.module || 'Miscellaneous'
        this.usage = config.usage || 'No usage provided.'
    }

    async run(message: Message, args: string[]) {
        throw new Error(`Command ${this.name} doesn't provide a run method!`)
    }

}

export class MainInteraction {
    client: Client
    name: string
    type: number
    description?: string
    permissions?: PermissionResolvable

    constructor(client: Client, name: string, config: InteractionConfig) {
        this.client = client
        this.name = config.name || name
        this.type = config.type
        this.description = config.description
        this.permissions = config.permissions
    }

    async run(interaction: InteractionTypes, ...args: string[]) {
        try {
            throw new Error(`Interaction ${this.name} doesn't provide a run method!`)
        } catch (error) {}
    }

    async followUp(interaction: any, ...args: string[]) {
        try {
            throw new Error(`Interaction ${this.name} doesn't provide a run method!`)
        } catch (error) {}
    }

    async reject(interaction: any, message: string) {
        try {
            await interaction.reply(message)
        } catch (error) {}
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
        throw new Error(`The run method has not been implemented in ${this.name}`)
    }
}

export class MainMusicEvent {
    client: Client
    name: string
    type: string
    emitter: Manager | null
    constructor(client: Client, name: string, config: any = {}) {
        this.client = client
        this.name = name 
        this.type = (config && config.once) ? 'once' : 'on'
        this.emitter = client.music || null
    }
    async run(...args: any[]) {
        throw new Error(`The run method has not been implemented in ${this.name}`)
    }
}