import { Events, Invite } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { applyInviteDeleted } from "@/services/discord/invite.tracker";
import { reportError } from "@/services/error.reporter";

export default class InviteDeleteEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.InviteDelete);
  }
  run = async (invite: Invite) => {
    try {
      await applyInviteDeleted(invite);
    } catch (error) {
      await reportError({
        source: "event.inviteDelete",
        error,
        context: { guildId: invite.guild?.id, channelId: invite.channelId ?? undefined },
      });
    }
  };
}
