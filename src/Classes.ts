import Client from './Client'
import { ApplicationCommandDataResolvable, GuildMember, InteractionCollector, PermissionResolvable, ShardingManager } from 'discord.js'
import { InteractionConfig } from './Types'
import { Poru } from 'poru'

export class MainInteraction {
    client: Client
    type: number
    enabled?: boolean
    aliases?: string[]
    category?: string
    cooldown?: number
    collector?: InteractionCollector<any>
    permissions?: PermissionResolvable
    bot?: GuildMember
    data: ApplicationCommandDataResolvable

    constructor(client: Client, config: InteractionConfig) {
        this.client = client
        this.type = config.type
        this.enabled = config.enabled || true
        this.category = config.category || ''
        this.aliases = config.aliases || []
        this.cooldown = config.cooldown
        this.collector = config.collector
        this.permissions = config.permissions
        this.data = config.data
    }

    async run(interaction: any, ...args: string[]) {
        try {
            throw new Error(`Interaction ${this.data} doesn't provide a run method!`)
        } catch (error: unknown) {
            const message = this.client.utils.getError(error)
            console.log(`There was an error in ${this.data} followUp: `, error)
            await interaction.editReply({
                content: `There was an error \`${message}\``,
                components: []
            }) 
            return
        }
    }

    async followUp(prevInteraction: any, ...args: any[]): Promise<any> {
        try {
            const collector = this.collector!
            collector.on('collect', (interaction: any) => {

            })
        } catch (error: unknown) {
            const message = this.client.utils.getError(error)
            console.log(`There was an error in ${this.data} followUp: `, error)
            await prevInteraction.editReply({
                content: `There was an error \`${message}\``,
                components: []
            }) 
            return
        }
    }

    async reject({ interaction, message }: any) {
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