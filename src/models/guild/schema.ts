import { Schema } from "mongoose";

export const JTCSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    channelId: {
      type: String,
      required: true,
    },
  },
  {
    id: true,
    timestamps: true,
  },
);

export const MusicSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    channelIds: [
      {
        type: String,
      },
    ],
  },
  {
    id: true,
    timestamps: true,
  },
);

export const AutoGambleSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    channelIds: [
      {
        type: String,
      },
    ],
    chance: {
      type: Number,
      default: 10,
    },
    timeoutDuration: {
      type: Number,
      default: 30,
    },
  },
  {
    id: true,
    timestamps: true,
  },
);

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
  music: {
    type: MusicSchema,
  },
  jtc: {
    type: JTCSchema,
  },
  autoGamble: {
    type: AutoGambleSchema,
  },
});
