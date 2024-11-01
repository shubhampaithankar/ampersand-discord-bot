import { Message, VoiceChannel, Collection, PermissionResolvable,
    ApplicationCommandDataResolvable,
    EmbedAuthorOptions,
    ColorResolvable,
    EmbedFooterOptions,
    APIEmbedField,
    SlashCommandBuilder,
    InteractionCollector,
    Interaction,
    CacheType,
    GuildMember
} from 'discord.js'

export type InteractionConfig = {
    type: number
    enabled?: boolean
    category?: string
    aliases?: string[]
    cooldown?: number
    collector?: InteractionCollector<any>
    permissions?: PermissionResolvable
    bot?: GuildMember
    data: ApplicationCommandDataResolvable
}

export type InteractionType = Interaction<CacheType> & { commandName?: string, customId?: string, message?: Message, channels?: Collection<string, VoiceChannel> }

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

export type HelpInteractionType = {
    [category: string]: SlashCommandBuilder[]
}
