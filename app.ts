import { Events } from "discord.js";

import Client from "@/client";
import { reportError } from "@/services/error.reporter";

(() => {
  try {
    process.removeAllListeners("warning");

    const client = new Client();

    process.on("unhandledRejection", (reason) => {
      try {
        reportError({ source: "unhandledRejection", error: reason }).catch(() => {});
      } catch {}
    });
    process.on("uncaughtException", (err) => {
      try {
        reportError({ source: "uncaughtException", error: err }).catch(() => {});
      } catch {}
    });
    client.on(Events.Error, (err) => {
      try {
        reportError({ source: "discord.client.error", error: err }).catch(() => {});
      } catch {}
    });
    client.on(Events.ShardError, (err, shardId) => {
      try {
        reportError({
          source: "discord.shardError",
          error: err,
          context: { extra: `shard=${shardId}` },
        }).catch(() => {});
      } catch {}
    });

    client.initialize();
  } catch (error) {
    console.log(error);
  }
})();
