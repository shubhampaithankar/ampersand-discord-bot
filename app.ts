import Client from "@/client";
import { registerProcessHandlers } from "@/services/process.handlers";

(() => {
  try {
    process.removeAllListeners("warning");
    registerProcessHandlers();

    const client = new Client();
    client.initialize();
  } catch (error) {
    console.log(error);
  }
})();
