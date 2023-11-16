import Client from '../../Client'
import { MainEvent } from '../../Classes'
import { InteractionTypes } from '../../Types'

export default class InteractionCreate extends MainEvent {
    constructor (client: Client) {
        super(client, 'interactionCreate')
    }
    async run(baseInteraction: InteractionTypes) {
        const commandName: string | null = baseInteraction.message?.interaction?.commandName || baseInteraction.commandName || null
        if (!commandName) return
        
        const interaction = this.client.interactions.get(commandName)
        if (interaction) {
            if (baseInteraction.customId && baseInteraction.customId !== '') {
                if (baseInteraction.customId.startsWith('followUp_')) {
                    interaction.followUp(baseInteraction)
                }
            } else {
                if (interaction.permissions && interaction.permissions !== baseInteraction.member?.permissions) {
                    interaction.reject(baseInteraction,'You do not have the required permissions to use this command.')
                } else {
                    interaction.run(baseInteraction)
                }
            }
        }
    }
}