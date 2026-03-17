import {
  ChannelType,
  Events,
  Guild,
  GuildMember,
  VoiceChannel,
  VoiceState,
} from "discord.js";
import { MainEvent } from "../classes";
import { default as BaseClient, default as Client } from "../client";
import * as JTCService from "../models/jtc/jtc.service";
import { checkSinglePermissions } from "../services/discord.permissions";
import * as jtc from "../services/jtc.redis";

export default class VoiceStateUpdateEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.VoiceStateUpdate);
  }
  async run(oldState: VoiceState, newState: VoiceState) {
    if (newState.member?.guild === null) return;
    const { guild } = newState.member! || oldState.member!;

    handleJTC({
      client: this.client,
      guild,
      oldState,
      newState,
    });
  }
}

/** JOIN TO CREATE SYSTEM */
const handleJTC = async ({
  client,
  guild,
  oldState,
  newState,
}: {
  client: BaseClient;
  guild: Guild;
  oldState: VoiceState;
  newState: VoiceState;
}) => {
  try {
    const bot = guild.members.cache.get(client.user!.id!);
    if (!bot) return;

    const { isAllowed } = checkSinglePermissions(bot, [
      "ManageChannels",
      "ManageRoles",
      "MoveMembers",
    ]);
    if (!isAllowed) return;

    const jtcData = await JTCService.getJTC(guild.id);
    if (!jtcData || !jtcData.enabled) return; // Check if JTC is enabled

    if (oldState.channelId === jtcData.channelId) return; // No action on leaving jtc channel

    await Promise.all([
      createJTCChannel(guild, newState, jtcData, bot, client),
      deleteJTCChannel(guild, oldState),
    ]);
  } catch (error) {
    console.log(error);
  }
};

const createJTCChannel = async (
  guild: Guild,
  newState: VoiceState,
  jtcData: any,
  bot: GuildMember,
  client: Client,
) => {
  // On joining the JTC channel
  try {
    if (newState?.channel?.id !== jtcData.channelId) return;
    const jtcChannel = guild.channels.cache.get(
      jtcData.channelId,
    ) as VoiceChannel;
    const { isAllowed: isJTCChannelAllowed } = checkSinglePermissions(
      bot,
      "ViewChannel",
      jtcChannel,
    );

    if (!jtcChannel || !isJTCChannelAllowed) return;

    let channel: VoiceChannel;

    if (!jtcChannel.parent) {
      channel = await guild.channels.create({
        name: `${newState.member?.user.displayName}\`s Channel`,
        type: ChannelType.GuildVoice,
      });
    } else {
      const { isAllowed: isParentAllowed } = checkSinglePermissions(
        bot,
        "ViewChannel",
        jtcChannel.parent,
      );
      if (!isParentAllowed) return;

      channel = await jtcChannel.parent.children.create({
        name: `${newState.member?.user.displayName}\`s Channel`,
        type: ChannelType.GuildVoice,
      });
    }

    // Lock channel to prevent spam
    await jtcChannel.permissionOverwrites.edit(guild.roles.everyone, {
      Connect: false,
    });

    await client.utils.sleepFor(200); // 200ms delay

    if (channel && newState.member && newState.member.voice) {
      await newState.member.voice.setChannel(channel);
      await jtc.addToSet(guild.id, channel.id);
    }

    await client.utils.sleepFor(1000 * 3); // 3 seconds delay

    if (!jtcChannel) return;
    await jtcChannel.permissionOverwrites.edit(guild.roles.everyone, {
      Connect: null,
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteJTCChannel = async (guild: Guild, oldState: VoiceState) => {
  // On leaving channel created by jtc module
  try {
    if (!oldState || !oldState.channel) return;
    const isJtc = await jtc.isPresent(guild.id, oldState.channel.id);

    if (!isJtc) return;

    const channel = guild.channels.cache.get(
      oldState.channel.id,
    ) as VoiceChannel;

    const isEmptyChannel = channel && channel.members.size === 0;
    if (!isEmptyChannel) return;

    try {
      await Promise.all([
        channel.delete(),
        jtc.removeFromSet(guild.id, channel.id),
      ]);
    } catch (err) {
      console.log(err);
    }
  } catch (error) {
    console.log(error);
  }
};
