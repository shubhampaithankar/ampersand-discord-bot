import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, ComponentType, GuildChannel, PermissionOverwrites, PermissionsBitField, SlashCommandBuilder } from 'discord.js'
import { MainInteraction } from '../../Classes'
import Client from '../../Client'
import { getLockdown, updateLockdown } from '../../Database/databaseUtils'

export default class LockdownInteraction extends MainInteraction {
    constructor(client: Client) {
        super(client, {
            type: 1,
            permissions: ['Administrator'],
            data: new SlashCommandBuilder()
                .setName('lockdown')
                .setDescription('locks all the channels from being used')
        })
    }

    run = async (interaction: ChatInputCommandInteraction, ...args: string[]) => {
        await interaction.deferReply().catch(err => console.log(err.message))
        try {
            const guild = interaction.guild!
            const channels = guild.channels.cache as Collection<string, GuildChannel>
            
            const guildLockdown = await getLockdown(guild)
            const isEnabled = (!!guildLockdown && guildLockdown.enabled)
            
            const { everyone } = guild.roles
            const originalPermissions: any = {}

            for (const channel of channels.values()) {
                if (!isEnabled) {
                    originalPermissions[channel.id] = channel.permissionOverwrites.cache.values()
                    channel.permissionOverwrites.edit(everyone, {
                        Connect: false,
                        SendMessages: false
                        // ReadMessageHistory: false,
                    })
                } else {
                    channel.permissionOverwrites.edit(everyone, {
                        Connect: guildLockdown.originalPermissions[channel.id].Connect,
                        SendMessages: guildLockdown.originalPermissions[channel.id].SendMessages,
                        // ReadMessageHistory: false,
                    })
                }
                try {
                    // await updateLockdown(guild, true, originalPermissions)
                } catch (error) {
                    throw error
                }
            }

            
            const embed = await this.client.utils.createMessageEmbed({
                author: {
                    name: this.client.user!.displayName,
                    iconURL: this.client.user?.avatarURL() || undefined
                },
                color: 'Red',
                title: 'Lockdown Command',
                description: `
                    **Lockdown enabled** for server: \`${guild.name}\`
                    Click on **Remove Lockdown** button to remove it
                    **OR** 
                    Use command **/lockdown** again
                `,
                timestamp: Date.now(),
                footer: {
                    text: interaction.member!.user.username,
                },
            })

            if (!embed) throw new Error('Unable to create embed')

            const customId = `${interaction.channelId}_${interaction.id}_removeLockdown`
            const removeButton = new ButtonBuilder()
                .setLabel('Remove Lockdown')
                .setStyle(ButtonStyle.Success)
                .setCustomId(customId)
                
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(removeButton)

            await interaction.editReply({
                embeds: [embed],
                components: [row],
            })

            // const collected = await this.client.utils.createInteractionCollector(interaction, customId, ComponentType.Button, undefined, 1, 1000 * 60 * 60 * 2) as ButtonInteraction
            // if (collected) return this.followUp(collected, interaction)

        } catch (error: any) {
            console.log('There was an error in Help command: ', error)
            await interaction.editReply(`There was an error \`${error.message}\``)
            return
        }
    }

    followUp = async (interaction: ButtonInteraction, prevInteraction: ChatInputCommandInteraction, ...args: any[]) => {
        try {
        } catch (error: any) {
            console.log('There was an error in Help command: ', error)
            await interaction.reply(`There was an error \`${error.message}\``)
            return
        }
    }
}

type OriginalPermissionsType = {
    [permission: string]: boolean | null
}