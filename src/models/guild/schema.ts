import { Schema } from "mongoose";

export default new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  ownerId: {
    type: String,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  joinedAt: [
    {
      type: Date,
      required: true,
    },
  ],
  leftAt: [
    {
      type: Date,
    },
  ],
});
