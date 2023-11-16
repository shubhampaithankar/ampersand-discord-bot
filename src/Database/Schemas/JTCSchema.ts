import { Schema } from 'mongoose'

export default new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    channelId: {
        type: String,
        required: true,
    },
    enabled: {
        type: Boolean,
        required: true,
    }
})