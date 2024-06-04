import Client from '../../Client'
import { MainEvent } from '../../Classes'
import { InteractionType } from '../../Types'
import { musicSchema } from '../../Database/Schemas'
import { Events } from 'discord.js'

export default class InteractionCreate extends MainEvent {
    constructor (client: Client) {
        super(client, Events.InteractionCreate)
    }
    async run(interaction: InteractionType) {
        try {
            if (!interaction.inGuild()) return
            const guild = interaction.guild!

            // const bot = guild.members.cache.get(this.client.user!.id!)
            // if (!bot) return

            const member = guild.members.cache.get(interaction.member.user.id)
            if (!member) return

            const commandName: string | null = interaction.message?.interaction?.commandName || interaction.commandName || null
            if (!commandName) return
            
            const command = this.client.interactions.get(commandName) || this.client.aliases.get(commandName)
            if (!command) return 

            if (command.permissions) {
                const { isAllowed, missingPermissions } = await this.client.utils.checkPermissionsFor(member, command.permissions, guild, false)
                if (!isAllowed) {
                    await command.reject({ 
                        interaction, 
                        message: this.client.utils.getMissingPermsString(missingPermissions, member) 
                    })
                    return
                }
            }

            if (!interaction.customId) {

                const { cooldowns } = this.client
                    
                if (!cooldowns.has(commandName)) {
                    cooldowns.set(commandName, new Map())
                }
    
                const now = Date.now()
                const timestamps = cooldowns.get(commandName)!
                const cooldownAmount = (command.cooldown || 2) * 1000

                if (timestamps.has(member.user.id)) {
                    const expirationTime = timestamps.get(member.user.id)! + cooldownAmount
      
                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000 // Convert milliseconds to seconds
                        await command.reject({ 
                            interaction, 
                            message: `You're on cooldown for this command. Please wait ${timeLeft.toFixed(1)} seconds.`
                        })
                        return
                    }
                }

                switch (command.category) {
                    case 'Music': {
                        const guildMusicData = await musicSchema.findOne({
                            guildId: guild.id
                        })
                        if (!guildMusicData || !guildMusicData.enabled) {
                            await command.reject({
                                interaction, 
                                message: `**Music Module** is \`Disabled\` for **${guild.name}**.\n Enable it by using the \`/setmusic\` command.`
                            })
                            return
                        }
                        const channel = guild.channels.cache.get(interaction.channelId!)
                        if (!channel) return

                        if (!guildMusicData.channelIds.includes(channel.id)) {
                            await command.reject({
                                interaction, 
                                message: `**${channel.name}** is \`not present\` in music database for **${guild.name}**.\n Add it by using the \`/addmusicchannel\` command.`

                            })
                            return
                        }
                        break
                    }
                    
                
                    default: break
                }

                timestamps.set(member.user.id, now)
                await command.run(interaction)

            }

        } catch (error) {
            console.log(`There was an error in ${this.name}`)
            console.log(error)
        }
    }
}