import { ChannelType } from "discord.js";

export interface ChannelSelectOpts {
  customId: string;
  types: ChannelType[];
  placeholder?: string;
}

export interface StringSelectOption {
  label: string;
  value: string;
}

export interface StringSelectOpts {
  customId: string;
  options: StringSelectOption[];
  placeholder?: string;
}

export interface RoleSelectOpts {
  customId: string;
  placeholder?: string;
}

export interface UserSelectOpts {
  customId: string;
  placeholder?: string;
}
