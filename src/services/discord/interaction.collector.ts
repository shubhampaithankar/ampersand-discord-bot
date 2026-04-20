import {
  ComponentType,
  InteractionCollector,
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageComponentInteraction,
} from "discord.js";
import type {
  ButtonHandlerMap,
  ChainedCollectorStep,
  CreateButtonHandlerParams,
  CreateChainedCollectorParams,
  CreatePaginatorParams,
} from "../../types/collector.types";

export type { ButtonHandlerMap };

/**
 * Generate consistent button custom IDs anchored to a slash command interaction,
 * so they are unique per invocation and channel.
 *
 * @example
 * const ids = buildCustomIds(interaction, 'prevPage', 'nextPage', 'cancel');
 * // ids.prevPage === `${channelId}_${interactionId}_prevPage`
 */
export const buildCustomIds = <T extends string>({
  interaction,
  actions,
}: {
  interaction: ChatInputCommandInteraction;
  actions: readonly T[];
}): Record<T, string> =>
  Object.fromEntries(
    actions.map((action) => [action, `${interaction.channelId}_${interaction.id}_${action}`]),
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
}: CreatePaginatorParams): InteractionCollector<ButtonInteraction> | null => {
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
 * Create a button handler that maps customIds to async handler functions.
 *
 * Pass `max: 1` for a one-shot handler (e.g. confirm dialogs).
 * Omit `max` for a persistent panel handler that stays active until `time` expires.
 */
export const createButtonHandler = ({
  channel,
  handlers,
  filter,
  time,
  max,
  onEnd,
}: CreateButtonHandlerParams): InteractionCollector<ButtonInteraction> => {
  const collector = channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time,
    ...(max !== undefined && { max }),
  }) as InteractionCollector<ButtonInteraction>;

  collector.on("collect", async (i: ButtonInteraction) => {
    const handler = handlers[i.customId];
    if (handler) await handler(i);
  });

  if (onEnd) collector.on("end", onEnd);

  return collector;
};

/**
 * Create a multi-step component collector that chains steps sequentially.
 *
 * Each step's handler receives the interaction and returns either the next
 * step's config (to continue the chain) or null (to terminate).
 *
 * @example
 * createChainedCollector({
 *   channel: interaction.channel!,
 *   step: {
 *     componentType: ComponentType.Button,
 *     filter: (i) => i.customId === ids.confirm && i.user.id === userId,
 *     time: 60_000,
 *     handler: async (i) => {
 *       await i.deferUpdate();
 *       // optionally return next step config or null
 *       return null;
 *     },
 *   },
 * });
 */
export const createChainedCollector = ({ channel, step }: CreateChainedCollectorParams): void => {
  const collector = channel.createMessageComponentCollector({
    componentType: step.componentType as any,
    filter: step.filter as any,
    time: step.time,
    max: step.max ?? 1,
  });

  collector.on("collect", async (i: MessageComponentInteraction) => {
    const nextStep = await step.handler(i);
    if (nextStep) {
      createChainedCollector({ channel, step: nextStep });
    }
  });

  if (step.onEnd) collector.on("end", step.onEnd as any);
};
