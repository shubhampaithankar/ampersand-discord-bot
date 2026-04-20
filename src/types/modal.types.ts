import type { TextInputStyle } from "discord.js";

export interface TextInputOpts {
  customId: string;
  label: string;
  style?: TextInputStyle;
  placeholder?: string;
  value?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface ModalOpts {
  customId: string;
  title: string;
  inputs: TextInputOpts[];
}
