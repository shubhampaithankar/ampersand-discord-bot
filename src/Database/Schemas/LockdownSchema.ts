import { Schema } from 'mongoose'

export default new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    enabled: {
        type: Boolean,
        required: true,
    },
    originalPermissions: {
        type: Object,
        required: true
    }
})