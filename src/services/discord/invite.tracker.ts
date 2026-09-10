import type { Guild, GuildMember, Invite } from "discord.js";
import { getRedis } from "@/libs/redis";
import {
  ATTRIBUTION_SOURCE,
  InviteService,
  type AttributionSource,
  type InviteSnapshotData,
  type InviteSnapshotEntry,
} from "@/models/invite";
import { reportError } from "@/services/error.reporter";

const SNAPSHOT_TTL_SECONDS = 3600; // matches guild:db:{guildId} TTL
const REDIS_TIMEOUT_MS = 500;
const DELETED_GRACE_MS = 60_000;
const MISSING_PERMISSIONS_CODE = 50013;

const snapshotKey = (guildId: string) => `invites:${guildId}`;

// Per-guild promise-chain mutex — every snapshot read+diff+write (reconcile included)
// serializes through here so a slow reconcile can never clobber a newer write.
const guildLocks = new Map<string, Promise<unknown>>();
const reconciledGuilds = new Set<string>();

const withGuildLock = <T>(guildId: string, fn: () => Promise<T>): Promise<T> => {
  const previous = guildLocks.get(guildId) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(fn);
  guildLocks.set(
    guildId,
    run.catch(() => undefined),
  );
  return run;
};

// Invites consumed (single-use) right before a member join can vanish from the fetch
// before attributeJoin runs. Keep them for a short grace window so that join still matches.
const recentlyDeleted = new Map<string, Map<string, InviteSnapshotEntry>>();

const rememberDeleted = (guildId: string, entry: InviteSnapshotEntry) => {
  let guildMap = recentlyDeleted.get(guildId);
  if (!guildMap) {
    guildMap = new Map();
    recentlyDeleted.set(guildId, guildMap);
  }
  guildMap.set(entry.code, entry);
  setTimeout(() => guildMap?.delete(entry.code), DELETED_GRACE_MS).unref();
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);

// ponytail: Valkey's client stays non-null across a dropped connection (infinite retryStrategy +
// offline queue in src/libs/redis.ts), so a dead Valkey hangs instead of rejecting. Bound every
// read so a stuck Valkey never stalls the per-guild mutex.
const readSnapshot = async (guildId: string): Promise<InviteSnapshotData | null> => {
  const redis = getRedis();
  if (redis) {
    const cached = await withTimeout(redis.get(snapshotKey(guildId)), REDIS_TIMEOUT_MS);
    if (cached) {
      try {
        return JSON.parse(cached) as InviteSnapshotData;
      } catch {
        // corrupt cache entry — fall through to Mongo
      }
    }
  }
  return InviteService.getSnapshot(guildId);
};

// ponytail: single-process bot (sharding is unwired per architecture.md), and every write below
// goes through writeSnapshot which updates Mongo then mirrors the cache — so cache and Mongo stay
// in lockstep and an updatedAt compare-on-read is redundant. Add it back if the bot ever runs
// multi-instance / sharded and a second writer can bypass this cache.
const writeSnapshot = async (
  data: Pick<InviteSnapshotData, "guildId" | "entries" | "vanityUses" | "hasPermission">,
): Promise<InviteSnapshotData | null> => {
  const saved = await InviteService.saveSnapshot(data);
  if (saved) {
    const redis = getRedis();
    if (redis) {
      await withTimeout(
        redis.set(snapshotKey(data.guildId), JSON.stringify(saved), "EX", SNAPSHOT_TTL_SECONDS),
        REDIS_TIMEOUT_MS,
      );
    }
  }
  return saved;
};

const toEntry = (invite: Invite): InviteSnapshotEntry => ({
  code: invite.code,
  uses: invite.uses ?? 0,
  maxUses: invite.maxUses ?? 0,
  expiresAt: invite.expiresAt ?? null,
  inviterId: invite.inviterId ?? null,
  channelId: invite.channelId ?? "",
});

type LiveInvites = { entries: InviteSnapshotEntry[]; vanityUses: number | null };

