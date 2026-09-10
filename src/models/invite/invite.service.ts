import { InviteJoin, InviteSnapshot } from "@/models/invite/invite.model";
import type { InviteJoinData, InviteSnapshotData } from "@/models/invite/invite.types";

export const getSnapshot = (guildId: string) =>
  InviteSnapshot.findOne({ guildId })
    .lean<InviteSnapshotData | null>()
    .catch(() => null);

export const saveSnapshot = (
  data: Pick<InviteSnapshotData, "guildId" | "entries" | "vanityUses" | "hasPermission">,
) =>
  InviteSnapshot.findOneAndUpdate(
    { guildId: data.guildId },
    {
      $set: {
        entries: data.entries,
        vanityUses: data.vanityUses,
        hasPermission: data.hasPermission,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  )
    .lean<InviteSnapshotData | null>()
    .catch(() => null);

export const deleteSnapshot = (guildId: string) =>
  InviteSnapshot.deleteOne({ guildId }).catch(() => null);

export const recordJoin = (data: InviteJoinData) =>
  InviteJoin.create(data).catch(() => null);

export const findFirstJoin = (guildId: string, userId: string) =>
  InviteJoin.findOne({ guildId, userId }, null, { sort: { joinedAt: 1 } })
    .lean<InviteJoinData | null>()
    .catch(() => null);

/** Rejoins never re-count — only the original (non-rejoin) join credits the inviter. */
export const countInvitesFor = (guildId: string, inviterId: string) =>
  InviteJoin.countDocuments({ guildId, inviterId, isRejoin: false }).catch(() => 0);
