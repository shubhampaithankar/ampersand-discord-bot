import { Guild } from 'discord.js'
import { MainEvent } from '../../Classes'
import Client from '../../Client'
import { addGuildData } from '../../database/databaseUtils'

// Emitted whenever the client joins a guild.
export default class GuildCreateEvent extends MainEvent {
    constructor (client: Client) {
        super(client, 'guildCreate')
    }
    async run(guild: Guild) {
        try {
            await addGuildData(guild)
        } catch (error) {
            console.log(error)
        }
    }
}