import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import type { ChannelSelectOpts, StringSelectOpts } from "../../types/select.types";

export const buildChannelSelectRow = ({
  customId,
  types,
  placeholder,
}: ChannelSelectOpts): ActionRowBuilder<ChannelSelectMenuBuilder> => {
  const menu = new ChannelSelectMenuBuilder()
    .setCustomId(customId)
    .setChannelTypes(types);
  if (placeholder) menu.setPlaceholder(placeholder);
  return new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(menu);
};

export const buildStringSelectRow = ({
  customId,
  options,
  placeholder,
}: StringSelectOpts): ActionRowBuilder<StringSelectMenuBuilder> => {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .addOptions(options);
  if (placeholder) menu.setPlaceholder(placeholder);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
};
