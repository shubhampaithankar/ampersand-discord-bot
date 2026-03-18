import {
  APIEmbedField,
  ColorResolvable,
  EmbedAuthorOptions,
  EmbedFooterOptions,
} from "discord.js";

export type EmbedOpts = {
  title?: string;
  description?: string;
  color?: ColorResolvable;
  thumbnail?: string;
  image?: string;
  fields?: APIEmbedField[];
  footer?: string | EmbedFooterOptions;
  author?: string | EmbedAuthorOptions;
  timestamp?: boolean;
  url?: string;
};
