import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  ComponentType,
  EmbedBuilder,
  InteractionCollector,
  TextBasedChannel,
} from "discord.js";
import type { ButtonHandlerMap } from "../types/collector.types";

export type { ButtonHandlerMap };

/**
 * Generate consistent button custom IDs anchored to a slash command interaction,
 * so they are unique per invocation and channel.
 *
 * @example
 * const ids = buildCustomIds(interaction, 'prevPage', 'nextPage', 'cancel');
 * // ids.prevPage === `${channelId}_${interactionId}_prevPage`
 */
export const buildCustomIds = <T extends string>(
  interaction: ChatInputCommandInteraction,
  ...actions: T[]
): Record<T, string> =>
  Object.fromEntries(
    actions.map((action) => [
      action,
      `${interaction.channelId}_${interaction.id}_${action}`,
    ]),
  ) as Record<T, string>;

/**
 * Create a self-contained paginator for a set of embed pages.
 *
 * - Uses a single persistent collector (no recursive pattern).
 * - Tracks the current page in a closure.
 * - Removes buttons when the collector ends (timeout or cancel).
 *
 * @returns The underlying collector, or null if there is only one page.
 */
export const createPaginator = ({
  interaction,
  pages,
  customIds,
  buttonRow,
  time = 1000 * 60 * 15,
  userId,
}: {
  interaction: ChatInputCommandInteraction;
  pages: EmbedBuilder[];
  customIds: { prev: string; next: string; cancel: string };
  buttonRow: ActionRowBuilder<ButtonBuilder>;
  time?: number;
  userId?: string;
}): InteractionCollector<ButtonInteraction> | null => {
  if (!interaction.channel || pages.length <= 1) return null;

  let currentPage = 0;

  const allowedIds = Object.values(customIds);
  const collector = interaction.channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i: ButtonInteraction) =>
      allowedIds.includes(i.customId) && (userId ? i.user.id === userId : true),
    time,
  }) as InteractionCollector<ButtonInteraction>;

  collector.on("collect", async (i: ButtonInteraction) => {
    await i.deferUpdate();

    const action = i.customId.split("_")[2];

    if (action === "cancel") {
      collector.stop("cancel");
      return;
    }

    if (action === "prevPage") {
      currentPage = currentPage === 0 ? pages.length - 1 : currentPage - 1;
    } else if (action === "nextPage") {
      currentPage = currentPage === pages.length - 1 ? 0 : currentPage + 1;
    }

    await interaction.editReply({
      embeds: [pages[currentPage]],
      components: [buttonRow],
    });
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] }).catch(() => {});
  });

  return collector;
};


/**
 * Create a one-shot button handler that maps customIds to async handler functions.
 * The collector stops after the first matching click (max: 1).
 */
export const createButtonHandler = ({
  channel,
  handlers,
  filter,
  time,
  onEnd,
}: {
  channel: TextBasedChannel;
  handlers: ButtonHandlerMap;
  filter: (i: ButtonInteraction) => boolean | Promise<boolean>;
  time: number;
  onEnd?: (
    collection: Collection<string, ButtonInteraction>,
    reason: string,
  ) => Promise<void>;
}): InteractionCollector<ButtonInteraction> => {
  const collector = channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time,
    max: 1,
  }) as InteractionCollector<ButtonInteraction>;

  collector.on("collect", async (i: ButtonInteraction) => {
    const handler = handlers[i.customId];
    if (handler) await handler(i);
  });

  if (onEnd) collector.on("end", onEnd);

  return collector;
};
