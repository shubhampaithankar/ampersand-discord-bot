import Client from "@/client";

(() => {
  try {
    process.removeAllListeners("warning");

    const client = new Client();
    client.initialize();
  } catch (error) {
    console.log(error);
  }
})();
