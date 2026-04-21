import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { ButtonOpts } from "@/types/button.types";

export type { ButtonOpts };

export const buildButton = (opts: ButtonOpts): ButtonBuilder => {
  const btn = new ButtonBuilder().setLabel(opts.label).setStyle(opts.style);

  if (opts.customId) btn.setCustomId(opts.customId);
  if (opts.url) btn.setURL(opts.url);
  if (opts.emoji) btn.setEmoji(opts.emoji);
  if (opts.disabled !== undefined) btn.setDisabled(opts.disabled);

  return btn;
};

/** Wraps buttons into a single ActionRow. */
export const buildRow = (...buttons: ButtonBuilder[]): ActionRowBuilder<ButtonBuilder> =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

/**
 * Standard enable/disable toggle button.
 * Green "Enable" when disabled, red "Disable" when enabled.
 */
export const toggleButton = (enabled: boolean, customId: string): ButtonBuilder =>
  buildButton({
    label: enabled ? "Disable" : "Enable",
    style: enabled ? ButtonStyle.Danger : ButtonStyle.Success,
    customId,
  });
