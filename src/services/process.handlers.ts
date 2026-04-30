import { reportError } from "@/services/error.reporter";

export const registerProcessHandlers = () => {
  process.on("unhandledRejection", (reason) => {
    reportError({ source: "unhandledRejection", error: reason }).catch(() => {});
  });

  process.on("uncaughtException", (error) => {
    reportError({ source: "uncaughtException", error }).catch(() => {});
  });
};
