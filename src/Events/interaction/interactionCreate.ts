import Client from '../../Client'
import { MainEvent } from '../../Classes'
import { InteractionTypes } from '../../Types'
import { musicSchema } from '../../Database/Schemas'
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

            if (!baseInteraction.customId) {
                const guild = baseInteraction.guild!
                switch (interaction.category) {
                case 'Music': {
                    const guildMusicData = await musicSchema.findOne({
                        guildId: guild.id
                    })
                    if (!guildMusicData || !guildMusicData.enabled) {
                        await interaction.reject(
                            interaction, 
                            `**Music Module* is \`Disabled\` for **${guild.name}**.\n Enable it by using the \`/setmusic\` command.`
                        )
                        return
                    }
                    const channel = guild.channels.cache.get(baseInteraction.channelId!)
                    if (!channel) return

                    if (!guildMusicData.channelIds.includes(channel.id)) {
                        await interaction.reject(
                            interaction, 
                            `**${channel.name}** is \`not present\` in music database for **${guild.name}**.\n Add it by using the \`/addmusicchannel\` command.`
                        )
                        return
                    }
                    break
                }
                    
                
                default: break
                }

                await interaction.run(baseInteraction)
                
            }

        } catch (error) {
            console.log(error)
        }
    }
}