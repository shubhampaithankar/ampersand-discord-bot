import { Schema } from "mongoose";

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
