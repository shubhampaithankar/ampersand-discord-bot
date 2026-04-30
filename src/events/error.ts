import { Events } from "discord.js";
import { MainEvent } from "@/classes";
import Client from "@/client";
import { reportError } from "@/services/error.reporter";

export default class ErrorEvent extends MainEvent {
  constructor(client: Client) {
    super(client, Events.Error);
  }
  async run(error: Error) {
    await reportError({ source: "discord.client.error", error });
  }
}
