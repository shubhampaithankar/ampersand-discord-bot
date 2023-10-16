import { model } from 'mongoose'

import GuildSchema from './GuildSchema'
export const guildSchema = model('guilds', GuildSchema, 'guilds')