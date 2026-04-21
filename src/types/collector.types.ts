import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  ComponentType,
  EmbedBuilder,
  MessageComponentInteraction,
  TextBasedChannel,
} from "discord.js";

export type ButtonHandlerMap = Record<string, (interaction: ButtonInteraction) => Promise<void>>;

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
  /** Omit for a persistent panel collector; pass 1 for a one-shot handler. */
  max?: number;
  onEnd?: (collection: Collection<string, ButtonInteraction>, reason: string) => Promise<void>;
};

export type ChainedCollectorStep = {
  componentType: ComponentType;
  filter: (i: MessageComponentInteraction) => boolean;
  time: number;
  max?: number;
  handler: (i: MessageComponentInteraction) => Promise<ChainedCollectorStep | null>;
  onEnd?: (
    collected: Collection<string, MessageComponentInteraction>,
    reason: string,
  ) => Promise<void>;
};

export type CreateChainedCollectorParams = {
  channel: TextBasedChannel;
  step: ChainedCollectorStep;
};
