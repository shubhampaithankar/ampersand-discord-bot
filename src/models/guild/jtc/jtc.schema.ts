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