const fetchLiveInvites = async (guild: Guild): Promise<LiveInvites | "no-permission"> => {
  let invites: Awaited<ReturnType<Guild["invites"]["fetch"]>>;
  try {
    invites = await guild.invites.fetch();
  } catch (error: unknown) {
    if ((error as { code?: number | string }).code === MISSING_PERMISSIONS_CODE)
      return "no-permission";
    throw error;
  }

  const entries = invites.map(toEntry);

  let vanityUses: number | null = null;
  if (guild.features.includes("VANITY_URL")) {
    vanityUses = await guild
      .fetchVanityData()
      .then((data) => data.uses)
      .catch(() => null);
  }

  return { entries, vanityUses };
};

/** Full resync for a guild: fetch live invites, overwrite the snapshot, mark reconciled. */
export const syncGuild = (guild: Guild) =>
  withGuildLock(guild.id, async () => {
    try {
      const live = await fetchLiveInvites(guild);
      if (live === "no-permission") {
        await writeSnapshot({ guildId: guild.id, entries: [], vanityUses: null, hasPermission: false });
        reconciledGuilds.add(guild.id);
        return;
      }
      await writeSnapshot({
        guildId: guild.id,
        entries: live.entries,
        vanityUses: live.vanityUses,
        hasPermission: true,
      });
      reconciledGuilds.add(guild.id);
    } catch (error) {
      await reportError({
        source: "music.inviteTracker",
        error,
        context: { guildId: guild.id, guildName: guild.name, extra: "syncGuild" },
      });
    }
  });

export const dropGuild = (guildId: string) =>
  withGuildLock(guildId, async () => {
    reconciledGuilds.delete(guildId);
    recentlyDeleted.delete(guildId);
    await InviteService.deleteSnapshot(guildId);
    const redis = getRedis();
    if (redis) await withTimeout(redis.del(snapshotKey(guildId)), REDIS_TIMEOUT_MS);
  });

/** Patch one entry into the cached snapshot on invite create — no full refetch. */
export const applyInviteCreated = (invite: Invite) => {
  if (!invite.guild) return;
  const guildId = invite.guild.id;
  return withGuildLock(guildId, async () => {
    const snapshot = await readSnapshot(guildId);
    if (!snapshot || !snapshot.hasPermission) return;
    const entries = snapshot.entries.filter((e) => e.code !== invite.code);
    entries.push(toEntry(invite));
    await writeSnapshot({ guildId, entries, vanityUses: snapshot.vanityUses, hasPermission: true });
  });
};

/** Patch one entry out of the cached snapshot on invite delete — no full refetch. */
export const applyInviteDeleted = (invite: Invite) => {
  if (!invite.guild) return;
  const guildId = invite.guild.id;
  return withGuildLock(guildId, async () => {
    const snapshot = await readSnapshot(guildId);
    if (!snapshot || !snapshot.hasPermission) return;
    const removed = snapshot.entries.find((e) => e.code === invite.code);
    if (removed) rememberDeleted(guildId, removed);
    const entries = snapshot.entries.filter((e) => e.code !== invite.code);
    await writeSnapshot({ guildId, entries, vanityUses: snapshot.vanityUses, hasPermission: true });
  });
};

const isExpired = (expiresAt: Date | null, now: number) =>
  expiresAt !== null && expiresAt.getTime() <= now;

/**
 * Diff a before/after invite snapshot pair and return the single invite that must have
 * produced the join, or null when it can't be pinned down to exactly one candidate.
 */
type Candidate = { code: string | null; inviterId: string | null; source: AttributionSource };

