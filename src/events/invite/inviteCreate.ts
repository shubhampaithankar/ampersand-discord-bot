import { Events, Invite } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { applyInviteCreated } from "@/services/discord/invite.tracker";
import { reportError } from "@/services/error.reporter";

export default class InviteCreateEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.InviteCreate);
  }
  run = async (invite: Invite) => {
    try {
      await applyInviteCreated(invite);
    } catch (error) {
      await reportError({
        source: "event.inviteCreate",
        error,
        context: { guildId: invite.guild?.id, channelId: invite.channelId ?? undefined },
      });
    }
  };
}
