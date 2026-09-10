import { model } from "mongoose";
import { inviteJoinSchema, inviteSnapshotSchema } from "@/models/invite/invite.schema";

export const InviteSnapshot = model("InviteSnapshot", inviteSnapshotSchema);
export const InviteJoin = model("InviteJoin", inviteJoinSchema);
