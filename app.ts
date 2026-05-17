import Client from "@/client";
import { registerProcessHandlers } from "@/services/process.handlers";

(() => {
  try {
    process.removeAllListeners("warning");
    registerProcessHandlers();

    const client = new Client();
    client.initialize();

    // test
  } catch (error) {
    console.log(error);
  }
})();
