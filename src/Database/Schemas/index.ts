import { model } from 'mongoose'

import GuildSchema from './GuildSchema'
export const guildSchema = model('guilds', GuildSchema, 'guilds')

import JTCSchema from './JTCSchema'
export const jtcSchema = model('joinToCreate', JTCSchema, 'joinToCreate')

import MusicSchema from './MusicSchema'
export const musicSchema = model('music', MusicSchema, 'music')

import JTCChannelsSchema from './JTCChannelsSchema'
export const jtcChannelsSchema = model('jtcChannels', JTCChannelsSchema, 'jtcChannels')

import LockdownSchema from './LockdownSchema'
export const lockdownSchema = model('lockdown', LockdownSchema, 'lockdown')

