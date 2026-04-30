import { Interaction } from "discord.js";
import { Player } from "poru";
import type BaseClient from "@/client";
import { ERROR_WEBHOOK_URL } from "@/constants";

const DEDUP_WINDOW_MS = 60_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const FIELD_LIMIT = 1024;
const STACK_FRAMES = 8;

const dedupSeen = new Map<string, number>();
const sendTimes: number[] = [];

export type ErrorContext = {
  guildId?: string;
  guildName?: string;
  channelId?: string;
  channelName?: string;
  userId?: string;
  userName?: string;
  commandName?: string;
  extra?: string;
};

const truncate = (text: string, max: number) =>
  text.length <= max ? text : text.slice(0, max - 3) + "...";

const topStack = (stack?: string) => {
  if (!stack) return "";
  return stack
    .split("\n")
    .slice(0, STACK_FRAMES + 1)
    .join("\n");
};

const errorParts = (error: unknown) => {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string | number }).code;
    return {
      message: error.message || error.name || "Unknown error",
      code: code !== undefined ? String(code) : undefined,
      stack: error.stack,
      name: error.name,
    };
  }
  return { message: String(error), code: undefined, stack: undefined, name: "NonError" };
};

const dedupKey = (source: string, parts: ReturnType<typeof errorParts>) => {
  const firstFrame = parts.stack?.split("\n")[1]?.trim() ?? "";
  return `${source}:${parts.message}:${firstFrame}`;
};

const shouldSend = (key: string) => {
  const now = Date.now();
  for (const [k, t] of dedupSeen) if (now - t > DEDUP_WINDOW_MS) dedupSeen.delete(k);
  if (dedupSeen.has(key)) return false;
  while (sendTimes.length && now - sendTimes[0]! > RATE_WINDOW_MS) sendTimes.shift();
  if (sendTimes.length >= RATE_MAX) return false;
  dedupSeen.set(key, now);
  sendTimes.push(now);
  return true;
};

const buildFields = (parts: ReturnType<typeof errorParts>, ctx?: ErrorContext) => {
  const fields: { name: string; value: string; inline?: boolean }[] = [];
  if (parts.code) fields.push({ name: "Code", value: parts.code, inline: true });
  if (parts.name && parts.name !== "Error")
    fields.push({ name: "Type", value: parts.name, inline: true });
  if (ctx?.guildId) {
    const value = ctx.guildName ? `${ctx.guildName}\n\`${ctx.guildId}\`` : `\`${ctx.guildId}\``;
    fields.push({ name: "Guild", value: truncate(value, FIELD_LIMIT), inline: true });
  }
  if (ctx?.channelId) {
    const value = ctx.channelName
      ? `#${ctx.channelName}\n\`${ctx.channelId}\``
      : `\`${ctx.channelId}\``;
    fields.push({ name: "Channel", value: truncate(value, FIELD_LIMIT), inline: true });
  }
  if (ctx?.userId) {
    const value = ctx.userName ? `${ctx.userName}\n\`${ctx.userId}\`` : `\`${ctx.userId}\``;
    fields.push({ name: "User", value: truncate(value, FIELD_LIMIT), inline: true });
  }
  if (ctx?.commandName)
    fields.push({ name: "Command", value: `\`${ctx.commandName}\``, inline: true });
  if (ctx?.extra) fields.push({ name: "Extra", value: truncate(ctx.extra, FIELD_LIMIT) });
  if (parts.stack) {
    const block = "```js\n" + truncate(topStack(parts.stack), FIELD_LIMIT - 12) + "\n```";
    fields.push({ name: "Stack", value: block });
  }
  return fields;
};

export const reportError = async ({
  source,
  error,
  context,
}: {
  source: string;
  error: unknown;
  context?: ErrorContext;
}): Promise<void> => {
  try {
    const parts = errorParts(error);
    console.log(`[${source}] ${parts.message}`, error);

    if (!ERROR_WEBHOOK_URL) return;
    if (!shouldSend(dedupKey(source, parts))) return;

    const payload = {
      username: "Bot Errors",
      embeds: [
        {
          title: `❌ ${truncate(source, 240)}`,
          description: truncate(parts.message, 4000),
          color: 0xed4245,
          fields: buildFields(parts, context),
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(ERROR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => console.log("[errorReporter] webhook POST failed:", err));
  } catch (err) {
    console.log("[errorReporter] internal failure:", err);
  }
};

export const ctxFromInteraction = (interaction: Interaction): ErrorContext => {
  const channel = interaction.channel as { name?: string } | null;
  return {
    guildId: interaction.guildId ?? undefined,
    guildName: interaction.guild?.name,
    channelId: interaction.channelId ?? undefined,
    channelName: channel?.name,
    userId: interaction.user.id,
    userName: interaction.user.username,
    commandName: interaction.isCommand() ? interaction.commandName : undefined,
  };
};

export const ctxFromPlayer = (client: BaseClient, player: Player): ErrorContext => {
  const guild = client.guilds.cache.get(player.guildId);
  const channel = client.channels.cache.get(player.textChannel) as { name?: string } | undefined;
  return {
    guildId: player.guildId,
    guildName: guild?.name,
    channelId: player.textChannel,
    channelName: channel?.name,
  };
};
