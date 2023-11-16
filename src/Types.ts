import { 
    AutocompleteInteraction, ButtonInteraction, ChannelSelectMenuInteraction, 
    ChatInputCommandInteraction, CommandInteraction, ContextMenuCommandInteraction, Emoji, 
    MentionableSelectMenuInteraction, Message, MessageComponentInteraction, MessageContextMenuCommandInteraction, 
    ModalSubmitInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, 
    UserContextMenuCommandInteraction, UserSelectMenuInteraction, VoiceChannel, Collection, Permissions
} from 'discord.js'

export type InteractionConfig = {
    name: string
    type: number
    description?: string
    permissions?: Permissions
    options: Array<object> | null
}

export type InteractionOptions = {
    label: string
    value: string
    description?: string
    emoji?: Emoji
    default?: {
        id: string
        type: string
    }
}

export type InteractionTypes = ( AutocompleteInteraction | ButtonInteraction 
    | ChannelSelectMenuInteraction | ChatInputCommandInteraction | CommandInteraction | ContextMenuCommandInteraction 
    | MentionableSelectMenuInteraction | MessageComponentInteraction | MessageContextMenuCommandInteraction
    | ModalSubmitInteraction | RoleSelectMenuInteraction | StringSelectMenuInteraction | UserContextMenuCommandInteraction | UserSelectMenuInteraction ) 
    & { commandName?: string, customId?: string, message?: Message, channels?: Collection<string, VoiceChannel> }
