import { CacheType, Events, RepliableInteraction } from "discord.js";
import { MainEvent } from "../../classes";
import Client from "../../client";
import * as MusicService from "../../models/guild/music.service";
import {
  checkPermissions,
  formatMissingPermissions,
} from "../../services/discord/discord.permissions";
import {
  getRemainingCooldown,
  setCooldown,
} from "../../services/redis/cooldown.redis";
import type { HandleCooldownParams } from "../../types/cooldown.types";
import { InteractionType } from "../../types/interaction.types";

export default class InteractionCreate extends MainEvent {
  constructor(client: Client) {
    super(client, Events.InteractionCreate);
  }
  async run(interaction: InteractionType) {
    try {
      if (!interaction.inGuild()) return;
      const guild = interaction.guild!;

      const bot = guild.members.cache.get(this.client.user!.id!);
      if (!bot) return;

      const member = guild.members.cache.get(interaction.member.user.id);
      if (!member) return;

      const commandName: string | null =
        interaction.message?.interaction?.commandName ||
        interaction.commandName ||
        null;
      if (!commandName) return;

      const command =
        this.client.interactions.get(commandName) ||
        this.client.aliases.get(commandName);
      if (!command) return;

      command.bot = bot;

      if (command.permissions) {
        const {
          botAllowed,
          memberAllowed,
          missingBotPermissions,
          missingMemberPermissions,
        } = checkPermissions({ bot, member, permissions: command.permissions });

        if (!botAllowed) {
          await command.reject({
            interaction: interaction as RepliableInteraction<CacheType>,
            message: formatMissingPermissions({
              missing: missingBotPermissions,
              member: bot,
              label: "bot",
            }),
          });
          return;
        }

        if (!memberAllowed) {
          await command.reject({
            interaction: interaction as RepliableInteraction<CacheType>,
            message: formatMissingPermissions({
              missing: missingMemberPermissions,
              member,
              label: "member",
            }),
          });
          return;
        }
      }

      if (!interaction.customId) {
        const onCooldown = await handleCooldown({ member, commandName, command, interaction });
        if (!onCooldown) return;

        const channel = interaction.channel;

        switch (command.category) {
          case "Music": {
            const channelIds = await verifyMusicCommand(
              guild.id,
              channel?.id ?? "",
            );

            if (!channelIds) {
              await command.reject({
                interaction: interaction as RepliableInteraction<CacheType>,
                message: `Music module is currently disabled. Run /setmusic command to enable it.`,
              });
              return;
            }

            if (!channelIds?.includes(channel?.id ?? "")) {
              await command.reject({
                interaction: interaction as RepliableInteraction<CacheType>,
                message: `**${channel?.toString() ?? "This channel"}** is \`not present\` in music database for **${guild.name}**.\n Add it by using the \`/addmusicchannel\` command.`,
              });
              return;
            }
            break;
          }

          default:
            break;
        }

        await setCooldown({ commandName, userId: member.user.id, ttlSeconds: command.cooldown || 2 });
        await command.run(interaction);
      }
    } catch (error) {
      console.log(`There was an error in ${this.name}`);
      console.log(error);
    }
  }
}

const verifyMusicCommand = async (guildId: string, channelId: string) => {
  const guildMusicData = await MusicService.getMusic(guildId);
  if (!guildMusicData?.music || !guildMusicData.music.enabled) return null;
  return guildMusicData.music.channelIds;
};

const handleCooldown = async ({
  member,
  commandName,
  command,
  interaction,
}: HandleCooldownParams): Promise<boolean> => {
  const remaining = await getRemainingCooldown(commandName, member.user.id);

  if (remaining > 0) {
    const timeLeft = remaining / 1000;
    await command.reject({
      interaction: interaction as RepliableInteraction<CacheType>,
      message: `You're on cooldown for this command. Please wait ${timeLeft.toFixed(1)} seconds.`,
    });
    return false;
  }

  return true;
};
