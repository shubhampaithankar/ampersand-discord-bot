import type { ATTRIBUTION_SOURCE } from "@/models/invite/invite.constants";

export type AttributionSource = (typeof ATTRIBUTION_SOURCE)[keyof typeof ATTRIBUTION_SOURCE];

export interface InviteSnapshotEntry {
  code: string;
  uses: number;
  maxUses: number;
  expiresAt: Date | null;
  inviterId: string | null;
  channelId: string;
}

export interface InviteSnapshotData {
  guildId: string;
  entries: InviteSnapshotEntry[];
  vanityUses: number | null;
  hasPermission: boolean;
  updatedAt: Date;
}

export interface InviteJoinData {
  guildId: string;
  userId: string;
  joinedAt: Date;
  code: string | null;
  inviterId: string | null;
  source: AttributionSource;
  accountAgeMs: number;
  isRejoin: boolean;
}