const findSoleCandidate = (
  before: InviteSnapshotData,
  after: LiveInvites,
  now: number,
): Candidate | null => {
  const beforeByCode = new Map(before.entries.map((e) => [e.code, e]));
  const afterByCode = new Map(after.entries.map((e) => [e.code, e]));

  // inviteDelete already stripped a consumed single-use invite out of the snapshot, so the
  // vanished-code loop below would never see it. Fold the grace-list entries back in as
  // before-state so that join can still match the invite that produced it.
  const deletedGuildMap = recentlyDeleted.get(before.guildId);
  if (deletedGuildMap)
    for (const [code, entry] of deletedGuildMap)
      if (!beforeByCode.has(code)) beforeByCode.set(code, entry);

  let delta = 0;
  const candidates: Candidate[] = [];

  for (const [code, afterEntry] of afterByCode) {
    const beforeEntry = beforeByCode.get(code);
    const grew = afterEntry.uses - (beforeEntry?.uses ?? 0);
    if (grew > 0) {
      delta += grew;
      candidates.push({ code, inviterId: afterEntry.inviterId, source: ATTRIBUTION_SOURCE.NORMAL });
    }
  }

  for (const [code, beforeEntry] of beforeByCode) {
    if (afterByCode.has(code)) continue;
    // Only a vanished invite whose LAST use was still available counts as consumed. A revoked
    // or time-expired invite also disappears, and crediting its owner for an unrelated join
    // (discovery, OAuth) is exactly the misattribution this rule exists to prevent.
    const grewToMax = beforeEntry.uses + 1 === beforeEntry.maxUses && beforeEntry.maxUses > 0;
    if (grewToMax && !isExpired(beforeEntry.expiresAt, now)) {
      delta += 1;
      candidates.push({
        code,
        inviterId: beforeEntry.inviterId,
        source: ATTRIBUTION_SOURCE.SINGLE_USE,
      });
    }
  }

  const vanityGrew = (after.vanityUses ?? 0) > (before.vanityUses ?? 0);
  if (vanityGrew) {
    delta += 1;
    candidates.push({ code: null, inviterId: null, source: ATTRIBUTION_SOURCE.VANITY });
  }

  if (candidates.length === 1 && delta === 1) return candidates[0]!;
  return null;
};

const recordUnknownJoin = async (member: GuildMember) => {
  const first = await InviteService.findFirstJoin(member.guild.id, member.id);
  await InviteService.recordJoin({
    guildId: member.guild.id,
    userId: member.id,
    joinedAt: new Date(),
    code: first?.code ?? null,
    inviterId: first ? first.inviterId : null,
    source: first ? ATTRIBUTION_SOURCE.REJOIN : ATTRIBUTION_SOURCE.UNKNOWN,
    accountAgeMs: Date.now() - member.user.createdTimestamp,
    isRejoin: !!first,
  });
};

// ponytail: attributeJoin does 2 REST calls (invites.fetch + optional fetchVanityData) per join,
// all serialized through one mutex per guild — a raid queues every join behind the same chain,
// unbounded. Fine at normal join rates; cap concurrency or batch-diff if a guild sees raid-scale
// joins and the queue backs up visibly.
/** Attribute a guildMemberAdd to the invite that produced it. Never guesses — UNKNOWN if unsure. */
export const attributeJoin = (member: GuildMember) =>
  withGuildLock(member.guild.id, async () => {
    try {
      const guildId = member.guild.id;
      if (!reconciledGuilds.has(guildId)) {
        await recordUnknownJoin(member);
        return;
      }

      const before = await readSnapshot(guildId);
      if (!before || !before.hasPermission) {
        await recordUnknownJoin(member);
        return;
      }

      const after = await fetchLiveInvites(member.guild);
      if (after === "no-permission") {
        await writeSnapshot({ guildId, entries: [], vanityUses: null, hasPermission: false });
        await recordUnknownJoin(member);
        return;
      }

      const candidate = findSoleCandidate(before, after, Date.now());
      const first = await InviteService.findFirstJoin(guildId, member.id);
      const isRejoin = !!first;

      await InviteService.recordJoin({
        guildId,
        userId: member.id,
        joinedAt: new Date(),
        code: isRejoin ? first.code : (candidate?.code ?? null),
        inviterId: isRejoin ? first.inviterId : (candidate?.inviterId ?? null),
        source: isRejoin ? ATTRIBUTION_SOURCE.REJOIN : (candidate?.source ?? ATTRIBUTION_SOURCE.UNKNOWN),
        accountAgeMs: Date.now() - member.user.createdTimestamp,
        isRejoin,
      });

      await writeSnapshot({
        guildId,
        entries: after.entries,
        vanityUses: after.vanityUses,
        hasPermission: true,
      });
    } catch (error) {
      await reportError({
        source: "event.guildMemberAdd",
        error,
        context: { guildId: member.guild.id, guildName: member.guild.name, userId: member.id },
      });
    }
  });
