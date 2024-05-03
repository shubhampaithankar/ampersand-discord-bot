import { MainInteraction } from './Classes'
import BaseClient from './Client'
import { InteractionTypes } from './Types'

export default class Utils {
    client: BaseClient
    constructor (client: BaseClient) {
        this.client = client
    }

    createInteractionCollector = async (interaction: InteractionTypes, componentType: any, max: number, customId: string) => {
        try {
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

                collector.on('end', () => {})
            })
        } catch (error) {
            console.error('Error in interaction collector:', error)
            return null
        }
    }

    getMusicPlayer = async (guild: string, voiceChannel?: string, textChannel?: string, create?: boolean) => {
        let player = this.client.music?.get(guild)

        if (!player && voiceChannel && textChannel && create) {
            player = await this.client.music?.create({
                guild,
                voiceChannel,
                textChannel,
                selfDeafen: true,
                volume: 10
            })
        }
        return player
    }
}