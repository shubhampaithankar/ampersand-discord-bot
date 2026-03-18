import { Schema } from 'mongoose'

const permissionSchema = new Schema({
    Connect: { type: Boolean, required: true },
    SendMessages: { type: Boolean, required: true },
})

export default new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    enabled: {
        type: Boolean,
        required: true,
    },
    originalPermissions: {
        type: Map,
        of: permissionSchema,
        required: true,
    },
})
