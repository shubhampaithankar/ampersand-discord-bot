import { EmbedAuthorOptions, EmbedBuilder } from "discord.js";
import type BaseClient from "../../client";
import type { EmbedOpts } from "../../types/embed.types";

export type { EmbedOpts };

const COLORS = {
  info: 0x5865f2,
  success: 0x57f287,
  error: 0xed4245,
  warn: 0xfee75c,
  music: 0x1db954,
} as const;

export const buildEmbed = (opts: EmbedOpts = {}): EmbedBuilder => {
  const embed = new EmbedBuilder();

  if (opts.title) embed.setTitle(opts.title);
  if (opts.description) embed.setDescription(opts.description);
  if (opts.color) embed.setColor(opts.color);
  if (opts.thumbnail) embed.setThumbnail(opts.thumbnail);
  if (opts.image) embed.setImage(opts.image);
  if (opts.url) embed.setURL(opts.url);
  if (opts.fields?.length) embed.addFields(opts.fields);
  if (opts.timestamp) embed.setTimestamp();

  if (opts.footer)
    embed.setFooter(
      typeof opts.footer === "string" ? { text: opts.footer } : opts.footer,
    );

  if (opts.author)
    embed.setAuthor(
      typeof opts.author === "string" ? { name: opts.author } : opts.author,
    );

  return embed;
};

export const infoEmbed = (opts: Omit<EmbedOpts, "color"> = {}) =>
  buildEmbed({ ...opts, color: COLORS.info });

export const successEmbed = (opts: Omit<EmbedOpts, "color"> = {}) =>
  buildEmbed({ ...opts, color: COLORS.success });

export const errorEmbed = (opts: Omit<EmbedOpts, "color"> = {}) =>
  buildEmbed({ ...opts, color: COLORS.error });

export const warnEmbed = (opts: Omit<EmbedOpts, "color"> = {}) =>
  buildEmbed({ ...opts, color: COLORS.warn });

export const musicEmbed = (opts: Omit<EmbedOpts, "color"> = {}) =>
  buildEmbed({ ...opts, color: COLORS.music });

/** Returns the standard bot author object used across embeds. */
export const botAuthor = (client: BaseClient): EmbedAuthorOptions => ({
  name: client.user!.displayName,
  iconURL: client.user?.avatarURL() ?? undefined,
});
