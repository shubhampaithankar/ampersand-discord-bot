import { Schema } from 'mongoose'

export default new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    channelIds: {
        type: [String],
        required: true,
    },
    enabled: {
        type: Boolean,
        required: true,
        default: false
    }
})