import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  TextBasedChannel,
} from "discord.js";

export type ButtonHandlerMap = Record<
  string,
  (interaction: ButtonInteraction) => Promise<void>
>;

export type CreatePaginatorParams = {
  interaction: ChatInputCommandInteraction;
  pages: EmbedBuilder[];
  customIds: { prev: string; next: string; cancel: string };
  buttonRow: ActionRowBuilder<ButtonBuilder>;
  time?: number;
  userId?: string;
};

export type CreateButtonHandlerParams = {
  channel: TextBasedChannel;
  handlers: ButtonHandlerMap;
  filter: (i: ButtonInteraction) => boolean | Promise<boolean>;
  time: number;
  onEnd?: (
    collection: Collection<string, ButtonInteraction>,
    reason: string,
  ) => Promise<void>;
};
