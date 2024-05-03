import { 
    AutocompleteInteraction, ButtonInteraction, ChannelSelectMenuInteraction, 
    ChatInputCommandInteraction, CommandInteraction, ContextMenuCommandInteraction, 
    MentionableSelectMenuInteraction, Message, MessageComponentInteraction, MessageContextMenuCommandInteraction, 
    ModalSubmitInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, 
    UserContextMenuCommandInteraction, UserSelectMenuInteraction, VoiceChannel, Collection, PermissionResolvable,
    ApplicationCommandDataResolvable
} from 'discord.js'

export type InteractionConfig = {
    type: number
    permissions?: PermissionResolvable
    category?: string
    data: ApplicationCommandDataResolvable
}

export type InteractionTypes = ( AutocompleteInteraction | ButtonInteraction 
    | ChannelSelectMenuInteraction | ChatInputCommandInteraction | CommandInteraction | ContextMenuCommandInteraction 
    | MentionableSelectMenuInteraction | MessageComponentInteraction | MessageContextMenuCommandInteraction
    | ModalSubmitInteraction | RoleSelectMenuInteraction | StringSelectMenuInteraction | UserContextMenuCommandInteraction | UserSelectMenuInteraction ) 
    & { commandName?: string, customId?: string, message?: Message, channels?: Collection<string, VoiceChannel> }