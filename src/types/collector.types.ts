import { ButtonInteraction } from "discord.js";

export type ButtonHandlerMap = Record<
  string,
  (interaction: ButtonInteraction) => Promise<void>
>;
