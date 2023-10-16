import { Schema } from 'mongoose'

export default new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: false
    },
    ownerId: {
        type: String,
        required: true,
        unique: false
    },
    isDeleted: {
        type: Boolean,
        required: true,
    },
    joinedAt: {
        type: Date,
        required: true,
        unique: true
    }
})