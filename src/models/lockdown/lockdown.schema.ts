import { Schema } from "mongoose";

const overwriteSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: Number, required: true }, // 0 = role, 1 = member
    allow: { type: String, required: true }, // BigInt as string
    deny: { type: String, required: true }, // BigInt as string
  },
  { _id: false },
);

const channelSnapshotSchema = new Schema(
  {
    channelId: { type: String, required: true },
    overwrites: { type: [overwriteSchema], default: [] },
  },
  { _id: false },
);

export default new Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, required: true },
  lockedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  channels: { type: [channelSnapshotSchema], default: [] },
});
