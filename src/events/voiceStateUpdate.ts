import { ChannelType, Events, Guild, VoiceChannel, VoiceState } from "discord.js";
import { MainEvent } from "@/classes";
import { default as Client } from "@/client";
import { JTCService } from "@/models/guild";
import { checkSinglePermissions } from "@/services/discord/discord.permissions";
import { sleepFor } from "@/services/general.utils";
import { clearPanel } from "@/services/music/now.playing.panel";
import * as jtc from "@/services/redis/jtc.redis";
import type {
  CreateJTCChannelParams,
  DisconnectPlayerParams,
  HandleJTCParams,
} from "@/types/jtc.types";

export default class VoiceStateUpdateEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.VoiceStateUpdate);
  }
  async run(oldState: VoiceState, newState: VoiceState) {
    if (newState.member?.guild === null) return;
    const { guild } = newState.member! || oldState.member!;

    disconnectPlayer({ client: this.client, guild, oldState, newState });

    handleJTC({
      client: this.client,
      guild,
      oldState,
      newState,
    });
  }
}

/** JOIN TO CREATE SYSTEM */
const handleJTC = async ({ client, guild, oldState, newState }: HandleJTCParams) => {
  try {
    const bot = guild.members.cache.get(client.user!.id!);
    if (!bot) return;

    const { isAllowed } = checkSinglePermissions({
      member: bot,
      permissions: ["ManageChannels", "ManageRoles", "MoveMembers"],
    });
    if (!isAllowed) return;

    const jtcData = await JTCService.getJTC(guild.id);
    if (!jtcData?.jtc || !jtcData.jtc.enabled) return; // Check if JTC is enabled

    if (oldState.channelId === jtcData.jtc.channelId) return; // No action on leaving jtc channel

    await Promise.all([
      createJTCChannel({ guild, newState, jtcData: jtcData.jtc, bot, client }),
      deleteJTCChannel(guild, oldState),
    ]);
  } catch (error) {
    console.log(error);
  }
};

const createJTCChannel = async ({
  guild,
  newState,
  jtcData,
  bot,
  client,
}: CreateJTCChannelParams) => {
  // On joining the JTC channel
  try {
    if (newState?.channel?.id !== jtcData.channelId) return;
    const jtcChannel = guild.channels.cache.get(jtcData.channelId) as VoiceChannel;
    const { isAllowed: isJTCChannelAllowed } = checkSinglePermissions({
      member: bot,
      permissions: "ViewChannel",
      channel: jtcChannel,
    });

    if (!jtcChannel || !isJTCChannelAllowed) return;

    let channel: VoiceChannel;

    if (!jtcChannel.parent) {
      channel = await guild.channels.create({
        name: `${newState.member?.user.displayName}\`s Channel`,
        type: ChannelType.GuildVoice,
      });
    } else {
      const { isAllowed: isParentAllowed } = checkSinglePermissions({
        member: bot,
        permissions: "ViewChannel",
        channel: jtcChannel.parent,
      });
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

    await sleepFor(200); // 200ms delay

    if (channel && newState.member && newState.member.voice) {
      await newState.member.voice.setChannel(channel);
      await jtc.addToSet(guild.id, channel.id);
    }

    await sleepFor(1000 * 3); // 3 seconds delay

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

    const channel = guild.channels.cache.get(oldState.channel.id) as VoiceChannel;

    const isEmptyChannel = channel && channel.members.size === 0;
    if (!isEmptyChannel) return;

    try {
      await Promise.all([channel.delete(), jtc.removeFromSet(guild.id, channel.id)]);
    } catch (err) {
      console.log(err);
    }
  } catch (error) {
    console.log(error);
  }
};

const disconnectPlayer = async ({ client, guild, oldState, newState }: DisconnectPlayerParams) => {
  const botId = client.user!.id;
  const player = client.poru?.get(guild.id);
  if (!player) return;

  // Bot itself was disconnected (force-disconnected, moved, kicked)
  if (oldState.id === botId && oldState.channelId && !newState.channelId) {
    await clearPanel(client, player);
    player.destroy();
    return;
  }

  // Bot left alone in VC after another user departed
  if (!oldState.channel) return;
  const { members } = oldState.channel;
  if (!members.has(botId)) return;
  if (members.size !== 1) return;

  await clearPanel(client, player);
  player.destroy();
};
