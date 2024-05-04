import { 
    AutocompleteInteraction, ButtonInteraction, ChannelSelectMenuInteraction, 
    ChatInputCommandInteraction, CommandInteraction, ContextMenuCommandInteraction, 
    MentionableSelectMenuInteraction, Message, MessageComponentInteraction, MessageContextMenuCommandInteraction, 
    ModalSubmitInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, 
    UserContextMenuCommandInteraction, UserSelectMenuInteraction, VoiceChannel, Collection, PermissionResolvable,
    ApplicationCommandDataResolvable,
    EmbedAuthorOptions,
    ColorResolvable,
    EmbedFooterOptions,
    APIEmbedField
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

export type EmbedDataType = {
    author: EmbedAuthorOptions;
    title?: string;
    description?: string;
    color?: ColorResolvable; // Hex code for color
    thumbnail?: string; // URL of the thumbnail image
    image?: string; // URL of the image
    footer?: EmbedFooterOptions;
    fields?: APIEmbedField[];
    timestamp?: Date | number;
    url?: string;
    [key: string]: any;
}
  