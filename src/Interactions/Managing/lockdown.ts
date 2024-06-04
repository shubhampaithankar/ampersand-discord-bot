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
            const originalPermissions = new Map()
            
            const getChannelPermissions = (channel: GuildChannel) => channel.permissionsFor(everyone).serialize()

            try {
                for (const channel of channels.values()) {
                    if (!isEnabled) {

                        originalPermissions.set(channel.id, {
                            Connect: getChannelPermissions(channel).Connect,
                            SendMessages: getChannelPermissions(channel).SendMessages,
                        })

                        channel.permissionOverwrites.edit(everyone, {
                            Connect: false,
                            SendMessages: false
                            // ReadMessageHistory: false,
                        })

                    } else {
                        channel.permissionOverwrites.edit(everyone, {
                            Connect: guildLockdown.originalPermissions.get(channel.id)?.Connect,
                            SendMessages: guildLockdown.originalPermissions.get(channel.id)?.SendMessages,
                            // ReadMessageHistory: false,
                        })
                    }
                }
                updateLockdown(guild, !isEnabled, !isEnabled ? originalPermissions : null)
            } catch (error) {
                throw error
            }
            
            const embed = await this.client.utils.createMessageEmbed({
                author: {
                    name: this.client.user!.displayName,
                    iconURL: this.client.user?.avatarURL() || undefined
                },
                color: 'Red',
                title: 'Lockdown Command',
                description: `
                **Lockdown ${!isEnabled ? 'Enabled' : 'Disabled'}** for server: \`${guild.name}\`\n
                ${!isEnabled ? 'Click on **Remove Lockdown** button to remove it\n**OR**\nUse command **/lockdown** again': ''}
                `.trim(),
                timestamp: Date.now(),
                footer: {
                    text: interaction.member!.user.username,
                },
            })

            if (!embed) throw new Error('Unable to create embed')

            const removeButtonId = `${interaction.channelId}_${interaction.id}_removeLockdown`
            const removeButton = new ButtonBuilder()
                .setLabel('Remove Lockdown')
                .setStyle(ButtonStyle.Danger)
                .setCustomId(removeButtonId)

            const scheduleRemoveButtonId = `${interaction.channelId}_${interaction.id}_removeLockdownAfterSchedule`
            const scheduleRemoveButton = new ButtonBuilder()
                .setLabel('Schedule Remove Lockdown')
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(scheduleRemoveButtonId)
                
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(removeButton, scheduleRemoveButton)

            await interaction.editReply({
                embeds: [embed],
                components: !isEnabled ? [row] : [],
            })

            const timeLimit = 1e3 * 60 * 6 * 12 // 12 hours

            // const collected = await this.client.utils.createInteractionCollector(interaction, [removeButtonId, scheduleRemoveButtonId], ComponentType.Button, undefined, 1, timeLimit) as ButtonInteraction
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