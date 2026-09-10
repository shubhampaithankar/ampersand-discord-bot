import { Events, GuildMember } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { attributeJoin } from "@/services/discord/invite.tracker";
import { reportError } from "@/services/error.reporter";

export default class GuildMemberAddEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.GuildMemberAdd);
  }
  run = async (member: GuildMember) => {
    try {
      await attributeJoin(member);
    } catch (error) {
      await reportError({
        source: "event.guildMemberAdd",
        error,
        context: { guildId: member.guild.id, guildName: member.guild.name, userId: member.id },
      });
    }
  };
}
