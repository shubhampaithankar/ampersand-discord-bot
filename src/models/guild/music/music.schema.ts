import { Schema } from "mongoose";

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
