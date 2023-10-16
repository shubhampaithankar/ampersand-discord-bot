import { Guild } from 'discord.js'
import { BaseEvent } from '../../Classes'
import Client from '../../Client'
import { addGuildData } from '../../Database/databaseUtils'

// Emitted whenever the client joins a guild.
export default class GuildCreateEvent extends BaseEvent {
    constructor (client: Client) {
        super(client, 'guildCreate')
    }
    async run(guild: Guild) {
        await addGuildData(guild)
    }
}