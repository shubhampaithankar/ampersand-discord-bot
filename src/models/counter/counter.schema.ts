import { Schema } from "mongoose";

const actorSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["everyone", "role", "user", "admin"],
      required: true,
    },
    targetId: { type: String, default: null },
  },
  { _id: false },
);

const counterSchema = new Schema(
  {
    guildId: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: Number, default: 0 },
    actor: { type: actorSchema, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

counterSchema.index({ guildId: 1, name: 1 }, { unique: true });

export default counterSchema;
