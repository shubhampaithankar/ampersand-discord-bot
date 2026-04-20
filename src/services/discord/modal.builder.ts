import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import type { ModalOpts, TextInputOpts } from "../../types/modal.types";

export const buildTextInput = (opts: TextInputOpts): TextInputBuilder => {
  const input = new TextInputBuilder()
    .setCustomId(opts.customId)
    .setLabel(opts.label)
    .setStyle(opts.style ?? TextInputStyle.Short);

  if (opts.placeholder) input.setPlaceholder(opts.placeholder);
  if (opts.value) input.setValue(opts.value);
  if (opts.required !== undefined) input.setRequired(opts.required);
  if (opts.minLength !== undefined) input.setMinLength(opts.minLength);
  if (opts.maxLength !== undefined) input.setMaxLength(opts.maxLength);

  return input;
};

export const buildModal = ({ customId, title, inputs }: ModalOpts): ModalBuilder => {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);

  for (const opts of inputs) {
    const input = buildTextInput(opts);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  }

  return modal;
};
