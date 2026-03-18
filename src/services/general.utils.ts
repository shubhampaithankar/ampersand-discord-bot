import { capitalize } from "lodash";
import moment from "moment";

export const capitalizeString = (s: string) =>
  s && s.length > 0 ? capitalize(s) : "";

export const getError = (error: unknown): unknown =>
  typeof error === "string"
    ? capitalizeString(error)
    : error instanceof Error
      ? error.message
      : error;

export const formatDuration = (milliseconds: number): string => {
  try {
    const duration = moment.duration(milliseconds);

    let formattedDuration = "";
    if (duration.hours() > 0) {
      formattedDuration += duration.hours().toString().padStart(2, "0") + ":";
    }
    formattedDuration +=
      duration.minutes().toString().padStart(2, "0") +
      ":" +
      duration.seconds().toString().padStart(2, "0");

    return formattedDuration;
  } catch (error) {
    console.error("Error in formatting duration:", error);
    return "";
  }
};

export const sleepFor = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));
