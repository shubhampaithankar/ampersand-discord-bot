import type { ButtonStyle } from "discord.js";

export type ButtonOpts = {
  label: string;
  style: ButtonStyle;
  customId?: string;
  url?: string;
  disabled?: boolean;
  emoji?: string;
};
