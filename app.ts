import { Status } from "discord.js";

import Client from "@/client";
import { HEALTH_PORT } from "@/constants";
import { registerProcessHandlers } from "@/services/process.handlers";

(() => {
  try {
    process.removeAllListeners("warning");
    registerProcessHandlers();

    const client = new Client();
    client.initialize();

    // Liveness probe for the container healthcheck. An ESTABLISHED :443 socket does NOT prove the
    // gateway is up -- the bot also holds REST connections to the same range, so a shard stuck in a
    // reconnect loop reads as alive at the TCP layer. That is what hid the 2026-08-23 outage for
    // three days. Status.Ready is 0 (discord.js `Status`, NOT `WebSocketShardStatus` where Ready=3).
    Bun.serve({
      port: HEALTH_PORT,
      fetch: () => new Response(null, { status: client.ws.status === Status.Ready ? 200 : 503 }),
    });
  } catch (error) {
    console.log(error);
  }
})();
