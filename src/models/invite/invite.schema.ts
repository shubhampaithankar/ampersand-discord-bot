import { Schema } from "mongoose";
import { ATTRIBUTION_SOURCE } from "@/models/invite/invite.constants";

const inviteSnapshotEntrySchema = new Schema(
  {
    code: { type: String, required: true },
    uses: { type: Number, required: true },
    maxUses: { type: Number, required: true },
    expiresAt: { type: Date, default: null },
    inviterId: { type: String, default: null },
    channelId: { type: String, required: true },
  },
  { _id: false },
);

const inviteSnapshotSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true },
    entries: { type: [inviteSnapshotEntrySchema], default: [] },
    vanityUses: { type: Number, default: null },
    hasPermission: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const inviteJoinSchema = new Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    joinedAt: { type: Date, required: true },
    code: { type: String, default: null },
    inviterId: { type: String, default: null },
    source: { type: String, enum: Object.values(ATTRIBUTION_SOURCE), required: true },
    accountAgeMs: { type: Number, required: true },
    isRejoin: { type: Boolean, default: false },
  },
  { timestamps: false },
);

inviteJoinSchema.index({ guildId: 1, inviterId: 1, isRejoin: 1 });
inviteJoinSchema.index({ guildId: 1, userId: 1 });
inviteJoinSchema.index({ guildId: 1, joinedAt: -1 });

export { inviteSnapshotSchema, inviteJoinSchema };
