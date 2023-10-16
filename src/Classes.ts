import Client from './Client'
import { Interaction, Message } from 'discord.js'
import { InteractionConfig } from './Types'

export class BaseCommand {
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

export class BaseInteraction {
    client: Client
    name: string
    type: number
    description: string

    constructor(client: Client, name: string, config: InteractionConfig) {
        this.client = client
        this.name = config.name || name
        this.type = config.type
        this.description = config.description || 'No description provided.'
    }

    async run(interaction: Interaction, ...args: string[]) {
        throw new Error(`Interaction ${this.name} doesn't provide a run method!`)
    }

}

export class BaseEvent {
    client: Client
    name: string
    type: string
    emitter: Client
    constructor(client: Client, name: string, config: any = {}) {
        this.client = client
        this.name = name 
        this.type = config.once ? 'once' : 'on'
        this.emitter = this.client
    }
    async run(...args: any[]) {
        throw new Error(`The run method has not been implemented in ${this.name}`)
    }
}