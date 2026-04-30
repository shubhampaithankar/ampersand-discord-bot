import {
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  InteractionCollector,
  Message,
  MessageFlags,
  TextChannel,
} from "discord.js";
import { Player } from "poru";
import type BaseClient from "@/client";
import { MUSIC_PLAYER_ACTIONS } from "@/models/guild";
import { buildButton, buildRow } from "@/services/discord/button.builder";
import { botAuthor, musicEmbed } from "@/services/discord/embed.builder";
import { ctxFromPlayer, reportError } from "@/services/error.reporter";
import { formatDuration } from "@/services/general.utils";

const QUEUE_PREVIEW_LIMIT = 10;
const BAR_LENGTH = 18;
const TICK_INTERVAL_MS = 5000;

const LOOP_MODES = ["NONE", "TRACK", "QUEUE"] as const;
type LoopMode = (typeof LOOP_MODES)[number];

const LOOP_LABELS: Record<LoopMode, string> = {
  NONE: "Off",
  TRACK: "🔂 Track",
  QUEUE: "🔁 Queue",
};

const PLATFORM_META: Record<string, { icon: string; name: string }> = {
  youtube: { icon: "📺", name: "YouTube" },
  youtubemusic: { icon: "🎵", name: "YouTube Music" },
  spotify: { icon: "🟢", name: "Spotify" },
  soundcloud: { icon: "☁️", name: "SoundCloud" },
  applemusic: { icon: "🍎", name: "Apple Music" },
  deezer: { icon: "🎶", name: "Deezer" },
  bandcamp: { icon: "🎸", name: "Bandcamp" },
  twitch: { icon: "💜", name: "Twitch" },
  vimeo: { icon: "🎬", name: "Vimeo" },
  http: { icon: "🌐", name: "Stream" },
};

const platformBadge = (sourceName?: string) => {
  const meta = PLATFORM_META[sourceName?.toLowerCase() ?? ""] ?? {
    icon: "🎵",
    name: sourceName ? sourceName : "Stream",
  };
  return `${meta.icon} ${meta.name}`;
};

const buildProgressBar = (position: number, length: number) => {
  if (!length || length <= 0) return "🔴 LIVE";
  const ratio = Math.max(0, Math.min(position / length, 1));
  const filled = Math.round(ratio * BAR_LENGTH);
  const left = "▰".repeat(filled);
  const right = "▱".repeat(Math.max(0, BAR_LENGTH - filled));
  return `${left}🔘${right}`;
};

const customId = (guildId: string, action: string) => `np_${guildId}_${action}`;

const formatRequester = (requester: unknown): string | null => {
  if (!requester) return null;
  if (typeof requester === "string") return requester;
  const r = requester as { username?: string; user?: { username?: string }; tag?: string };
  return r.user?.username ?? r.username ?? r.tag ?? null;
};

const buildPanelEmbed = (client: BaseClient, player: Player) => {
  const track = player.currentTrack;
  if (!track) return null;

  const { title, uri, length, artworkUrl, author, requester, sourceName, isStream } = track.info;

  const position = player.position ?? 0;
  const loopLabel = LOOP_LABELS[(player.loop ?? "NONE") as LoopMode] ?? "Off";
  const queueCount = player.queue.length;
  const status = player.isPaused ? "⏸ Paused" : "▶ Playing";
  const timeLine = isStream
    ? "`LIVE STREAM`"
    : `\`${formatDuration(position)}\` ─── \`${formatDuration(length)}\``;
  const requesterLabel = formatRequester(requester);

  const description = [
    `### [${title}](${uri || ""})`,
    author ? `**${author}**　·　${platformBadge(sourceName)}` : platformBadge(sourceName),
    "",
    isStream ? "🔴 LIVE" : buildProgressBar(position, length),
    timeLine,
  ].join("\n");

  return musicEmbed({
    author: { ...botAuthor(client), name: "🎵 Now Playing" },
    description,
    thumbnail: artworkUrl || undefined,
    fields: [
      { name: "Status", value: status, inline: true },
      { name: "Loop", value: loopLabel, inline: true },
      {
        name: "Queue",
        value: queueCount === 0 ? "Empty" : `${queueCount} track${queueCount !== 1 ? "s" : ""}`,
        inline: true,
      },
    ],
    footer: requesterLabel ? `Requested by ${requesterLabel}` : undefined,
    timestamp: true,
  });
};

