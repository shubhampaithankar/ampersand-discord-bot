import Client from '../../Client'
import { MainEvent } from '../../Classes'
import { InteractionTypes } from '../../Types'
import { Events } from 'discord.js'

export default class InteractionCreate extends MainEvent {
    constructor (client: Client) {
        super(client, Events.InteractionCreate)
    }
    async run(baseInteraction: InteractionTypes) {
        try {

            const commandName: string | null = baseInteraction.message?.interaction?.commandName || baseInteraction.commandName || null
            if (!commandName) return
            
            const interaction = this.client.interactions.get(commandName)
            if (!interaction) return 

            if (interaction.permissions && !baseInteraction.memberPermissions?.has(interaction.permissions)) {
                interaction.reject(baseInteraction, `You do not have the required permissions: ${interaction.permissions.toString()} to use this command.`)
                return
            }

            if (!baseInteraction.customId) interaction.run(baseInteraction)

            // const customId = `${baseInteraction.channelId}_${baseInteraction.id}`
            // if (baseInteraction.customId && baseInteraction.customId === customId) {
            //     console.log(baseInteraction.customId)
            //     interaction.followUp(baseInteraction)
            //     return
            // }

        } catch (error) {
            console.log(error)
        }
    }
}