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

            if (!baseInteraction.inGuild()) return
            const guild = baseInteraction.guild!

            // const bot = guild.members.cache.get(this.client.user!.id!)
            // if (!bot) return

            const member = guild.members.cache.get(baseInteraction.member.user.id)
            if (!member) return

            const commandName: string | null = baseInteraction.message?.interaction?.commandName || baseInteraction.commandName || null
            if (!commandName) return
            
            const interaction = this.client.interactions.get(commandName)
            if (!interaction) return 

            if (interaction.permissions) {
                const { isAllowed, missingPermissions } = await this.client.utils.checkPermissionsFor(member, interaction.permissions, guild, false)
                if (!isAllowed) {
                    await interaction.reject(baseInteraction, this.client.utils.getMissingPermsString(missingPermissions, member))
                    return
                }
            }

            if (!baseInteraction.customId) {
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
            console.log(`There was an error in ${this.name}`)
            console.log(error)
        }
    }
}