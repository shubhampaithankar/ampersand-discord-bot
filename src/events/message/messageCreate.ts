import { randomInt } from "crypto";
import { Events, Message } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { AutoGambleService, GuildService } from "@/models/guild";
import { reportError } from "@/services/error.reporter";
import { incrementGambleScore } from "@/services/redis/gamble.redis";
import { cacheGuildExists, getCachedGuildExists } from "@/services/redis/guild.redis";

export default class MessageCreate extends MainEvent {
  constructor(client: Client) {
    super(client, Events.MessageCreate);
  }

  async run(message: Message) {
    try {
      if (message.author.bot || !message.inGuild()) return;

      const guildId = message.guildId!;
      const cached = await getCachedGuildExists(guildId);
      if (cached === false) return;
      if (cached === null) {
        const doc = await GuildService.getGuild(guildId);
        await cacheGuildExists(guildId, !!doc);
        if (!doc) return;
      }

      await handleAutoGamble(message);
    } catch (error) {
      await reportError({
        source: "event.messageCreate",
        error,
        context: {
          guildId: message.guildId ?? undefined,
          guildName: message.guild?.name,
          channelId: message.channelId,
          userId: message.author.id,
          userName: message.author.username,
        },
      });
    }
  }
}

const handleAutoGamble = async (message: Message) => {
  try {
    if (message.author.bot) return;

    const guildData = await AutoGambleService.getAutoGamble(message.guildId!);
    if (!guildData?.autoGamble?.enabled) return;

    const { channelIds } = guildData.autoGamble;
    if (!channelIds?.includes(message.channelId)) return;

    const chance = guildData.autoGamble?.chance ?? 10;
    const timeoutDuration = guildData.autoGamble?.timeoutDuration ?? 30;

    const roll = randomInt(1, 101);
    if (roll > chance) return;

    const member = message.member;
    if (!member) return;

    if (member.permissions.has("Administrator")) return;
    if (!member.moderatable) return;

    await member.timeout(timeoutDuration * 1000, "Auto Gamble: unlucky roll");
    await incrementGambleScore(message.guildId!, member.id);

    await message.channel.send(
      `🎲 ${member} rolled unlucky and got timed out for **${timeoutDuration}s**!`,
    );
  } catch (error) {
    await reportError({
      source: "messageCreate.autoGamble",
      error,
      context: {
        guildId: message.guildId ?? undefined,
        guildName: message.guild?.name,
        channelId: message.channelId,
        userId: message.author.id,
        userName: message.author.username,
      },
    });
  }
};
