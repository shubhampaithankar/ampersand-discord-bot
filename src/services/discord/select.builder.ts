import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
} from "discord.js";
import type {
  ChannelSelectOpts,
  RoleSelectOpts,
  StringSelectOpts,
  UserSelectOpts,
} from "@/types/select.types";

export const buildChannelSelectRow = ({
  customId,
  types,
  placeholder,
}: ChannelSelectOpts): ActionRowBuilder<ChannelSelectMenuBuilder> => {
  const menu = new ChannelSelectMenuBuilder().setCustomId(customId).setChannelTypes(types);
  if (placeholder) menu.setPlaceholder(placeholder);
  return new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(menu);
};

export const buildStringSelectRow = ({
  customId,
  options,
  placeholder,
}: StringSelectOpts): ActionRowBuilder<StringSelectMenuBuilder> => {
  const menu = new StringSelectMenuBuilder().setCustomId(customId).addOptions(options);
  if (placeholder) menu.setPlaceholder(placeholder);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
};

export const buildRoleSelectRow = ({
  customId,
  placeholder,
}: RoleSelectOpts): ActionRowBuilder<RoleSelectMenuBuilder> => {
  const menu = new RoleSelectMenuBuilder().setCustomId(customId);
  if (placeholder) menu.setPlaceholder(placeholder);
  return new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(menu);
};

export const buildUserSelectRow = ({
  customId,
  placeholder,
}: UserSelectOpts): ActionRowBuilder<UserSelectMenuBuilder> => {
  const menu = new UserSelectMenuBuilder().setCustomId(customId);
  if (placeholder) menu.setPlaceholder(placeholder);
  return new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(menu);
};
