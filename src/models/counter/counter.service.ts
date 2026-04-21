import { escapeRegex } from "@/services/general.utils";
import Counter from "@/models/counter/counter.model";
import type { CounterActor, CounterData } from "@/models/counter/counter.types";

export const getCounter = (guildId: string, name: string) =>
  Counter.findOne({ guildId, name: name.toLowerCase() })
    .lean<CounterData | null>()
    .catch(() => null);

export const listCounters = (guildId: string) =>
  Counter.find({ guildId })
    .sort({ name: 1 })
    .limit(100)
    .lean<CounterData[]>()
    .catch(() => [] as CounterData[]);

export const searchCountersByPrefix = (guildId: string, prefix: string, limit = 25) =>
  Counter.find({
    guildId,
    name: { $regex: `^${escapeRegex(prefix.toLowerCase())}` },
  })
    .sort({ name: 1 })
    .limit(limit)
    .lean<CounterData[]>()
    .catch(() => [] as CounterData[]);

export const createCounter = (data: {
  guildId: string;
  name: string;
  actor: CounterActor;
  createdBy: string;
}) =>
  Counter.create({
    guildId: data.guildId,
    name: data.name.toLowerCase(),
    actor: data.actor,
    createdBy: data.createdBy,
    value: 0,
  });

export const updateCounter = (
  guildId: string,
  name: string,
  update: Partial<Pick<CounterData, "actor" | "value">>,
) =>
  Counter.findOneAndUpdate({ guildId, name: name.toLowerCase() }, { $set: update }, { new: true })
    .lean<CounterData | null>()
    .catch((e) => {
      console.log("Database Error: while updating counter:\n", e);
      return null;
    });

export const incrementCounter = (guildId: string, name: string) =>
  Counter.findOneAndUpdate(
    { guildId, name: name.toLowerCase() },
    { $inc: { value: 1 } },
    { new: true },
  )
    .lean<CounterData | null>()
    .catch(() => null);

export const decrementCounter = (guildId: string, name: string) =>
  Counter.findOneAndUpdate(
    { guildId, name: name.toLowerCase() },
    { $inc: { value: -1 } },
    { new: true },
  )
    .lean<CounterData | null>()
    .catch(() => null);

export const deleteCounter = async (guildId: string, name: string) => {
  const res = await Counter.deleteOne({ guildId, name: name.toLowerCase() }).catch(() => null);
  return !!res && res.deletedCount > 0;
};
