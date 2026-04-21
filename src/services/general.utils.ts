import { capitalize } from "lodash";
import moment from "moment";

export const capitalizeString = (s: string) => (s && s.length > 0 ? capitalize(s) : "");

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

export const sleepFor = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Map an array in chunks of parallel `size`, preserving input order.
 * Each chunk awaits `Promise.all(fn)` before the next chunk starts.
 * `fn` should handle its own errors if per-item failures must not abort the batch.
 */
export const mapInChunks = async <T, R>(
  items: T[],
  size: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  if (size <= 0) throw new Error("mapInChunks: size must be > 0");
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    const results = await Promise.all(slice.map((item, j) => fn(item, i + j)));
    out.push(...results);
  }
  return out;
};
