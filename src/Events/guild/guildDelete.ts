import { Guild } from 'discord.js'
import { MainEvent } from '../../Classes'
import Client from '../../Client'
import { addGuildData, getGuildData, updateGuildData } from '../../Database/databaseUtils'

// Emitted whenever a guild kicks the client or the guild is deleted/left.
export default class GuildDeleteEvent extends MainEvent {
    constructor (client: Client) {
        super(client, 'guildDelete')
    }
    async run(guild: Guild) {
        try {
            const guildData = await getGuildData(guild)
            if (guildData) {
                guildData.isDeleted = true 
                await updateGuildData(guild, guildData)
            }
        } catch (error) {
            console.log(error)
        }

    }
}