const buildPanelComponents = (player: Player) => {
  const id = (action: string) => customId(player.guildId, action);
  const hasPrevious = !!player.previousTrack;

  const primary = buildRow(
    buildButton({
      label: player.isPaused ? "▶ Resume" : "⏸ Pause",
      style: player.isPaused ? ButtonStyle.Success : ButtonStyle.Secondary,
      customId: id(MUSIC_PLAYER_ACTIONS.PAUSE),
    }),
    buildButton({
      label: "⏮ Previous",
      style: ButtonStyle.Secondary,
      customId: id(MUSIC_PLAYER_ACTIONS.PREVIOUS),
      disabled: !hasPrevious,
    }),
    buildButton({
      label: "⏭ Skip",
      style: ButtonStyle.Primary,
      customId: id(MUSIC_PLAYER_ACTIONS.SKIP),
    }),
    buildButton({
      label: "⏹ Stop",
      style: ButtonStyle.Danger,
      customId: id(MUSIC_PLAYER_ACTIONS.STOP),
    }),
  );

  const secondary = buildRow(
    buildButton({
      label: "🔀 Shuffle",
      style: ButtonStyle.Secondary,
      customId: id(MUSIC_PLAYER_ACTIONS.SHUFFLE),
    }),
    buildButton({
      label: "🔁 Loop",
      style: ButtonStyle.Secondary,
      customId: id(MUSIC_PLAYER_ACTIONS.LOOP),
    }),
    buildButton({
      label: "📋 Queue",
      style: ButtonStyle.Secondary,
      customId: id(MUSIC_PLAYER_ACTIONS.QUEUE),
    }),
  );

  return [primary, secondary];
};

const formatQueuePreview = (player: Player): string => {
  const upcoming = player.queue.slice(0, QUEUE_PREVIEW_LIMIT);
  if (upcoming.length === 0) return "Queue is empty.";

  const lines = upcoming.map((track, idx) => {
    const { title, length } = track.info;
    return `**${idx + 1}.** ${title} \`[${formatDuration(length)}]\``;
  });

  const remaining = player.queue.length - upcoming.length;
  if (remaining > 0) lines.push(`...and **${remaining}** more`);
  return lines.join("\n");
};

const resolveTextChannel = async (
  client: BaseClient,
  channelId: string,
): Promise<TextChannel | null> => {
  const cached = client.channels.cache.get(channelId);
  if (cached?.isTextBased()) return cached as TextChannel;
  const fetched = await client.channels.fetch(channelId).catch(() => null);
  return fetched?.isTextBased() ? (fetched as TextChannel) : null;
};

const fetchPanelMessage = async (client: BaseClient, player: Player): Promise<Message | null> => {
  const channelId = player.get("npChannelId") as string | undefined;
  const messageId = player.get("npMessageId") as string | undefined;
  if (!channelId || !messageId) return null;

  const channel = await resolveTextChannel(client, channelId);
  if (!channel) return null;

  return channel.messages.fetch(messageId).catch(() => null);
};

const attachCollector = (client: BaseClient, player: Player, message: Message) => {
  const existing = player.get("npCollector") as InteractionCollector<ButtonInteraction> | null;
  if (existing && !existing.ended) return;

  const prefix = `np_${player.guildId}_`;

  const collector = message.channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i: ButtonInteraction) => i.customId.startsWith(prefix),
  }) as InteractionCollector<ButtonInteraction>;

  collector.on("collect", async (i: ButtonInteraction) => {
    try {
      const action = i.customId.slice(prefix.length);
      await handlePanelAction({ client, player, interaction: i, action });
    } catch (error) {
      await reportError({
        source: "musicPanel.action",
        error,
        context: ctxFromPlayer(client, player),
      });
    }
  });

  player.set("npCollector", collector);
};

type PanelActionParams = {
  client: BaseClient;
  player: Player;
  interaction: ButtonInteraction;
  action: string;
};

