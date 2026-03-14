import {
  ButtonBuilder,
  ButtonComponentData,
  ChannelType,
  EmbedBuilder,
  Guild,
  GuildBasedChannel,
  GuildMember,
  PermissionResolvable,
  TextChannel,
} from "discord.js";
import { capitalize } from "lodash";
import BaseClient from "./client";
import { EmbedDataType } from "./types";
import moment from "moment";
import {
  checkSinglePermissions,
  formatMissingPermissions,
} from "./services/discord.permissions";

export default class Utils {
  client: BaseClient;
  constructor(client: BaseClient) {
    this.client = client;
  }

  capitalizeString = (s: string) => (s && s.length > 0 ? capitalize(s) : "");

  createMessageEmbed = async (data: EmbedDataType) => {
    try {
      const embed = new EmbedBuilder();

      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          switch (key) {
            case "author":
              embed.setAuthor(data["author"]);
              break;
            case "title":
              embed.setTitle(data["title"]!);
              break;
            case "description":
              embed.setDescription(data["description"]!);
              break;
            case "color":
              embed.setColor(data["color"]!);
              break;
            case "thumbnail":
              embed.setThumbnail(data["thumbnail"]!);
              break;
            case "image":
              embed.setImage(data["image"]!);
              break;
            case "footer":
              embed.setFooter(data["footer"]!);
              break;
            case "fields":
              embed.addFields(data["fields"]!);
              break;
            case "timestamp":
              embed.setTimestamp(data["timestamp"]);
              break;
            case "url":
              embed.setURL(data["url"]!);
              break;
            default:
            // console.warn(`Unknown property: ${key}`)
          }
        }
      });

      return embed;
    } catch (error) {
      console.error("Error in creating message embed:", error);
      return null;
    }
  };

  createButton = (data: ButtonComponentData, customId: string, url: string) =>
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(data.label ?? "")
      .setStyle(data.style)
      .setEmoji(data.emoji ?? "")
      .setURL(url ?? undefined)
      .setDisabled(data.disabled ?? false);

  checkPermissionsFor = async (
    member: GuildMember,
    permissions: PermissionResolvable,
    guild: Guild,
    sendGeneral: boolean,
    channel?: GuildBasedChannel,
  ) => {
    try {
      const result = checkSinglePermissions(member, permissions, channel);

      if (!result.isAllowed && sendGeneral) {
        const general = guild.channels.cache.find(
          (ch) =>
            ch.type === ChannelType.GuildText &&
            ch.name.toLowerCase() === "general",
        ) as TextChannel | undefined;

        if (general) {
          const canSend = general
            .permissionsFor(member)
            .has(["ViewChannel", "SendMessages"], true);
          if (canSend) {
            await general.send(
              this.getMissingPermsString(result.missingPermissions, member),
            );
          }
        }
      }

      return result;
    } catch (error) {
      console.log("Error in checking permissions:", error);
      return { isAllowed: true, missingPermissions: [] };
    }
  };

  getMissingPermsString = (
    missingPermissions: string[],
    member: GuildMember,
    label: "bot" | "member" = "member",
  ) => formatMissingPermissions(missingPermissions, member, label);

  getMusicPlayer = async (
    guildId: string,
    voiceChannel?: string,
    textChannel?: string,
    create?: boolean,
  ) => {
    try {
      if (!guildId) return null;

      let player = this.client.poru?.get(guildId);

      if (!player && voiceChannel && textChannel && create) {
        player = this.client.poru?.createConnection({
          guildId,
          voiceChannel,
          textChannel,
          deaf: true,
        });
      }
      return player;
    } catch (error) {
      console.error("Error in getting music player:", error);
      return null;
    }
  };

  getError = (error: unknown) =>
    typeof error === "string"
      ? this.capitalizeString(error)
      : error instanceof Error
        ? error.message
        : error;

  formatDuration = (milliseconds: number) => {
    try {
      const duration = moment.duration(milliseconds);

      let formattedDuration = "";
      if (duration.hours() > 0) {
        formattedDuration += duration.hours().toString().padStart(2, "0") + ":";
      }
      formattedDuration +=
        duration.minutes().toString().padStart(2, "0") +
        ":" +
        duration.seconds().toString().padStart(2, "0");

      return formattedDuration;
    } catch (error) {
      console.error("Error in formatting duration:", error);
      return "";
    }
  };

  sleepFor = (time: number) =>
    new Promise((resolve) => setTimeout(resolve, time));
}
