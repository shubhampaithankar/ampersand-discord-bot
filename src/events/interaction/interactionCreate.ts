import { CacheType, Events, GuildMember, RepliableInteraction } from "discord.js";
import { MainEvent, MainInteraction } from "../../classes";
import Client from "../../client";
import * as MusicService from "../../models/music/music.service";
import {
  checkPermissions,
  formatMissingPermissions,
} from "../../services/discord.permissions";
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
        const { cooldowns } = this.client;

        const timestamps = await handleCooldown({
          member,
          commandName,
          cooldowns,
          command,
          interaction,
        });

        if (!timestamps) return;

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

        timestamps.set(member.user.id, Date.now());
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
  if (!guildMusicData || !guildMusicData.enabled) return null;
  return guildMusicData.channelIds;
};

const handleCooldown = async ({
  member,
  commandName,
  cooldowns,
  command,
  interaction,
}: {
  member: GuildMember;
  commandName: string;
  cooldowns: Map<string, Map<string, number>>;
  command: MainInteraction;
  interaction: InteractionType;
}) => {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName)!;
  const cooldownAmount = (command.cooldown || 2) * 1000;

  if (timestamps.has(member.user.id)) {
    const expirationTime = timestamps.get(member.user.id)! + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000; // Convert milliseconds to seconds
      await command.reject({
        interaction: interaction as RepliableInteraction<CacheType>,
        message: `You're on cooldown for this command. Please wait ${timeLeft.toFixed(1)} seconds.`,
      });
      return null;
    }
  }

  return timestamps;
};