const handlePanelAction = async ({ client, player, interaction, action }: PanelActionParams) => {
  if (action === MUSIC_PLAYER_ACTIONS.QUEUE) {
    await interaction.reply({
      content: formatQueuePreview(player),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (player.get("npActionLock")) {
    await interaction.deferUpdate().catch(() => {});
    return;
  }
  player.set("npActionLock", true);

  try {
    switch (action) {
      case MUSIC_PLAYER_ACTIONS.PAUSE: {
        await interaction.deferUpdate();
        await player.pause(!player.isPaused);
        await renderPanel(client, player);
        return;
      }
      case MUSIC_PLAYER_ACTIONS.PREVIOUS: {
        await interaction.deferUpdate();
        const prev = player.previousTrack;
        const cur = player.currentTrack;
        if (!prev || !cur) return;
        player.queue.unshift(cur, prev);
        await player.skip();
        return;
      }
      case MUSIC_PLAYER_ACTIONS.SKIP: {
        await interaction.deferUpdate();
        await player.skip();
        return;
      }
      case MUSIC_PLAYER_ACTIONS.STOP: {
        await interaction.deferUpdate();
        await clearPanel(client, player, "⏹ Stopped playing and disconnected");
        await player.destroy();
        return;
      }
      case MUSIC_PLAYER_ACTIONS.LOOP: {
        await interaction.deferUpdate();
        const current = LOOP_MODES.indexOf((player.loop ?? "NONE") as LoopMode);
        player.setLoop(LOOP_MODES[(current + 1) % LOOP_MODES.length]);
        await renderPanel(client, player);
        return;
      }
      case MUSIC_PLAYER_ACTIONS.SHUFFLE: {
        await interaction.deferUpdate();
        player.queue.shuffle();
        await renderPanel(client, player);
        return;
      }
    }
  } finally {
    player.set("npActionLock", false);
  }
};

const renderPanel = async (client: BaseClient, player: Player) => {
  const embed = buildPanelEmbed(client, player);
  if (!embed) return;
  const message = await fetchPanelMessage(client, player);
  if (!message) return;
  await message
    .edit({ content: null, embeds: [embed], components: buildPanelComponents(player) })
    .catch(() => {});
};

const ensureTicker = (client: BaseClient, player: Player) => {
  if (player.get("npTicker")) return;
  const interval = setInterval(() => {
    if (!client.poru?.get(player.guildId)) {
      clearInterval(interval);
      player.set("npTicker", null);
      return;
    }
    if (!player.currentTrack || player.isPaused) return;
    renderPanel(client, player).catch((error) =>
      reportError({
        source: "music.npTicker",
        error,
        context: ctxFromPlayer(client, player),
      }),
    );
  }, TICK_INTERVAL_MS);
  player.set("npTicker", interval);
};

const stopTicker = (player: Player) => {
  const interval = player.get("npTicker") as NodeJS.Timeout | null;
  if (interval) clearInterval(interval);
  player.set("npTicker", null);
};

export const upsertPanel = async ({
  client,
  player,
  channelId,
}: {
  client: BaseClient;
  player: Player;
  channelId?: string;
}) => {
  const targetChannelId =
    channelId ?? (player.get("npChannelId") as string | undefined) ?? player.textChannel;
  if (!targetChannelId) return;

  const embed = buildPanelEmbed(client, player);
  if (!embed) return;

  const components = buildPanelComponents(player);
  const channel = await resolveTextChannel(client, targetChannelId);
  if (!channel) return;

  const existing = await fetchPanelMessage(client, player);
  const sameChannel = existing?.channelId === targetChannelId;

  if (existing && sameChannel) {
    await existing.edit({ content: null, embeds: [embed], components }).catch(() => {});
    attachCollector(client, player, existing);
    ensureTicker(client, player);
    return;
  }

  if (existing && !sameChannel) {
    await existing.edit({ content: null, embeds: [], components: [] }).catch(() => {});
    const oldCollector = player.get(
      "npCollector",
    ) as InteractionCollector<ButtonInteraction> | null;
    if (oldCollector && !oldCollector.ended) oldCollector.stop("relocated");
  }

  const sent = await channel.send({ embeds: [embed], components }).catch((err) => {
    console.log("Failed to send NowPlaying panel:", err);
    return null;
  });
  if (!sent) return;
  player.set("npChannelId", sent.channelId);
  player.set("npMessageId", sent.id);
  attachCollector(client, player, sent);
  ensureTicker(client, player);
};

export const clearPanel = async (client: BaseClient, player: Player, finalContent?: string) => {
  const message = await fetchPanelMessage(client, player);
  if (message) {
    await message
      .edit({ content: finalContent ?? null, embeds: [], components: [] })
      .catch(() => {});
  }
  const collector = player.get("npCollector") as InteractionCollector<ButtonInteraction> | null;
  if (collector && !collector.ended) collector.stop("cleared");
  stopTicker(player);
  player.set("npChannelId", null);
  player.set("npMessageId", null);
  player.set("npCollector", null);
};
