import { Events, Guild } from 'discord.js'
import { MainEvent } from '../../Classes'
import Client from '../../Client'
import { addGuildData } from '../../Database/databaseUtils'

// Emitted whenever the client joins a guild.
export default class GuildCreateEvent extends MainEvent {
    constructor (client: Client) {
        super(client, Events.GuildCreate)
    }
    async run(guild: Guild) {
        try {
            await addGuildData(guild)
        } catch (error) {
            console.log(error)
        }
    }
}