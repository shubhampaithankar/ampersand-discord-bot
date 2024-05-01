import { MainInteraction } from './Classes'
import BaseClient from './Client'
import { InteractionTypes } from './Types'

export default class Utils {
    client: BaseClient
    constructor (client: BaseClient) {
        this.client = client
    }

    createInteractionCollector = async (interaction: InteractionTypes, componentType: any, max: number) => {
        try {
            const customId = `${interaction.channelId}_${interaction.id}`
            const collector = interaction.channel?.createMessageComponentCollector({
                filter: i => i.customId === customId,
                componentType,
                max,
            })

            return new Promise((resolve, reject) => {
                if (!collector) {
                    console.error('Collector could not be created.')
                    return null
                }
    
                collector.on('collect', (collected: InteractionTypes) => {
                    resolve(collected)
                })
    
                collector.on('error', (error) => {
                    reject(error)
                })
            })
        } catch (error) {
            console.error('Error in interaction collector:', error)
            return null
        }
    }
}